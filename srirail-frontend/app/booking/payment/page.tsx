import BookingGuard from "@/components/booking/BookingGuard";
import BookingSummary from "@/components/booking/BookingSummary";
import PaymentForm from "@/components/booking/PaymentForm";
import PageHeading from "@/components/ui/PageHeading";
export default function Page() {
  return (
    <BookingGuard step={3}>
      <PageHeading
        eyebrow="Step 04"
        title="Complete your booking"
        description="Choose a payment method to try the simulated checkout."
      />
      <div className="booking-grid">
        <PaymentForm />
        <BookingSummary />
      </div>
    </BookingGuard>
  );
}
