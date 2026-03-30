import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("best-time");

export default function Page() {
  return <BridgePageTemplate slug="best-time" />;
}
