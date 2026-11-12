<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>@yield('title', 'Equiply • USTP Facility Operations')</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; padding: 32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0;">
                    <!-- USTP Branded Header -->
                    <tr>
                        <td style="background-color: #1B1642; padding: 24px 32px; border-bottom: 4px solid #F5A623;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                                <tr>
                                    <td align="left" valign="middle">
                                        <span style="display: inline-block; background-color: #F5A623; color: #1B1642; font-size: 11px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; padding: 4px 10px; border-radius: 9999px; margin-bottom: 6px;">
                                            USTP Facility Operations
                                        </span>
                                        <div style="color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; margin-top: 4px;">
                                            Equiply
                                        </div>
                                        <div style="color: #cbd5e1; font-size: 13px; margin-top: 2px;">
                                            University of Science and Technology of Southern Philippines
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <!-- Email Content Body -->
                    <tr>
                        <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #334155;">
                            @yield('content')
                        </td>
                    </tr>

                    <!-- USTP Facility Operations Footer -->
                    <tr>
                        <td style="background-color: #f1f5f9; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #64748b; line-height: 1.5;">
                            <div style="font-weight: 600; color: #1B1642; margin-bottom: 4px;">
                                Equiply • USTP Facility Operations
                            </div>
                            <div>
                                University of Science and Technology of Southern Philippines (USTP)
                            </div>
                            <div style="margin-top: 8px; color: #94a3b8;">
                                This is an automated system notification. Please do not reply directly to this email.
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
