import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("worth-it");

export default function Page() {
  return <BridgePageTemplate slug="worth-it" />;
}
