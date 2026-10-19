"use client";
import type { Booking } from "@/types";
import { downloadTicket } from "@/lib/ticket";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
export default function TicketActions({ booking }: { booking: Booking }) {
  return (
    <div className="flex flex-wrap justify-center gap-3 no-print">
      <Button onClick={() => downloadTicket(booking)}>
        <Icon name="download" size={18} />
        Download e-ticket
      </Button>
      <Button variant="secondary" onClick={() => window.print()}>
        <Icon name="print" size={18} />
        Print / Save PDF
      </Button>
    </div>
  );
}
