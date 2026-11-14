@extends('emails.layout')

@section('title', 'P2P Listing Verified & Active • Equiply USTP')

@section('content')
    <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #1B1642;">
        P2P Intake Verified, {{ $owner?->name ?? $item->owner?->name ?? 'Peer Lender' }}!
    </h1>

    <p style="margin: 0 0 20px 0; color: #334155;">
        Physical desk intake for your peer-to-peer equipment listing has been verified by a USTP Facility Custodian. Your item is now <strong>available</strong> in the USTP campus catalog for student reservations.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
        <tr>
            <td style="padding-bottom: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    P2P Asset Code
                </div>
                <div style="display: inline-block; background-color: #1B1642; color: #F5A623; font-size: 18px; font-weight: 800; letter-spacing: 0.08em; font-family: monospace; padding: 6px 14px; border-radius: 6px; margin-top: 6px;">
                    {{ $item->item_code }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Equipment Name &amp; Category
                </div>
                <div style="font-size: 16px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    {{ $item->name }}
                </div>
                <div style="font-size: 13px; color: #475569; margin-top: 2px;">
                    Category: {{ $item->category }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="padding-bottom: 12px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Flat Rental Rate
                </div>
                <div style="font-size: 15px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    ₱{{ number_format((float) ($item->rental_rate_flat ?? $item->rental_rate_hr ?? 0), 2) }}
                </div>
            </td>
        </tr>
        <tr>
            <td style="border-top: 1px solid #e2e8f0; padding-top: 12px;">
                <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b;">
                    Catalog Status
                </div>
                <div style="font-size: 14px; font-weight: 700; color: #1B1642; margin-top: 2px;">
                    Verified &amp; available in USTP Campus Catalog
                </div>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 14px; color: #475569;">
        <strong>Peer Lender Notice:</strong> We will notify you automatically whenever a verified USTP student checks out or returns your equipment through the Facility Operations desk.
    </p>
@endsection
