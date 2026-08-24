type NetworkContactFormProps = {
  action: string;
  siteName: string;
  visibleEmail: string;
  sent?: boolean;
  error?: boolean;
  sourcePath?: string;
  intro?: string;
};

export function NetworkContactForm({
  action,
  siteName,
  visibleEmail,
  sent = false,
  error = false,
  sourcePath = "/contact",
  intro,
}: NetworkContactFormProps) {
  return (
    <section
      style={{
        borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        padding: 24,
        display: "grid",
        gap: 16,
      }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: 0.72,
          }}
        >
          Contact
        </p>
        <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", lineHeight: 1.02 }}>
          Reach {siteName}
        </h2>
        <p style={{ margin: 0, lineHeight: 1.7, opacity: 0.84 }}>
          {intro ||
            `Use this form if you want a direct reply from ${siteName}. Messages are routed for follow-up in one inbox.`}
        </p>
        <p style={{ margin: 0 }}>
          Email: <a href={`mailto:${visibleEmail}`}>{visibleEmail}</a>
        </p>
      </div>

      {sent ? (
        <p style={{ margin: 0, color: "#b8f28f", fontWeight: 700 }}>
          Message sent. We have your details and can reply directly.
        </p>
      ) : null}
      {error ? (
        <p style={{ margin: 0, color: "#ffb3a7", fontWeight: 700 }}>
          Add a valid email and message before sending.
        </p>
      ) : null}

      <form action={action} method="post" style={{ display: "grid", gap: 14 }}>
        <input type="hidden" name="sourcePath" value={sourcePath} />

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.78,
            }}
          >
            Name
          </span>
          <input
            type="text"
            name="name"
            placeholder="Your name"
            style={{
              minHeight: 52,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              color: "inherit",
              padding: "0 16px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.78,
            }}
          >
            Email
          </span>
          <input
            type="email"
            name="email"
            required
            placeholder="you@example.com"
            style={{
              minHeight: 52,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              color: "inherit",
              padding: "0 16px",
            }}
          />
        </label>

        <label style={{ display: "grid", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              opacity: 0.78,
            }}
          >
            Message
          </span>
          <textarea
            name="message"
            required
            rows={7}
            placeholder="What do you need help with?"
            style={{
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.18)",
              color: "inherit",
              padding: 16,
              resize: "vertical",
              font: "inherit",
            }}
          />
        </label>

        <button
          type="submit"
          style={{
            minHeight: 52,
            borderRadius: 999,
            border: "1px solid transparent",
            background: "linear-gradient(135deg, #f6d18c, #d7e88a)",
            color: "#142015",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            cursor: "pointer",
            padding: "0 18px",
            justifySelf: "start",
          }}
        >
          Send message
        </button>
      </form>
    </section>
  );
}
