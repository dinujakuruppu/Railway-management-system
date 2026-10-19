import Link from "next/link";
import Icon from "@/components/ui/Icon";
export default function Footer() {
  return (
    <footer className="site-footer no-print">
      <div className="container grid gap-8 md:grid-cols-[2fr_1fr_1fr] py-10">
        <div>
          <Link className="brand text-white" href="/">
            <Icon name="train" size={34} />
            <span>
              SriRail<small>SMART TICKETING</small>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-slate-300">
            A simpler way to plan your railway journey across Sri Lanka.
          </p>
        </div>
        <div>
          <h2>Plan your journey</h2>
          <Link href="/trains">Find a train</Link>
          <Link href="/schedule">Railway schedules</Link>
          <Link href="/notices">Travel notices</Link>
        </div>
        <div>
          <h2>Your account</h2>
          <Link href="/dashboard/bookings">My bookings</Link>
          <Link href="/dashboard/profile">My profile</Link>
          <Link href="/terms">Demo terms & privacy</Link>
        </div>
      </div>
      <div className="footer-bottom container">
        SriRail · An independent university project. Not affiliated with Sri
        Lanka Railways. Demo tickets are not valid for travel.
      </div>
    </footer>
  );
}
