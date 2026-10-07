import type { ReactNode } from "react";
import BookingSteps from "@/components/booking/BookingSteps";
export const metadata = { title: "Book your journey" };
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="container page-section">
      <BookingSteps />
      {children}
    </div>
  );
}
