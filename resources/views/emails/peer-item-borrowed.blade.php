@extends('emails.layout')

@section('title', 'Your Peer Equipment Was Checked Out • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Peer Equipment Checked Out, {{ $owner?->name ?? $rental->item?->owner?->name ?? 'Peer Lender' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your peer-to-peer listed equipment has been checked out by a verified USTP student borrower through the Facility Operations desk.
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
                    Equipment &amp; Borrower
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name }}
                </div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                    Borrower: {{ $rental->borrower?->name ?? 'USTP Student Borrower' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Outgoing Condition
                </div>
                <div style="font-size: 14px; color: #334155; margin-top: 2px;">
                    {{ $rental->condition_logs['condition_out'] ?? 'Good condition upon release' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Scheduled Due Time
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['due_time'] ?? 'N/A' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Expected Peer Lender Earnings
                </div>
                <div style="font-size: 16px; font-weight: 800; color: #1B1642; margin-top: 2px;">
                    ₱{{ number_format((float) ($rental->financials['total_fee'] ?? 0), 2) }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Custody Safeguard:</strong> Borrower academic clearance collateral is held by USTP Facility Operations until your item is returned and inspected.
    </p>
@endsection
