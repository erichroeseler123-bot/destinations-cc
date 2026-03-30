"use client";

export function HelpRequestForm({
  sourcePath,
  sent = false,
  error = false,
}: {
  sourcePath: string;
  sent?: boolean;
  error?: boolean;
}) {

  return (
    <div className="card">
      <div className="eyebrow">Ask for help</div>
      <h2>Want help with tickets, tours, or offers?</h2>
      <p>
        Use this if you want help with free ticket pickup, value picks, timeshare-related offers,
        or a faster recommendation instead of digging through everything yourself.
      </p>
      {sent ? <p className="form-message success">Request sent. We have your details.</p> : null}
      {error ? <p className="form-message error">Add an email or phone number so we can reply.</p> : null}
      <form action="/api/help-request" method="post" className="help-form">
        <input type="hidden" name="sourcePath" value={sourcePath} />
        <label className="field">
          <span>Name</span>
          <input type="text" name="name" placeholder="Your name" />
        </label>
        <label className="field">
          <span>Email</span>
          <input type="email" name="email" placeholder="you@example.com" />
        </label>
        <label className="field">
          <span>Phone</span>
          <input type="tel" name="phone" placeholder="Optional phone number" />
        </label>
        <label className="field">
          <span>What do you want help with?</span>
          <select name="requestType" defaultValue="general_help">
            <option value="general_help">General Vegas help</option>
            <option value="show_help">Show recommendations</option>
            <option value="tour_help">Tour planning</option>
            <option value="free_ticket_pickup">Free ticket pickup / deals</option>
            <option value="timeshare_help">Timeshare offers</option>
          </select>
        </label>
        <label className="field field-full">
          <span>Notes</span>
          <textarea name="notes" rows={5} placeholder="Tell us what kind of Vegas plan or offer you want." />
        </label>
        <button type="submit" className="button button-primary">
          Send request
        </button>
      </form>
    </div>
  );
}
