type SlotSchema = {
  name: string;
  description: string;
  startDate: string;
  locationName: string;
  url: string;
  availability: string;
};

export default function LiveSlotsJsonLd({
  pageUrl,
  name,
  description,
  slots
}: {
  pageUrl: string;
  name: string;
  description: string;
  slots: SlotSchema[];
}) {
  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    url: pageUrl,
    description,
    mainEntity: {
      "@type": "ItemList",
      itemListOrder: "https://schema.org/ItemListOrderAscending",
      numberOfItems: slots.length,
      itemListElement: slots.map((slot, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Event",
          name: slot.name,
          description: slot.description,
          startDate: slot.startDate,
          eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
          eventStatus: "https://schema.org/EventScheduled",
          location: {
            "@type": "Place",
            name: slot.locationName
          },
          offers: {
            "@type": "Offer",
            url: slot.url,
            availability: slot.availability
          }
        }
      }))
    }
  };

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />
  );
}
