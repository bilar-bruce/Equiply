<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminController extends Controller
{
    /**
     * Retrieve paginated list of campus accounts with filtering and summary metrics.
     * Strictly restricted to role === 'admin'.
     */
    public function index(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Access restricted: Administrator credentials required.',
            ], 403);
        }

        $query = User::query();

        // Keyword search (Name, 10-digit ID, or Email)
        if ($request->filled('search')) {
            $search = trim($request->input('search'));
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('id_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Role filter
        if ($request->filled('role') && in_array($request->input('role'), ['student', 'custodian', 'admin'])) {
            $query->where('role', $request->input('role'));
        }

        // Status filter
        if ($request->filled('status') && in_array($request->input('status'), ['active', 'suspended'])) {
            $query->where('status', $request->input('status'));
        }

        // Peer lender filter
        if ($request->has('is_peer_lender')) {
            $isPeer = filter_var($request->input('is_peer_lender'), FILTER_VALIDATE_BOOLEAN);
            $query->where('is_peer_lender', $isPeer);
        }

        $users = $query->orderBy('created_at', 'desc')->get();

        // Calculate summary metrics across all users
        $allUsers = User::all();
        $metrics = [
            'total_accounts' => $allUsers->count(),
            'active_students' => $allUsers->where('role', 'student')->where('status', 'active')->count(),
            'peer_lenders' => $allUsers->where('is_peer_lender', true)->count(),
            'staff_members' => $allUsers->whereIn('role', ['custodian', 'admin'])->count(),
            'suspended_accounts' => $allUsers->where('status', 'suspended')->count(),
        ];

        return response()->json([
            'metrics' => $metrics,
            'users' => UserResource::collection($users),
        ]);
    }

    /**
     * In-person Facility Account Provisioning.
     * Facility staff (Admin or Custodian) verifies physical USTP ID and registers account.
     */
    public function store(Request $request): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'admin' && $currentUser->role !== 'custodian') {
            return response()->json([
                'message' => 'Access restricted: Staff or Administrator credentials required.',
            ], 403);
        }

        $validated = $request->validate([
            'id_number' => [
                'required',
                'regex:/^\d{10}$/',
                'unique:users,id_number',
            ],
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|unique:users,email',
            'contact_number' => 'required|string|max:20',
            'role' => ['nullable', 'string', Rule::in(['student', 'custodian', 'admin'])],
            'is_peer_lender' => 'nullable|boolean',
            'password' => 'nullable|string|min:6',
        ], [
            'id_number.regex' => 'The campus ID must follow the standard 10-digit format (e.g. 2024300616).',
            'id_number.unique' => 'A user account with this 10-digit USTP ID is already registered.',
            'email.unique' => 'A user account with this email address is already registered.',
        ]);

        // Custodians can only enroll students; only Admins can create Custodian or Admin roles
        $targetRole = 'student';
        if ($currentUser->role === 'admin' && !empty($validated['role'])) {
            $targetRole = $validated['role'];
        }

        // Default initial temporary password if not provided
        $plainPassword = $validated['password'] ?? ('USTP@' . $validated['id_number']);

        $user = User::create([
            'id_number' => $validated['id_number'],
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($plainPassword),
            'role' => $targetRole,
            'is_peer_lender' => filter_var($validated['is_peer_lender'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'contact_number' => $validated['contact_number'],
            'status' => 'active',
        ]);

        return response()->json([
            'message' => "Campus account [{$user->id_number}] successfully enrolled.",
            'user' => new UserResource($user),
            'temporary_password' => empty($validated['password']) ? $plainPassword : null,
        ], 201);
    }

    /**
     * Toggle account status between 'active' and 'suspended'.
     * Includes self-suspension lockout protection.
     */
    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Access restricted: Administrator credentials required.',
            ], 403);
        }

        $user = User::findOrFail($id);

        // Prevent admin from suspending their own active session
        if ((string)$user->_id === (string)$currentUser->_id) {
            return response()->json([
                'message' => 'Self-suspension lockout: You cannot suspend your own administrative account.',
            ], 422);
        }

        $validated = $request->validate([
            'status' => ['required', Rule::in(['active', 'suspended'])],
        ]);

        $user->status = $validated['status'];
        $user->save();

        return response()->json([
            'message' => "Account [{$user->id_number}] status changed to {$user->status}.",
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Grant or revoke peer lending privileges (is_peer_lender).
     */
    public function updatePeerLender(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Access restricted: Administrator credentials required.',
            ], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'is_peer_lender' => 'required|boolean',
        ]);

        $user->is_peer_lender = $validated['is_peer_lender'];
        $user->save();

        $action = $user->is_peer_lender ? 'granted' : 'revoked';

        return response()->json([
            'message' => "Peer lending privileges {$action} for account [{$user->id_number}].",
            'user' => new UserResource($user),
        ]);
    }

    /**
     * Update user role with self-demotion lockout protection.
     */
    public function updateRole(Request $request, string $id): JsonResponse
    {
        $currentUser = $request->user();
        if ($currentUser->role !== 'admin') {
            return response()->json([
                'message' => 'Access restricted: Administrator credentials required.',
            ], 403);
        }

        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => ['required', Rule::in(['student', 'custodian', 'admin'])],
        ]);

        // Self-demotion lockout protection
        if ((string)$user->_id === (string)$currentUser->_id && $validated['role'] !== 'admin') {
            return response()->json([
                'message' => 'Self-demotion lockout: You cannot revoke your own administrator privileges.',
            ], 422);
        }

        $user->role = $validated['role'];
        $user->save();

        return response()->json([
            'message' => "Account [{$user->id_number}] role updated to {$user->role}.",
            'user' => new UserResource($user),
        ]);
    }
}

