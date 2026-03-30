import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("types");

export default function Page() {
  return <BridgePageTemplate slug="types" />;
}
