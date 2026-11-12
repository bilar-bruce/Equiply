@extends('emails.layout')

@section('title', 'Equiply Password Reset • 6-Digit Verification Code')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Password Reset Request
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Hello <strong>{{ $user->name }}</strong> ({{ $user->id_number }}), we received a request to reset the password for your USTP Equiply campus account. Use the 6-digit verification code below to complete your password reset:
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
        <tr>
            <td>
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; margin-bottom: 8px;">
                    6-Digit Password Reset OTP
                </div>
                <div style="display: inline-block; background-color: #1B1642; color: #F5A623; font-size: 26px; font-weight: 800; letter-spacing: 0.22em; font-family: monospace; padding: 10px 20px; border-radius: 8px;">
                    {{ $otpCode }}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 10px;">
                    Expires in <strong>{{ $expiresInMinutes }} minutes</strong>
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">
        <strong>Security Notice:</strong> This one-time verification code can only be used once. If you did not request a password reset, you can safely ignore this email and your existing password will remain unchanged.
    </p>
@endsection
