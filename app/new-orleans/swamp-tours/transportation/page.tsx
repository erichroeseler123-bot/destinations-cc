import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("transportation");

export default function Page() {
  return <BridgePageTemplate slug="transportation" />;
}
