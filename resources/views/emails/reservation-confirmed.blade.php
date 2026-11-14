@extends('emails.layout')

@section('title', 'Reservation Confirmed • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Reservation Confirmed, {{ $rental->borrower?->name ?? 'Student Borrower' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your equipment reservation has been locked at the USTP Facility Operations desk. Present your reference code and campus credentials when claiming your item.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <tr>
            <td style="padding-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Reservation Reference Code
                </div>
                <div style="display: inline-block; background-color: #1B1642; color: #F5A623; font-size: 18px; font-weight: 800; letter-spacing: 0.08em; font-family: monospace; padding: 6px 14px; border-radius: 6px; margin-top: 6px;">
                    {{ $rental->rental_code }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Reserved Equipment
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name ?? 'Campus Equipment' }}
                </div>
                <div style="font-size: 12px; color: #64748b; font-family: monospace; margin-top: 2px;">
                    Asset Code: {{ $rental->item?->item_code ?? 'N/A' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Flat Rental Fee &amp; Collateral
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    ₱{{ number_format((float) ($rental->financials['total_fee'] ?? 0), 2) }}
                </div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                    Collateral: {{ $rental->financials['collateral_held'] ?? 'Academic Clearance Hold' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Pickup Window Deadline
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['expires_at'] ?? 'Within 30 minutes of reservation' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Scheduled Due Return Time
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['due_time'] ?? 'N/A' }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Claiming Notice:</strong> Unclaimed reservations expire automatically after the pickup window closes so equipment remains accessible to other USTP students.
    </p>
@endsection
