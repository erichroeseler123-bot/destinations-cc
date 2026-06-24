import { redis } from "@/lib/redis";
import { authorizeTransmission, burnTransmission, broadcastCoordination } from "./actions";

export const dynamic = "force-dynamic";
export const runtime = "edge";

interface InviteRequest {
  transmissionId: string;
  happeningId: string;
  happeningTitle: string;
  partySize: number;
  note: string;
  phone?: string;
  status: string;
  timestamp: string;
}

export default async function OperatorPage() {
  let requests: InviteRequest[] = [];
  let connectionError = false;

  try {
    if (!redis) {
      throw new Error("Redis database client not initialized");
    }

    const client = redis;
    // Scan for all invite request keys in Upstash Redis
    const keys = await client.keys("invite_req:*");

    if (keys.length > 0) {
      const payloads = await Promise.all(keys.map((key) => client.get(key)));
      for (const payload of payloads) {
        if (payload) {
          const parsed = typeof payload === "string" ? JSON.parse(payload) : payload;
          requests.push(parsed);
        }
      }

      // Sort requests chronologically (newest first)
      requests.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (error) {
    console.error("Operator dashboard connection error:", error);
    connectionError = true;
  }

  if (connectionError) {
    return (
      <div className="sys-error-screen">
        <div className="sys-error-panel">
          <h1 className="sys-error-title" style={{ fontSize: "14px", lineHeight: "1.2" }}>
            SYSTEM_ERROR: DATABASE_OFFLINE
          </h1>
          <p className="sys-error-desc">
            Secure telemetry pipeline failed to establish connection to Upstash Redis database. Check server logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="operator-container">
      {/* Header Panel */}
      <header className="operator-header">
        <div className="operator-header-title-wrap">
          <span style={{ display: "inline-block", width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#fbbf24" }} />
          <h1 className="operator-header-title" style={{ fontSize: "16px", lineHeight: "1.2" }}>
            OPERATOR_RADAR: PENDING TRANSMISSIONS
          </h1>
        </div>
        <div className="operator-badge-counter">
          Queue Size: {requests.length} Nodes
        </div>
      </header>

      {/* Comms Link Broadcast Box */}
      {requests.some((r) => r.status === "AUTHORIZED") && (
        <div className="operator-comms-link">
          <h2 className="operator-comms-title">COMMS_LINK: BROADCAST COORDINATION</h2>
          <form action={broadcastCoordination} className="operator-comms-form">
            <textarea
              name="message"
              placeholder="ENTER COORDINATION PROTOCOL..."
              required
              className="operator-comms-textarea"
            />
            <button type="submit" className="operator-comms-submit-btn">
              [TRANSMIT_TO_OPERATIVES]
            </button>
          </form>
        </div>
      )}

      {/* Requests Grid */}
      {requests.length === 0 ? (
        <div className="operator-radar-clear">
          <span>
            RADAR CLEAR. NO PENDING TRANSMISSIONS.
          </span>
        </div>
      ) : (
        <div className="operator-grid">
          {requests.map((req) => (
            <div
              key={req.transmissionId}
              className="operator-card"
            >
              <div>
                <div className="operator-card-header">
                  <span className="operator-card-tx-id">
                    TX_ID: {req.transmissionId.slice(0, 8)}
                  </span>
                  <span className="operator-card-status-badge">
                    {req.status}
                  </span>
                </div>

                <h2 className="operator-card-title">
                  {req.happeningTitle}
                </h2>

                <div className="operator-card-meta">
                  <span>PARTY_SIZE: {req.partySize}</span>
                  <span>|</span>
                  {req.phone && (
                    <>
                      <span>PHONE: {req.phone}</span>
                      <span>|</span>
                    </>
                  )}
                  <span>
                    {new Date(req.timestamp).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <p className="operator-card-note">
                  {req.note}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="operator-card-actions">
                <form action={authorizeTransmission} className="w-full">
                  <input type="hidden" name="id" value={req.transmissionId} />
                  <button type="submit" className="btn-emerald-outline">
                    AUTHORIZE_SQUARE_LINK
                  </button>
                </form>
                <form action={burnTransmission} className="w-full">
                  <input type="hidden" name="id" value={req.transmissionId} />
                  <button type="submit" className="btn-red-outline">
                    BURN_TRANSMISSION
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
