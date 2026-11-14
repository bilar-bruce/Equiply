<?php

namespace App\Mail;

use App\Models\Rental;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PeerItemBorrowedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Rental $rental, public ?User $owner = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Your Peer Equipment Was Checked Out [{$this->rental->rental_code}] • Equiply USTP",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.peer-item-borrowed',
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
