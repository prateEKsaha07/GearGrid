import { useNavigate } from "react-router-dom";

export default function TermsConsent() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight">
          Terms &amp; Conditions
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please read before using GearGrid.
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="mb-2 text-base font-medium">1. Platform Purpose</h2>
            <p className="text-muted-foreground">
              GearGrid is a peer-to-peer marketplace that connects farmers and
              equipment owners within their local area. We provide a platform
              for discovering, listing, and coordinating the rental of
              agricultural equipment. GearGrid is not a party to any rental
              transaction and does not own, operate, inspect, or transport any
              equipment listed on the platform.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">
              2. No Money Through the App
            </h2>
            <p className="text-muted-foreground">
              All payments between owners and renters are made directly between
              the two parties, outside of GearGrid. The platform does not
              process, hold, transfer, or guarantee any funds. Users are solely
              responsible for agreeing on prices, payment methods, and payment
              timing. GearGrid does not mediate payment disputes.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">3. Deposit Handling</h2>
            <p className="text-muted-foreground">
              Deposits are agreed upon and exchanged directly between the owner
              and the renter. Both parties are required to confirm deposit
              transactions on the platform for record-keeping only. GearGrid
              does not hold, return, or retain deposits. Any deposit retention
              for damage, loss, or late return is the sole responsibility of
              the two parties involved.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">
              4. Equipment Responsibility
            </h2>
            <p className="text-muted-foreground">
              The renter is responsible for the equipment from the moment of
              pickup until the moment of return, as documented by the condition
              snapshot and signed agreements on the platform. Any damage,
              loss, or wear occurring during this period is the renter's
              responsibility. Owners are responsible for ensuring equipment is
              in the condition described in their listing and is safe for its
              intended use.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">5. Non-Return Policy</h2>
            <p className="text-muted-foreground">
              Failure to return equipment by the agreed end date, without an
              approved extension, is treated as a non-return event. Non-return
              events are recorded on the renter's reliability profile and may
              result in account suspension or removal from the platform.
              Repeated non-returns may be reported to relevant authorities as
              deemed appropriate.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">
              6. Reliability Score System
            </h2>
            <p className="text-muted-foreground">
              GearGrid maintains a reliability score for every user, computed
              separately for owner and renter activity. Scores are based on
              mutual ratings submitted after each completed rental. Reliability
              scores are visible to other users and influence trust in
              transactions. Deliberately false ratings or attempts to
              manipulate the scoring system may result in account termination.
            </p>
          </section>

          <section>
            <h2 className="mb-2 text-base font-medium">
              7. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground">
              By using GearGrid, you agree to these terms. Continued use of the
              platform constitutes ongoing acceptance. GearGrid reserves the
              right to update these terms, with notice provided through the
              application.
            </p>
          </section>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-10 w-full rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          I Agree
        </button>
      </div>
    </div>
  );
}