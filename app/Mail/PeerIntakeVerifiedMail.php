<?php

namespace App\Mail;

use App\Models\Item;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PeerIntakeVerifiedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Item $item, public ?User $owner = null) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "P2P Listing Verified & Active [{$this->item->item_code}] • Equiply USTP",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.peer-intake-verified',
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
