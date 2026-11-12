<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordResetOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public User $user,
        public string $otpCode,
        public int $expiresInMinutes = 15,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Equiply Password Reset • Your 6-Digit Verification Code',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.password-reset-otp',
        );
    }

    /**
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
