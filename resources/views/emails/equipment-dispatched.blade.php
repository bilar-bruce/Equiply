@extends('emails.layout')

@section('title', 'Equipment Handover Confirmed • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Equipment Handover Confirmed, {{ $rental->borrower?->name ?? 'Student Borrower' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your reserved equipment has been released to your custody at the USTP Facility Operations desk. Please review the official handover details below.
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
                    Dispatched Equipment
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name ?? 'Campus Equipment' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Authorizing Facility Custodian
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->custodian?->name ?? 'USTP Facility Custodian' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Logged Outgoing Condition
                </div>
                <div style="font-size: 14px; color: #334155; margin-top: 2px;">
                    {{ $rental->condition_logs['condition_out'] ?? 'Good condition upon release' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Scheduled Return Due Time
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['due_time'] ?? 'N/A' }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Return Reminder:</strong> Please return the equipment on or before the scheduled due time to prevent overdue surcharges and academic clearance holds.
    </p>
@endsection
