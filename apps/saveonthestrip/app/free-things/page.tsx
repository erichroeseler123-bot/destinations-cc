import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getVegasPhotoLibrary } from "@/lib/vegasPhotos";

const FREE_GROUPS = [
  {
    eyebrow: "Iconic shows and displays",
    title: "The classic free Vegas hits",
    items: [
      {
        name: "Fountains of Bellagio",
        note: "The signature free Strip show, with water, music, and lights. Usually every 30 minutes in the afternoon and every 15 minutes at night.",
      },
      {
        name: "Bellagio Conservatory & Botanical Gardens",
        note: "A huge indoor floral display that changes multiple times a year and is still one of the easiest free wins on the Strip.",
      },
      {
        name: "Fremont Street Experience",
        note: "Downtown’s LED canopy show plus live music stages. Best if you want free energy without paying for a headliner ticket.",
      },
      {
        name: "The Fall of Atlantis at Caesars Palace",
        note: "Animatronic fire-and-water show inside the Forum Shops, usually running on an hourly schedule starting around noon.",
      },
    ],
  },
  {
    eyebrow: "Nature and animals",
    title: "Free wildlife, desert art, and outdoor escapes",
    items: [
      {
        name: "Flamingo Wildlife Habitat",
        note: "A tropical pocket on the Strip with flamingos, koi, turtles, and other birds. Easy to combine with a center-Strip walk.",
      },
      {
        name: "Silverton Aquarium",
        note: "Large reef aquarium with free viewing and occasional mermaid swims that make it better than a random casino walk-through.",
      },
      {
        name: "Seven Magic Mountains",
        note: "Bright desert art stacks south of town. Best if you have a car or rideshare and want a strong free photo stop.",
      },
    ],
  },
  {
    eyebrow: "Museums and unique spots",
    title: "Free places that still feel worth leaving the room for",
    items: [
      {
        name: "Pinball Hall of Fame",
        note: "Free admission. You only pay if you want to play the machines, which makes it one of the better low-cost Vegas stops.",
      },
      {
        name: "Shelby Heritage Center",
        note: "Free self-guided car collection for anyone who likes Mustangs, Cobras, or just wants a different kind of Vegas attraction.",
      },
      {
        name: "Welcome to Fabulous Las Vegas Sign",
        note: "Still the classic photo stop. Good for first-timers or quick group pictures.",
      },
      {
        name: "Marjorie Barrick Museum of Art",
        note: "UNLV art museum with free admission and rotating contemporary exhibits.",
      },
    ],
  },
  {
    eyebrow: "Other free wins",
    title: "Extra freebies people forget about",
    items: [
      {
        name: "Circus Acts at Circus Circus",
        note: "Free acrobat and circus-style performances during the day. Good if you want something low-stakes and family-friendly.",
      },
      {
        name: "The Park and Bliss Dance",
        note: "An easy outdoor art-and-walk stop between New York-New York and Park MGM.",
      },
      {
        name: "Fashion Show Mall runway events",
        note: "Free fashion-show style programming on some weekends, worth checking before you go if you are already on that side of the Strip.",
      },
    ],
  },
] as const;

export const metadata: Metadata = {
  title: "Free Things To Do in Las Vegas | Save On The Strip",
  description:
    "A practical Las Vegas free-things guide covering Bellagio fountains, Fremont Street, free wildlife, desert art, and other no-cost stops worth your time.",
  alternates: {
    canonical: "https://saveonthestrip.com/free-things",
  },
};

export default async function FreeThingsPage() {
  const photos = await getVegasPhotoLibrary();
  const freeVisuals = [
    {
      title: "Bellagio fountains",
      copy: "Still the easiest no-cost Vegas night move when you want a real show without a ticket.",
      image: photos.bellagio.src,
      alt: photos.bellagio.alt,
    },
    {
      title: "Fremont lights",
      copy: "Downtown energy, LED canopy, and live stages when the Strip starts to feel repetitive.",
      image: photos.fremont.src,
      alt: photos.fremont.alt,
    },
    {
      title: "Wildlife and weird Vegas",
      copy: "Free habitat stops and lower-stakes attractions that still give the day some shape.",
      image: photos.downtownNight.src,
      alt: photos.downtownNight.alt,
    },
    {
      title: "Free reset between paid nights",
      copy: "Use zero-cost stops to keep the trip moving without stacking another expensive ticket.",
      image: photos.desertOutdoor.src,
      alt: photos.desertOutdoor.alt,
    },
  ] as const;

  return (
    <main style={{ display: "grid", gap: 20 }}>
      <section className="panel">
        <div className="eyebrow">Free things to do</div>
        <div style={{ height: 10 }} />
        <h1 className="detail-title">Free things to do in Las Vegas that are actually worth it</h1>
        <p className="lead">
          Vegas has plenty of free attractions if you know where to look. Use this page when you
          want a strong no-cost plan between show nights, casino time, or one bigger paid outing.
        </p>
      </section>

      <section className="panel">
        <div className="eyebrow">See the free wins fast</div>
        <div style={{ height: 10 }} />
        <h2>Vegas free-stop visuals that make the page easier to scan</h2>
        <div style={{ height: 18 }} />
        <div className="grid">
          {freeVisuals.map((item) => (
            <article className="card media-card" key={item.title}>
              <div className="media-frame">
                <Image
                  src={item.image}
                  alt={item.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  className="media-image"
                />
              </div>
              <div className="media-copy">
                <div className="eyebrow">Quick visual</div>
                <h2>{item.title}</h2>
                <p>{item.copy}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {FREE_GROUPS.map((group) => (
        <section className="panel" key={group.title}>
          <div className="eyebrow">{group.eyebrow}</div>
          <div style={{ height: 10 }} />
          <h2>{group.title}</h2>
          <div style={{ height: 18 }} />
          <div className="grid">
            {group.items.map((item) => (
              <article className="card" key={item.name}>
                <div className="inline-media-frame category-card-image" style={{ marginBottom: 14 }}>
                  <Image
                    src={
                      item.name.includes("Bellagio")
                        ? photos.bellagio.src
                        : item.name.includes("Fremont")
                          ? photos.fremont.src
                          : item.name.includes("Welcome to Fabulous Las Vegas Sign")
                            ? photos.vegasSign.src
                            : item.name.includes("Seven Magic Mountains")
                              ? photos.desertOutdoor.src
                              : photos.downtownNight.src
                    }
                    alt={item.name}
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="media-image"
                  />
                </div>
                <div className="eyebrow">Free stop</div>
                <h2 style={{ marginTop: 10 }}>{item.name}</h2>
                <p>{item.note}</p>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="grid">
        <article className="card">
          <div className="eyebrow">Pair it with</div>
          <h2>Use free stops to make your paid picks better</h2>
          <p>
            A good Vegas plan often looks better when you mix one strong paid show or tour with two
            or three free stops that do not feel like filler.
          </p>
          <div style={{ height: 12 }} />
          <Link href="/shows/sphere" className="button button-primary">
            Start with shows
          </Link>
        </article>
        <article className="card">
          <div className="eyebrow">Need more value?</div>
          <h2>Open the deals page next</h2>
          <p>
            Use the deals page when you want a lower-cost paid option after locking in the free
            stuff first.
          </p>
          <div style={{ height: 12 }} />
          <Link href="/deals" className="button button-secondary">
            Open Vegas deals
          </Link>
        </article>
      </section>
    </main>
  );
}
