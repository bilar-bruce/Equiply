<?php

use App\Models\User;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('users.{id}', function (User $user, string $id): bool {
    return (string) $user->_id === (string) $id;
});

Broadcast::channel('custodian.ops', function (User $user): bool {
    return in_array($user->role, ['custodian', 'admin'], true);
});
