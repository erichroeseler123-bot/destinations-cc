import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("airboat-vs-boat");

export default function Page() {
  return <BridgePageTemplate slug="airboat-vs-boat" />;
}
