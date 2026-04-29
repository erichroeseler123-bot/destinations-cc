import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type DccMissionApprovalEmailProps = {
  missionId: string;
  priorityLevel: string;
  decisionCorridor: string;
  decisionAction: string;
  approveUrl: string;
  rejectUrl: string;
  dccHandoffId?: string | null;
  timestamp: string;
};

const body = {
  margin: "0",
  backgroundColor: "#080b10",
  color: "#e6edf3",
  fontFamily: "Arial, Helvetica, sans-serif",
};

const container = {
  width: "100%",
  maxWidth: "680px",
  margin: "0 auto",
  padding: "32px 18px",
};

const panel = {
  border: "1px solid #253041",
  backgroundColor: "#0d121b",
  padding: "24px",
};

const eyebrow = {
  color: "#f5c66c",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "2px",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

const heading = {
  color: "#ffffff",
  fontSize: "28px",
  lineHeight: "34px",
  fontWeight: "800",
  margin: "0 0 18px",
};

const label = {
  color: "#8a95a6",
  fontSize: "11px",
  fontWeight: "700",
  letterSpacing: "1.4px",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
};

const value = {
  color: "#f8fafc",
  fontSize: "15px",
  lineHeight: "22px",
  margin: "0 0 18px",
};

const mono = {
  fontFamily: "Consolas, Monaco, 'Courier New', monospace",
};

const buttonBase = {
  display: "inline-block",
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "0.8px",
  textTransform: "uppercase" as const,
  padding: "12px 18px",
  marginRight: "10px",
};

export function DccMissionApprovalEmail({
  missionId,
  priorityLevel,
  decisionCorridor,
  decisionAction,
  approveUrl,
  rejectUrl,
  dccHandoffId,
  timestamp,
}: DccMissionApprovalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>DCC mission approval required for {missionId}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={panel}>
            <Text style={eyebrow}>EarthOS Mission Briefing</Text>
            <Heading style={heading}>Operator approval required</Heading>

            <Text style={label}>Mission ID</Text>
            <Text style={{ ...value, ...mono }}>{missionId}</Text>

            <Text style={label}>Priority Level</Text>
            <Text style={value}>{priorityLevel}</Text>

            <Text style={label}>Decision Corridor</Text>
            <Text style={value}>{decisionCorridor}</Text>

            <Text style={label}>Decision Action</Text>
            <Text style={value}>{decisionAction}</Text>

            <Section style={{ marginTop: "8px", marginBottom: "24px" }}>
              <Button
                href={approveUrl}
                style={{
                  ...buttonBase,
                  backgroundColor: "#f5c66c",
                  color: "#0a0d12",
                }}
              >
                Approve
              </Button>
              <Button
                href={rejectUrl}
                style={{
                  ...buttonBase,
                  border: "1px solid #ef4444",
                  color: "#fecaca",
                  backgroundColor: "#170b0d",
                }}
              >
                Reject
              </Button>
            </Section>

            <Section style={{ borderTop: "1px solid #253041", paddingTop: "16px" }}>
              <Text style={{ ...label, marginBottom: "8px" }}>Telemetry Footer</Text>
              <Text style={{ ...value, ...mono, color: "#aeb8c7", fontSize: "12px", lineHeight: "18px" }}>
                dcc_handoff_id={dccHandoffId || "n/a"}
                <br />
                timestamp={timestamp}
              </Text>
            </Section>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
