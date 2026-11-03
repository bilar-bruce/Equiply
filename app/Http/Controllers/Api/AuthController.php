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
            'login' => 'required|string', // Can be email or id_number
            'password' => 'required|string',
            'device_name' => 'nullable|string',
        ]);

        $user = User::where('email', $validated['login'])
            ->orWhere('id_number', $validated['login'])
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
}
