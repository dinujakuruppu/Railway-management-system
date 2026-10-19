import PageHeading from "@/components/ui/PageHeading";
export const metadata = { title: "Demo terms & privacy" };
export default function Page() {
  return (
    <div className="container page-section max-w-3xl">
      <PageHeading
        title="Demo terms & privacy"
        description="How this SriRail educational demonstration works."
      />
      <article className="card panel space-y-6">
        <section>
          <h2 className="text-lg font-bold">University project</h2>
          <p className="text-muted">
            SriRail is an independent educational prototype, not an official
            service of Sri Lanka Railways. Timetables, prices, availability and
            notices are illustrative. Tickets issued here are not valid for
            travel.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Accounts and passenger details</h2>
          <p className="text-muted">
            Account credentials are verified by Supabase Auth. Use an email you
            can verify and fictional passenger details. Profiles, passenger
            information, demonstration bookings and admin changes are stored in
            the project’s Supabase database. Passengers can access their own
            records; authorized administrators can manage demonstration bookings
            and the railway catalog.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Browser data</h2>
          <p className="text-muted">
            The server uses session cookies to keep you signed in. Remember me
            optionally saves only your email address in browser local storage.
            Unfinished booking forms stay in memory and clear on refresh.
            Passwords are handled by Supabase Auth; this application does not
            keep plaintext passwords.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Payments and cancellations</h2>
          <p className="text-muted">
            Payments are simulated. Card numbers, CVVs and banking credentials
            are not collected. No money is charged and no refunds are issued.
            Seat protection applies only to records in this demonstration
            database. No actual railway seat is reserved. Selecting a seat does
            not hold it before booking confirmation.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Your saved information</h2>
          <p className="text-muted">
            Signing out clears account data from the screen; saved bookings
            remain in the project database. Contact the project administrator to
            request removal of demonstration account data. Downloaded tickets
            stay on your device until you delete them.
          </p>
        </section>
      </article>
    </div>
  );
}
