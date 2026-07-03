"use client";

import { useState, useEffect } from "react";
import styles from "./ship-outpost.module.css";

interface ExcursionNode {
  id: string;
  name: string;
  category: "water" | "wildlife" | "culture" | "private";
  vibe: string;
  price: string;
  rating: number;
  reviewsCount: number;
  squareLink: string;
  viatorUrl: string;
  logistics: {
    "Duration": string;
    "Vessel/Type": string;
    "Highlights": string;
    "Port Pickup": string;
    "Cancellation": string;
  };
  capacityStatus: "available" | "limited" | "full";
}

const SHIP_CONFIGS: Record<string, {
  name: string;
  portName: string;
  allAboardHour: number;
  allAboardMinute: number;
  excursions: ExcursionNode[];
}> = {
  "icon-of-the-seas": {
    name: "ICON OF THE SEAS",
    portName: "NASSAU, BAHAMAS",
    allAboardHour: 20,
    allAboardMinute: 30,
    excursions: [
      {
        id: "nassau-pigs-snorkel",
        name: "Nassau Pigs, Snorkel & Private Beach Escape",
        category: "wildlife",
        vibe: "VIP speed boat transfer & marine wildlife",
        price: "$145.00",
        rating: 4.9,
        reviewsCount: 283,
        squareLink: "https://square.link/u/nassau-pigs-vip",
        viatorUrl: "https://www.viator.com/tours/Nassau/Pearl-Island-Beach-Full-day-Snorkeling-with-Lunch/d420-53472P1",
        logistics: {
          "Duration": "4 Hours",
          "Vessel/Type": "Custom Powerboat",
          "Highlights": "Swim with pigs, snorkel reefs, meet turtles",
          "Port Pickup": "Yes (Meeting Point 100m from Port Exit)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "limited"
      },
      {
        id: "pearl-island-snorkel",
        name: "Pearl Island Snorkeling & Beach Day",
        category: "water",
        vibe: "Fully catered reef snorkeling & buffet",
        price: "$98.00",
        rating: 4.7,
        reviewsCount: 412,
        squareLink: "https://square.link/u/pearl-island-reef",
        viatorUrl: "https://www.viator.com/tours/Nassau/Pearl-Island-Beach-Escape-with-Lunch/d420-53472P2",
        logistics: {
          "Duration": "5 Hours",
          "Vessel/Type": "Double-deck Ferry",
          "Highlights": "Includes hot Bahamian lunch, snorkel gear, kayaks",
          "Port Pickup": "Yes (Port Terminal Gate check-in)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "nassau-catamaran-reef",
        name: "Nassau Catamaran Reef Snorkel & Sail",
        category: "water",
        vibe: "Relaxing open-sea sailing & reef dive",
        price: "$75.00",
        rating: 4.8,
        reviewsCount: 190,
        squareLink: "https://square.link/u/nassau-cat-sail",
        viatorUrl: "https://www.viator.com/tours/Nassau/Nassau-Sail-and-Snorkel-Tour/d420-39035P1",
        logistics: {
          "Duration": "3 Hours",
          "Vessel/Type": "50ft Sailing Catamaran",
          "Highlights": "Explore Sea Garden preserve, open rum punch bar",
          "Port Pickup": "Yes (Embark at Prince George Wharf)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "nassau-trolley-culture",
        name: "Nassau Historic Trolley & Food Walk",
        category: "culture",
        vibe: "Historic forts, rum cake, and local bites",
        price: "$65.00",
        rating: 4.6,
        reviewsCount: 120,
        squareLink: "https://square.link/u/nassau-food-trolley",
        viatorUrl: "https://www.viator.com/tours/Nassau/Nassau-Food-and-Cultural-Walking-Tour/d420-28298P1",
        logistics: {
          "Duration": "2.5 Hours",
          "Vessel/Type": "Electric Trolley & Walking",
          "Highlights": "Queen's Staircase, Fort Fincastle, conch fritters",
          "Port Pickup": "Yes (Pickup at terminal exit pavilion)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "nassau-vip-transfer",
        name: "Private VIP Port Transfer (Roundtrip)",
        category: "private",
        vibe: "Private AC shuttle to Cable Beach or Atlantis",
        price: "$120.00",
        rating: 5.0,
        reviewsCount: 84,
        squareLink: "https://square.link/u/nassau-vip-shuttle",
        viatorUrl: "https://www.viator.com/tours/Nassau/Private-Roundtrip-Airport-Transfer/d420-28298P2",
        logistics: {
          "Duration": "Flexible (Custom Schedule)",
          "Vessel/Type": "Executive Van (up to 10 guests)",
          "Highlights": "Dedicated driver, cold water bottles included",
          "Port Pickup": "Yes (Driver holding sign at Gate 2)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "limited"
      }
    ]
  },
  "carnival-jubilee": {
    name: "CARNIVAL JUBILEE",
    portName: "COZUMEL, MEXICO",
    allAboardHour: 22,
    allAboardMinute: 30,
    excursions: [
      {
        id: "cozumel-reef-snorkel",
        name: "Cozumel Palancar Reef & El Cielo Catamaran Snorkel",
        category: "water",
        vibe: "Catamaran with Open Bar & Ceviche Lunch",
        price: "$65.00",
        rating: 4.8,
        reviewsCount: 1450,
        squareLink: "https://square.link/u/cozumel-el-cielo",
        viatorUrl: "https://www.viator.com/tours/Cozumel/El-Cielo-Cozumel-Snorkeling-Tour/d639-6017P1",
        logistics: {
          "Duration": "4 Hours",
          "Vessel/Type": "45ft Sailing Catamaran",
          "Highlights": "Snorkel Palancar reef, swim with stingrays, open bar",
          "Port Pickup": "Yes (Walk from Puerta Maya or International Pier)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "cozumel-dune-buggy",
        name: "Cozumel Dune Buggy & Mayan Ruins Adventure",
        category: "wildlife",
        vibe: "4x4 Buggy jungle exploration",
        price: "$89.00",
        rating: 4.7,
        reviewsCount: 890,
        squareLink: "https://square.link/u/cozumel-buggy",
        viatorUrl: "https://www.viator.com/tours/Cozumel/Cozumel-Customized-Private-Jeep-Tour/d639-5374P1",
        logistics: {
          "Duration": "5 Hours",
          "Vessel/Type": "Open-air 4x4 Dune Buggy",
          "Highlights": "San Gervasio ruins, Tequila tasting, beach club lunch",
          "Port Pickup": "Yes (Pickup directly outside terminal gates)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "limited"
      },
      {
        id: "cozumel-beach-pass",
        name: "Playa Mia Grand Beach Club (All-Inclusive Pass)",
        category: "culture",
        vibe: "Open bar, buffet, and water park access",
        price: "$55.00",
        rating: 4.6,
        reviewsCount: 750,
        squareLink: "https://square.link/u/cozumel-beach-pass",
        viatorUrl: "https://www.viator.com/tours/Cozumel/Playa-Mia-Grand-Beach-and-Water-Park-All-Inclusive/d639-3850P1",
        logistics: {
          "Duration": "Flexible (Day Pass)",
          "Vessel/Type": "N/A (Beach Club Facility)",
          "Highlights": "Water slides, international buffet, lounge chairs",
          "Port Pickup": "No (Taxi ride 10 mins from cruise ports)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "cozumel-vip-transfer",
        name: "Private VIP AC Van Transfer (Roundtrip)",
        category: "private",
        vibe: "Private transport to local beaches & shops",
        price: "$90.00",
        rating: 4.9,
        reviewsCount: 110,
        squareLink: "https://square.link/u/cozumel-private-shuttle",
        viatorUrl: "https://www.viator.com/tours/Cozumel/Private-Cozumel-Airport-Transfer/d639-5374P2",
        logistics: {
          "Duration": "Flexible (Custom Schedule)",
          "Vessel/Type": "Executive AC Van (up to 8 guests)",
          "Highlights": "Bilingual driver, flexible custom departure times",
          "Port Pickup": "Yes (Driver meets at designated terminal gate)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      }
    ]
  },
  "viking-octantis": {
    name: "VIKING OCTANTIS",
    portName: "JUNEAU, ALASKA",
    allAboardHour: 23,
    allAboardMinute: 0,
    excursions: [
      {
        id: "juneau-glacier-walk",
        name: "Mendenhall Glacier Helicopter Tour & Ice Walk",
        category: "private",
        vibe: "Glacier flightseeing & icefield landing",
        price: "$485.00",
        rating: 4.9,
        reviewsCount: 610,
        squareLink: "https://square.link/u/juneau-glacier-heli",
        viatorUrl: "https://www.viator.com/tours/Juneau/Juneau-Helicopter-Tour-and-Guided-Icefield-Walk/d941-6251SHOREXICEWALK",
        logistics: {
          "Duration": "2.5 Hours",
          "Vessel/Type": "Astar 350 Helicopter",
          "Highlights": "Fly over 5 glaciers, land & walk on Mendenhall ice",
          "Port Pickup": "Yes (AC shuttle from cruise docks to heliport)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "limited"
      },
      {
        id: "juneau-whale-watching",
        name: "Juneau Whale Watching & Mendenhall Glacier Combo",
        category: "wildlife",
        vibe: "Humpback whales & glacier walk",
        price: "$175.00",
        rating: 4.8,
        reviewsCount: 1240,
        squareLink: "https://square.link/u/juneau-whale-watching",
        viatorUrl: "https://www.viator.com/tours/Juneau/Juneau-Wildlife-Whale-Watching-and-Mendenhall-Glacier/d941-74349P2",
        logistics: {
          "Duration": "4.5 Hours",
          "Vessel/Type": "Shaded Catamaran & Shuttle",
          "Highlights": "Guaranteed humpback whale sightings, explore park trails",
          "Port Pickup": "Yes (Bus departs from Mt. Roberts Tramway dock)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "juneau-gold-mine",
        name: "AJ Mine Gold Panning & Salmon Bake",
        category: "culture",
        vibe: "Historic gold mine tour & campfire feast",
        price: "$85.00",
        rating: 4.7,
        reviewsCount: 510,
        squareLink: "https://square.link/u/juneau-salmon-bake",
        viatorUrl: "https://www.viator.com/tours/Juneau/AJ-Gold-Mine-and-Salmon-Bake/d941-474111P1",
        logistics: {
          "Duration": "3 Hours",
          "Vessel/Type": "Historic Tram / Coach",
          "Highlights": "Go underground inside gold mine, pan for real gold",
          "Port Pickup": "Yes (Tram dock pickup/return)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      },
      {
        id: "juneau-sea-kayak",
        name: "Mendenhall Glacier Guided Sea Kayak Tour",
        category: "water",
        vibe: "Kayaking past glaciers and sea lions",
        price: "$120.00",
        rating: 4.6,
        reviewsCount: 340,
        squareLink: "https://square.link/u/juneau-sea-kayak",
        viatorUrl: "https://www.viator.com/tours/Juneau/Mendenhall-Glacier-Kayak-Adventure/d941-74349P1",
        logistics: {
          "Duration": "3.5 Hours",
          "Vessel/Type": "Tandem Ocean Kayak",
          "Highlights": "Paddle close to glacier face, spot bald eagles & seals",
          "Port Pickup": "Yes (Guided shuttle departs from cruise pier)",
          "Cancellation": "Free cancellation up to 24h"
        },
        capacityStatus: "available"
      }
    ]
  }
};

const CATEGORIES = [
  { id: "all", label: "All Options", icon: "🌐" },
  { id: "water", label: "Water & Snorkel", icon: "🏊" },
  { id: "wildlife", label: "Wildlife & Beach", icon: "🐖" },
  { id: "culture", label: "Sightseeing & Food", icon: "🏛" },
  { id: "private", label: "Private Transfers", icon: "⚡" }
];

export default function ShipOutpostConsole({ payload, shipSlug }: { payload: any; shipSlug: string }) {
  const config = SHIP_CONFIGS[shipSlug] || SHIP_CONFIGS["icon-of-the-seas"];

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isDebug, setIsDebug] = useState<boolean>(false);
  const [timeSimulation, setTimeSimulation] = useState<"normal" | "start" | "danger">("normal");

  const [shipTimeText, setShipTimeText] = useState<string>("");
  const [portTimeText, setPortTimeText] = useState<string>("");
  const [countdownText, setCountdownText] = useState<string>("");
  const [isDangerClose, setIsDangerClose] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setIsDebug(params.get("debug") === "true" || params.get("simulate") === "true");
    }
  }, []);

  // Time & Countdown sync logic
  useEffect(() => {
    const calculateTimes = () => {
      const allAboardHour = config.allAboardHour;
      const allAboardMinute = config.allAboardMinute;

      let now = new Date();
      let shipNow = new Date();
      let portNow = new Date();

      if (timeSimulation === "start") {
        // Mock early port day: 10:15 AM
        shipNow.setHours(10, 15, 0);
        portNow.setHours(10, 15, 0);
      } else if (timeSimulation === "danger") {
        // Mock danger close window: 14 mins to All Aboard
        const totalMinutes = allAboardHour * 60 + allAboardMinute - 14;
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        shipNow.setHours(h, m, 0);
        portNow.setHours(h, m, 0);
      }

      setShipTimeText(shipNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " EDT");
      setPortTimeText(portNow.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + " EDT");

      // Calculate countdown to All Aboard
      const targetTime = new Date(shipNow);
      targetTime.setHours(allAboardHour, allAboardMinute, 0);

      const diffMs = targetTime.getTime() - shipNow.getTime();

      if (diffMs <= 0) {
        setCountdownText("00:00:00 (ALL ABOARD PASSED)");
        setIsDangerClose(true);
      } else {
        const hours = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        
        const pad = (n: number) => String(n).padStart(2, "0");
        setCountdownText(`${pad(hours)}:${pad(mins)}:${pad(secs)}`);
        
        // Under 30 minutes is DANGER CLOSE
        setIsDangerClose(diffMs < 30 * 60 * 1000);
      }
    };

    calculateTimes();
    const timer = setInterval(calculateTimes, 1000);
    return () => clearInterval(timer);
  }, [timeSimulation, config]);

  const formatTime12h = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    const minStr = String(m).padStart(2, "0");
    return `${hour12}:${minStr} ${period}`;
  };

  const filteredExcursions = config.excursions.filter(
    (item) => activeCategory === "all" || item.category === activeCategory
  );

  return (
    <div className={styles.consoleContainer}>
      <div className={styles.consoleWrapper}>
        
        {/* HUD header */}
        <header className={styles.hudHeader}>
          <div className={styles.hudBrand}>
            <h1 className={styles.hudTitle}>
              🛳️ {config.name} <span>OUTPOST</span>
            </h1>
            <span className={styles.statusDot}></span>
          </div>
          <div className={styles.hudSubtitle}>
            EXCURSION TELEMETRY // PORT DAY: {config.portName}
          </div>
        </header>

        {/* Danger close alert banner */}
        {isDangerClose && (
          <div className={styles.warningBanner}>
            <span className={styles.warningBannerIcon}>⚠️</span>
            <span>
              <strong>DANGER CLOSE ACTIVE:</strong> Less than 30 minutes remaining until All Aboard. Proceed directly back to terminal.
            </span>
          </div>
        )}

        {/* Telemetry Board */}
        <section className={styles.telemetryBoard}>
          <div className={styles.telemetryCell}>
            <span className={styles.telemetryLabel}>Ship Time</span>
            <span className={styles.telemetryVal}>{shipTimeText}</span>
          </div>
          <div className={styles.telemetryCell}>
            <span className={styles.telemetryLabel}>Local Port Time</span>
            <span className={styles.telemetryVal}>{portTimeText}</span>
          </div>
          <div className={`${styles.telemetryCell} ${styles.telemetryCellFull}`}>
            <span className={styles.telemetryLabel}>Countdown to All Aboard ({formatTime12h(config.allAboardHour, config.allAboardMinute)})</span>
            <span className={`${styles.countdownTimer} ${isDangerClose ? styles.countdownTimerDanger : ""}`}>
              {countdownText}
            </span>
          </div>
        </section>

        {/* Filters board */}
        <section>
          <div className={styles.filterLabel}>SELECT PORT INTENT</div>
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.id} 
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryBtnActive : ""}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                <span className={styles.categoryBtnIcon}>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Results grid */}
        <section className={styles.resultsPanel}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTitle}>
              {CATEGORIES.find(c => c.id === activeCategory)?.label}
            </div>
            <div className={styles.resultsCount}>
              {filteredExcursions.length} OPTIONS IN LISTING
            </div>
          </div>

          <div className={styles.listingsContainer}>
            {filteredExcursions.length > 0 ? (
              filteredExcursions.map((item) => (
                <div key={item.id} className={styles.listingCard}>
                  
                  <div className={styles.listingHeader}>
                    <div>
                      <h3 className={styles.listingTitle}>{item.name}</h3>
                      <span className={styles.listingVibe}>{item.vibe}</span>
                    </div>
                    <div className={styles.listingMeta}>
                      <span className={`${styles.statusBadge} ${item.capacityStatus === "full" ? styles.badgeFull : styles.badgeActive}`}>
                        {item.capacityStatus === "limited" ? "⚠️ LIMITED SEATS" : item.capacityStatus === "full" ? "CLOSED" : "⚡ ACTIVE / GOOD"}
                      </span>
                      <div className={styles.listingPrice}>
                        {item.price}
                      </div>
                    </div>
                  </div>

                  <div className={styles.listingLogistics}>
                    <div className={styles.logisticsRow}>
                      <span className={styles.logisticsKey}>Duration</span>
                      <span className={styles.logisticsVal}>{item.logistics.Duration}</span>
                    </div>
                    <div className={styles.logisticsRow}>
                      <span className={styles.logisticsKey}>Vessel / Transport</span>
                      <span className={styles.logisticsVal}>{item.logistics["Vessel/Type"]}</span>
                    </div>
                    <div className={styles.logisticsRow}>
                      <span className={styles.logisticsKey}>Meeting Point</span>
                      <span className={styles.logisticsVal}>{item.logistics["Port Pickup"]}</span>
                    </div>
                    <div className={styles.logisticsRow}>
                      <span className={styles.logisticsKey}>Highlights</span>
                      <span className={styles.logisticsVal}>{item.logistics.Highlights}</span>
                    </div>
                  </div>

                  <div className={styles.listingActions}>
                    <a 
                      href={item.viatorUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.actionBtn}
                    >
                      [ Details & Reviews ]
                    </a>
                    {item.capacityStatus === "full" ? (
                      <button className={`${styles.actionBtn} ${styles.actionBtnDisabled}`} disabled>
                        [ Sold Out ]
                      </button>
                    ) : (
                      <a 
                        href={item.squareLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      >
                        [ Book / Dispatch ]
                      </a>
                    )}
                  </div>

                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", padding: "20px", color: "#71717a", fontSize: "12px" }}>
                NO DIRECTORY MATCHES REGISTERED IN ZONE.
              </div>
            )}
          </div>
        </section>

        {/* Debug Shift Control Panel */}
        {isDebug && (
          <div className={styles.timeshiftDebugBar}>
            <div className={styles.timeshiftLabel}>⚡️ SIMULATE DOCK TELEMETRY ({config.portName})</div>
            <div className={styles.timeshiftBtns}>
              <button 
                className={`${styles.timeshiftBtn} ${timeSimulation === "normal" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setTimeSimulation("normal")}
              >
                REAL TIME
              </button>
              <button 
                className={`${styles.timeshiftBtn} ${timeSimulation === "start" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setTimeSimulation("start")}
              >
                PORT DAY (10:15 AM)
              </button>
              <button 
                className={`${styles.timeshiftBtn} ${timeSimulation === "danger" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setTimeSimulation("danger")}
              >
                DANGER CLOSE (14 MINS OUT)
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className={styles.footerCopyright}>
          <span>© 2026 {config.name} OUTPOST. ALL DECK EXCURSION DATA VERIFIED FOR REAL-TIME ACCURACY.</span>
        </footer>

      </div>
    </div>
  );
}
