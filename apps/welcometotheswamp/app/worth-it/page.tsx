import EntryGuidePage from "../EntryGuidePage";
import { WTS_ENTRY_PAGES } from "../entryPageData";

export const metadata = WTS_ENTRY_PAGES["worth-it"].metadata;

export default function Page() {
  return <EntryGuidePage page={WTS_ENTRY_PAGES["worth-it"]} />;
}
