import BookingGuard from "@/components/booking/BookingGuard";
import PassengerForm from "@/components/booking/PassengerForm";
import BookingSummary from "@/components/booking/BookingSummary";
import PageHeading from "@/components/ui/PageHeading";
export default function Page() {
  return (
    <BookingGuard>
      <PageHeading
        eyebrow="Step 01"
        title="Who’s travelling?"
        description="Enter details as they appear on each passenger’s identity document."
      />
      <div className="booking-grid">
        <PassengerForm />
        <BookingSummary />
      </div>
    </BookingGuard>
  );
}
