<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
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
     * Update the authenticated user's password and complete first-login verification.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
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
}
