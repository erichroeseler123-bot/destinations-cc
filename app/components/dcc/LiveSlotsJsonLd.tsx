import JsonLd from "@/app/components/dcc/JsonLd";
import { buildLiveSlotEventJsonLd, buildLiveSlotsCollectionJsonLd } from "@/lib/dcc/jsonld";

type LiveSlotsJsonLdSlot = Parameters<typeof buildLiveSlotEventJsonLd>[0];

export default function LiveSlotsJsonLd({
  pageUrl,
  name,
  description,
  slots,
}: {
  pageUrl: string;
  name: string;
  description: string;
  slots: LiveSlotsJsonLdSlot[];
}) {
  if (!slots.length) {
    return (
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name,
          url: pageUrl,
          description,
        }}
      />
    );
  }

  return (
    <>
      <JsonLd data={buildLiveSlotsCollectionJsonLd({ pageUrl, name, description, slots })} />
      {slots.map((slot, index) => (
        <JsonLd key={`${slot.url}-${index}`} data={buildLiveSlotEventJsonLd(slot)} />
      ))}
    </>
  );
}
