@extends('emails.layout')

@section('title', 'Official Return & Clearance Receipt • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        Official Return &amp; Clearance Receipt, {{ $rental->borrower?->name ?? 'Student Borrower' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Your borrowed equipment has been inspected and checked in at the USTP Facility Operations desk. Keep this email as your official return and academic clearance receipt.
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
                    Returned Equipment
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $rental->item_snapshot['name'] ?? $rental->item?->name ?? 'Campus Equipment' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Return Timestamp &amp; Verified Condition
                </div>
                <div style="font-size: 14px; font-weight: 600; color: #1B1642; margin-top: 2px;">
                    {{ $rental->schedule['returned_time'] ?? 'N/A' }}
                </div>
                <div style="font-size: 13px; color: #334155; margin-top: 4px;">
                    Condition In: {{ $rental->condition_logs['condition_in'] ?? 'Verified' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Collateral &amp; Clearance Release Status
                </div>
                @php
                    $collateralStatus = $rental->financials['collateral_status'] ?? 'released';
                    $collateralLabel = match ($collateralStatus) {
                        'withheld_damage' => 'Withheld / Deducted for Damage',
                        'clearance_hold_flagged' => 'Academic Clearance Hold Flagged',
                        default => 'Cleared',
                    };
                @endphp
                <div style="font-size: 14px; font-weight: 600; color: {{ $collateralStatus === 'released' ? '#1B1642' : '#b91c1c' }}; margin-top: 2px;">
                    {{ $collateralLabel }} • {{ $rental->financials['collateral_held'] ?? 'Academic Clearance Hold' }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Financial Summary
                </div>
                <div style="font-size: 13px; color: #475569; margin-top: 4px;">
                    Base Rental Fee: ₱{{ number_format((float) ($rental->financials['total_fee'] ?? 0), 2) }}
                </div>
                @if(($rental->financials['overdue_fee'] ?? 0) > 0)
                    <div style="font-size: 13px; color: #b91c1c; margin-top: 2px;">
                        Overdue Surcharge: ₱{{ number_format((float) ($rental->financials['overdue_fee'] ?? 0), 2) }}
                    </div>
                @endif
                @if(($rental->financials['damage_fee'] ?? 0) > 0)
                    <div style="font-size: 13px; color: #b91c1c; margin-top: 2px;">
                        Damage / Repair Fee: ₱{{ number_format((float) ($rental->financials['damage_fee'] ?? 0), 2) }}
                    </div>
                @endif
                <div style="font-size: 16px; font-weight: 800; color: #1B1642; margin-top: 6px;">
                    Final Total: ₱{{ number_format((float) ($rental->financials['final_total'] ?? $rental->financials['total_fee'] ?? 0), 2) }}
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Clearance Confirmation:</strong> Your collateral record has been updated and your campus clearance for this transaction is complete.
    </p>
@endsection
