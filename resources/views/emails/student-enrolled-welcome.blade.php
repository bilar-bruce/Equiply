@extends('emails.layout')

@section('title', 'Welcome to Equiply • USTP Campus Account Enrolled')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Welcome to Equiply, {{ $user->name }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your USTP campus account has been provisioned at the Facility Operations desk. Below are your initial sign-in credentials and email verification code.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <tr>
            <td style="padding-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    10-Digit Campus ID
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; font-family: monospace; margin-top: 2px;">
                    {{ $user->id_number }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Temporary Password
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; font-family: monospace; margin-top: 2px;">
                    {{ $temporaryPassword }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    6-Digit Email Verification Code
                </div>
                <div style="display: inline-block; background-color: #1B1642; color: #F5A623; font-size: 22px; font-weight: 800; letter-spacing: 0.18em; font-family: monospace; padding: 8px 16px; border-radius: 6px; margin-top: 6px;">
                    {{ $verificationCode }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">
        <strong>First-Login Security Notice:</strong> Upon your first sign-in to Equiply, you will be prompted to set a permanent password and enter your 6-digit verification code to activate full campus portal access.
    </p>
@endsection
