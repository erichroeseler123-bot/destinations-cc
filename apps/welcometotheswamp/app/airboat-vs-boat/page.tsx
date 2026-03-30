import EntryGuidePage from "../EntryGuidePage";
import { WTS_ENTRY_PAGES } from "../entryPageData";

export const metadata = WTS_ENTRY_PAGES["airboat-vs-boat"].metadata;

export default function Page() {
  return <EntryGuidePage page={WTS_ENTRY_PAGES["airboat-vs-boat"]} />;
}
