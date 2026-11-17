<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Mail\PasswordResetOtpMail;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Authenticate user with email or campus id_number and password.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => [
                'bail',
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (! is_string($value)) {
                        return;
                    }
                    $val = trim($value);
                    $isTenDigit = (bool) preg_match('/^\d{10}$/', $val);
                    $isEmail = (bool) filter_var($val, FILTER_VALIDATE_EMAIL);
                    if (! $isTenDigit && ! $isEmail) {
                        $fail('The login identifier must be a valid 10-digit USTP Campus ID (e.g. 2024300616) or a valid email address.');
                    }
                },
            ],
            'password' => 'required|string|min:8',
            'device_name' => 'nullable|string|max:100',
        ], [
            'login.required' => 'Please provide your 10-digit USTP ID or campus email.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters in length.',
        ]);

        $cleanLogin = trim($validated['login']);
        $user = User::where('email', $cleanLogin)
            ->orWhere('id_number', $cleanLogin)
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['The provided credentials do not match our records.'],
            ]);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'message' => "Account is currently {$user->status}. Please contact the facility custodian or administrator.",
            ], 403);
        }

        $deviceName = $validated['device_name'] ?? 'equiply-web-client';
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Public self-registration endpoint (Disabled in favor of in-person facility provisioning).
     */
    public function register(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Public self-registration is disabled. Student accounts are issued in person at the Campus Facility Desk upon presenting a valid USTP School ID.',
        ], 403);
    }

    /**
     * Get the authenticated user's profile.
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Revoke current token and logout.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Update the authenticated user's self-service profile fields (contact number).
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'contact_number' => 'required|string|max:30',
        ]);

        $user = $request->user();
        $user->contact_number = trim($validated['contact_number']);
        $user->save();

        return response()->json([
            'message' => 'Contact number updated successfully.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Update the authenticated user's password and complete first-login verification.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed|different:current_password',
        ], [
            'password.different' => 'Your new password must be different from your temporary password.',
        ]);

        $user = $request->user();

        if (! Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password you entered is incorrect.'],
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->must_change_password = false;
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->verification_code = null;
        $user->save();

        return response()->json([
            'message' => 'Password updated and account verified successfully.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Issue a 6-digit password reset OTP and send it to the user's registered campus email.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => [
                'bail',
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (! is_string($value)) {
                        return;
                    }
                    $val = trim($value);
                    $isTenDigit = (bool) preg_match('/^\d{10}$/', $val);
                    $isEmail = (bool) filter_var($val, FILTER_VALIDATE_EMAIL);
                    if (! $isTenDigit && ! $isEmail) {
                        $fail('The login identifier must be a valid 10-digit USTP Campus ID (e.g. 2024300616) or a valid email address.');
                    }
                },
            ],
        ], [
            'login.required' => 'Please provide your 10-digit USTP ID or campus email.',
        ]);

        $cleanLogin = trim($validated['login']);
        $user = User::where('email', $cleanLogin)
            ->orWhere('id_number', $cleanLogin)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'login' => ['We could not find an enrolled USTP campus account matching that 10-digit ID or email address.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => ["Account is currently {$user->status}. Please contact the facility custodian or administrator."],
            ]);
        }

        $otpCode = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $expiresInMinutes = 15;

        $user->password_reset_otp = Hash::make($otpCode);
        $user->password_reset_expires_at = now()->addMinutes($expiresInMinutes);
        $user->save();

        Mail::to($user->email)->send(new PasswordResetOtpMail($user, $otpCode, $expiresInMinutes));

        return response()->json([
            'message' => 'A 6-digit password reset code has been sent to your registered campus email.',
        ]);
    }

    /**
     * Verify the 6-digit OTP and reset the user's password, revoking active Sanctum tokens.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'login' => 'required|string',
            'otp' => ['required', 'string', 'regex:/^\d{6}$/'],
            'password' => 'required|string|min:8|confirmed',
        ], [
            'login.required' => 'Please provide your 10-digit USTP ID or campus email.',
            'otp.required' => 'Please enter the 6-digit verification code sent to your email.',
            'otp.regex' => 'The verification code must be an exact 6-digit numeric code.',
            'password.min' => 'New password must be at least 8 characters in length.',
        ]);

        $cleanLogin = trim($validated['login']);
        $user = User::where('email', $cleanLogin)
            ->orWhere('id_number', $cleanLogin)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'login' => ['We could not find an enrolled USTP campus account matching that 10-digit ID or email address.'],
            ]);
        }

        if ($user->status !== 'active') {
            throw ValidationException::withMessages([
                'login' => ["Account is currently {$user->status}. Please contact the facility custodian or administrator."],
            ]);
        }

        if (
            empty($user->password_reset_otp) ||
            empty($user->password_reset_expires_at) ||
            now()->greaterThan($user->password_reset_expires_at)
        ) {
            throw ValidationException::withMessages([
                'otp' => ['This verification code has expired or has already been used. Please request a new code.'],
            ]);
        }

        if (! Hash::check($validated['otp'], $user->password_reset_otp)) {
            throw ValidationException::withMessages([
                'otp' => ['The 6-digit verification code you entered is invalid.'],
            ]);
        }

        $user->password = Hash::make($validated['password']);
        $user->password_reset_otp = null;
        $user->password_reset_expires_at = null;
        $user->must_change_password = false;
        $user->email_verified_at = $user->email_verified_at ?? now();
        $user->verification_code = null;
        $user->save();

        // Revoke all existing Sanctum personal access tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Your password has been reset successfully. You may now sign in with your new password.',
        ]);
    }
}
