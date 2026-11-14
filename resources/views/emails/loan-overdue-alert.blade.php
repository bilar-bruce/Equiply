@extends('emails.layout')

@section('title', 'OVERDUE ALERT: Immediate Equipment Return Required • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        OVERDUE ALERT: Immediate Return Required, {{ $rental->borrower?->name ?? 'Student Borrower' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your equipment loan is now <strong>past due</strong>. Please return the borrowed item immediately to the USTP Facility Operations Desk.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <tr>
            <td style="padding-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Rental Reference Code
                </div>
                <div style="display: inline-block; background-color: #1B1642; color: #F5A623; font-size: 18px; font-weight: 800; letter-spacing: 0.08em; font-family: monospace; padding: 6px 14px; border-radius: 6px; margin-top: 6px;">
                    {{ $rental->rental_code }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Overdue Equipment
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name ?? 'Campus Equipment' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Missed Return Due Time
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #b91c1c; margin-top: 2px;">
                    {{ $rental->schedule['due_time'] ?? 'N/A' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Active Collateral Hold
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->financials['collateral_held'] ?? 'Academic Clearance Hold' }}
                </div>
            </td>
        </tr>
    </table>

    <div style="background-color: #fef2f2; border-left: 4px solid #F5A623; padding: 14px 16px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; color: #1B1642;">
        <strong>Urgent Late Surcharge Notice:</strong> This loan is past due and is actively accruing a <strong>₱15.00/hr</strong> facility late surcharge. Your collateral ({{ $rental->financials['collateral_held'] ?? 'Academic Clearance Hold' }}) remains locked until the equipment is checked in and all fees are settled at the USTP Facility Operations Desk.
    </div>
@endsection
