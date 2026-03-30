import BridgePageTemplate, { buildBridgePageMetadata } from "../BridgePageTemplate";

export const metadata = buildBridgePageMetadata("with-kids");

export default function Page() {
  return <BridgePageTemplate slug="with-kids" />;
}
