import PageHeading from "@/components/ui/PageHeading";
export const metadata = { title: "Demo terms & privacy" };
export default function Page() {
  return (
    <div className="container page-section max-w-3xl">
      <PageHeading
        title="Demo terms & privacy"
        description="How this SriRail frontend demonstration works."
      />
      <article className="card panel space-y-6">
        <section>
          <h2 className="text-lg font-bold">University project</h2>
          <p className="text-muted">
            SriRail is an independent educational prototype, not an official
            service of Sri Lanka Railways. Timetables, prices, availability,
            notices and passenger records are illustrative. No ticket issued
            here is valid for travel.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Sample information only</h2>
          <p className="text-muted">
            Use fictional passenger and payment details. Sign-in and
            registration validate form fields but do not verify your identity or
            create a real account. Admin pages are open demonstration screens.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Data on your device</h2>
          <p className="text-muted">
            Demo profiles, bookings and admin changes are kept in session
            storage in this browser tab and survive a refresh. They are not
            synchronized across tabs or devices. Remember me stores only the
            entered email address in local storage. Passwords, card numbers and
            CVVs are never saved.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Payments and cancellations</h2>
          <p className="text-muted">
            Payments are simulated. No money is collected, no railway seat is
            held and no refunds are issued. Cancelling a booking only changes
            its status and availability inside this demonstration.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-bold">Reset your demo</h2>
          <p className="text-muted">
            Use Reset demo on the admin overview to restore sample session data,
            or clear your browser’s site data to remove the remembered email
            too. Downloaded tickets remain on your device until you delete them.
          </p>
        </section>
      </article>
    </div>
  );
}
