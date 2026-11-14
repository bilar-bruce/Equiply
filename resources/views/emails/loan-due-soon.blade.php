@extends('emails.layout')

@section('title', 'Reminder: Equipment Due Within 30 Minutes • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Upcoming Return Reminder, {{ $rental->borrower?->name ?? 'Student Borrower' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        This is a courtesy reminder from the USTP Facility Operations Desk that your borrowed equipment is due for return within the next 30 minutes.
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
                    Borrowed Equipment
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name ?? 'Campus Equipment' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Scheduled Return Due Time
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['due_time'] ?? 'N/A' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Collateral Held on Record
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #334155; margin-top: 2px;">
                    {{ $rental->financials['collateral_held'] ?? 'Academic Clearance Hold' }}
                </div>
            </td>
        </tr>
    </table>

    <div style="background-color: #fffbeb; border-left: 4px solid #F5A623; padding: 14px 16px; border-radius: 4px; margin-bottom: 16px; font-size: 14px; color: #1B1642;">
        <strong>Avoid Overdue Surcharges:</strong> Please return this item to the USTP Facility Operations Desk before <strong>{{ $rental->schedule['due_time'] ?? 'N/A' }}</strong> to avoid the <strong>₱15.00/hr</strong> overdue facility surcharge and clear your collateral hold.
    </div>
@endsection
