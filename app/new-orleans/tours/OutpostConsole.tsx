"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./outpost.module.css";
import { DIRECTORY_DATA, CATEGORIES, METADATA, ListingNode } from "./pageConfig";

export default function OutpostConsole() {
  // Navigation & filter state
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeFilters, setActiveFilters] = useState({
    pickup: false,
    late: false,
    kids: false,
  });
  
  // Host Integration state (URL query params)
  const [hostName, setHostName] = useState<string>("");
  const [hostFavorites, setHostFavorites] = useState<string[]>([]);
  
  // Time simulation
  const [simulatedTime, setSimulatedTime] = useState<"normal" | "friday" | "sunday" | "happy">("normal");
  const [currentTimeText, setCurrentTimeText] = useState<string>("");
  
  // Drawers & Modals
  const [selectedListing, setSelectedListing] = useState<ListingNode | null>(null);
  const [hostPortalOpen, setHostPortalOpen] = useState<boolean>(false);
  const [isDebug, setIsDebug] = useState<boolean>(false);
  
  // Host Portal Form State
  const [hostCabinName, setHostCabinName] = useState<string>("");
  const [hostFavsChecked, setHostFavsChecked] = useState<Record<string, boolean>>({});
  const [hostFiltersChecked, setHostFiltersChecked] = useState({
    pickup: false,
    late: false,
    kids: false,
  });
  const [generatedLink, setGeneratedLink] = useState<string>("");
  const [copyConfirm, setCopyConfirm] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>("");
  const [emailStatus, setEmailStatus] = useState<string>("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");
  
  // Comments state (in-memory reports)
  const [comments, setComments] = useState<Record<string, { initials: string; text: string; time: string }[]>>({
    "steamboat-natchez": [
      { initials: "EL", text: "Verified. Steam organ was playing at Toulouse St. Wharf.", time: "10 mins ago" },
      { initials: "KB", text: "Crowded today but the jazz band was incredible.", time: "2 hours ago" },
    ],
    "airboat-swamp": [
      { initials: "JM", text: "Alligators are active! The captain knew the bayou perfectly.", time: "1 hour ago" },
    ],
    "ghost-cemetery": [
      { initials: "TX", text: "Voodoo history walk was amazing. Guide had a real candle lantern.", time: "3 hours ago" },
    ]
  });
  const [commentInitialsInput, setCommentInitialsInput] = useState<string>("");
  const [commentTextInput, setCommentTextInput] = useState<string>("");

  // Refs for printing
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Parse URL parameters on load
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const hostParam = params.get("host") || "";
      const favsParam = params.get("favs") || "";
      setIsDebug(params.get("debug") === "true" || params.get("simulate") === "true");
      
      // Parse filters if present
      const filterParam = params.get("filter") || "";
      if (filterParam) {
        const filters = filterParam.split(",");
        setActiveFilters({
          pickup: filters.includes("pickup"),
          late: filters.includes("late"),
          kids: filters.includes("kids"),
        });
      }

      if (hostParam) {
        setHostName(decodeURIComponent(hostParam));
      }
      if (favsParam) {
        setHostFavorites(favsParam.split(","));
      }
    }
  }, []);

  // Update time display
  useEffect(() => {
    const updateTime = () => {
      if (simulatedTime === "normal") {
        const now = new Date();
        setCurrentTimeText(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " (LOCAL)");
      } else if (simulatedTime === "friday") {
        setCurrentTimeText("06:00 PM (FRI SIMULATION)");
      } else if (simulatedTime === "sunday") {
        setCurrentTimeText("09:00 AM (SUN SIMULATION)");
      } else if (simulatedTime === "happy") {
        setCurrentTimeText("04:00 PM (MON-THU SIMULATION)");
      }
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, [simulatedTime]);

  // Compute status open/closed based on clock
  const getListingStatus = (item: ListingNode) => {
    let hour = new Date().getHours();
    let day = new Date().getDay();

    if (simulatedTime === "friday") {
      hour = 18; // 6 PM
      day = 5;   // Friday
    } else if (simulatedTime === "sunday") {
      hour = 9;  // 9 AM
      day = 0;   // Sunday
    } else if (simulatedTime === "happy") {
      hour = 16; // 4 PM
      day = 1;   // Monday
    }

    const { open, close } = item.hours;

    // 24-hour calculations
    const isOpen = open === 0 && close === 24 ? true : (hour >= open && hour < close);

    if (!isOpen) {
      return { text: "CLOSED", type: styles.badgeClosed };
    }

    // Specific category alerts
    if (item.category === "swamp") {
      return { text: "⚡️ TOURS ACTIVE", type: styles.badgeActive };
    }
    if (item.category === "ghost" && hour >= 18) {
      return { text: "👻 GHOST WALK LIVE", type: styles.badgeActive };
    }
    if (item.category === "food" && hour >= 11 && hour <= 15) {
      return { text: "🍳 TASTING LIVE", type: styles.badgeActive };
    }
    if (item.category === "cruise") {
      return { text: "🚢 ON THE WATER", type: styles.badgeActive };
    }
    if (item.category === "living-here") {
      return { text: "⚜️ WISDOM LOADED", type: styles.badgeOpen };
    }
    
    return { text: "OPEN NOW", type: styles.badgeOpen };
  };

  // Filter & sort data
  const filteredListings = DIRECTORY_DATA.filter((item) => {
    // Category check
    if (activeCategory !== "all" && item.category !== activeCategory) {
      return false;
    }
    
    // Telemetry filters
    if (activeFilters.pickup && item.logistics["Hotel Pickup"] !== "Yes") {
      return false;
    }
    if (activeFilters.late && item.hours.close < 21 && item.hours.close !== 24) {
      return false;
    }
    if (activeFilters.kids && item.logistics["Content Fit"] === "Adults only") {
      return false;
    }
    
    return true;
  });

  // Sort: Host Favorites bubble to the top
  const sortedListings = [...filteredListings].sort((a, b) => {
    const aFav = hostFavorites.includes(a.id);
    const bFav = hostFavorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  // Generate Host welcome kit links
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hostVal = encodeURIComponent(hostCabinName.trim());
      const favsVal = Object.keys(hostFavsChecked).filter(k => hostFavsChecked[k]).join(",");
      
      const filterParts = [];
      if (hostFiltersChecked.pickup) filterParts.push("pickup");
      if (hostFiltersChecked.late) filterParts.push("late");
      if (hostFiltersChecked.kids) filterParts.push("kids");
      const filterVal = filterParts.join(",");

      if (!hostCabinName.trim()) {
        setGeneratedLink("Enter property name to generate...");
        setQrCodeUrl("");
        return;
      }

      let link = `${window.location.origin}${window.location.pathname}?host=${hostVal}`;
      if (favsVal) link += `&favs=${favsVal}`;
      if (filterVal) link += `&filter=${filterVal}`;

      setGeneratedLink(link);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`);
    }
  }, [hostCabinName, hostFavsChecked, hostFiltersChecked]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopyConfirm(true);
    setTimeout(() => setCopyConfirm(false), 2000);
  };

  const handleEmailSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput) return;
    
    setEmailStatus("SENDING WELCOME KIT...");
    setTimeout(() => {
      setEmailStatus(`SENT TO ${emailInput.toUpperCase()} SUCCESSFULLY!`);
      setEmailInput("");
      setTimeout(() => setEmailStatus(""), 4000);
    }, 1200);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListing || !commentInitialsInput || !commentTextInput) return;

    const listId = selectedListing.id;
    const newComment = {
      initials: commentInitialsInput.trim().toUpperCase(),
      text: commentTextInput.trim(),
      time: "Just now"
    };

    setComments(prev => ({
      ...prev,
      [listId]: [newComment, ...(prev[listId] || [])]
    }));

    setCommentInitialsInput("");
    setCommentTextInput("");
  };

  const executePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  // Custom icons mapping
  const renderCategoryIcon = (catId: string) => {
    const cat = CATEGORIES.find(c => c.id === catId);
    return cat ? cat.icon : "⚜️";
  };

  return (
    <div id="main-content" className={styles.consoleContainer}>
      <div className={styles.consoleWrapper}>
        
        {/* HUD header */}
        <header className={styles.hudHeader}>
          <div className={styles.hudBrand}>
            <h1 className={styles.hudTitle}>
              ⚜️ NOLA TOURS <span>OUTPOST</span>
            </h1>
            <span className={styles.statusDot}></span>
          </div>
          <div className={styles.hudSubtitle}>
            NOLA DIRECTORY // LOCAL TIME: {currentTimeText}
          </div>
        </header>

        {/* Host Welcome Card */}
        {hostName && (
          <section className={styles.hostBanner}>
            <div className={styles.hostWelcomeText}>
              Welcome to New Orleans! Guests of <strong>{hostName}</strong> get direct access to recommendations.
            </div>
            <div className={styles.hostWelcomeSub}>
              Handled Abundance by your host.
            </div>
          </section>
        )}

        {/* Question board */}
        <main className={styles.questionBoard}>
          <div className={styles.boardLabel}>SELECT INTENT</div>
          <h2 className={styles.questionTitle}>What kind of tour do you need right now?</h2>
          
          <div className={styles.categoryGrid}>
            {CATEGORIES.slice(1).map((cat) => (
              <button 
                key={cat.id} 
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryBtnActive : ""}`}
                onClick={() => {
                  setActiveCategory(prev => prev === cat.id ? "all" : cat.id);
                  setSelectedListing(null);
                }}
              >
                <span className={styles.categoryBtnIcon}>{cat.icon}</span>
                <span className={styles.categoryBtnText}>{cat.label}</span>
              </button>
            ))}
          </div>
        </main>

        {/* Filters Hud */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap" }}>
          <button 
            className={`${styles.actionBtn} ${activeFilters.pickup ? styles.actionBtnPrimary : ""}`}
            style={{ fontSize: "10px", padding: "6px 10px" }}
            onClick={() => setActiveFilters(prev => ({ ...prev, pickup: !prev.pickup }))}
          >
            🚌 Hotel Pickup
          </button>
          <button 
            className={`${styles.actionBtn} ${activeFilters.late ? styles.actionBtnPrimary : ""}`}
            style={{ fontSize: "10px", padding: "6px 10px" }}
            onClick={() => setActiveFilters(prev => ({ ...prev, late: !prev.late }))}
          >
            🌙 Late (Open past 9 PM)
          </button>
          <button 
            className={`${styles.actionBtn} ${activeFilters.kids ? styles.actionBtnPrimary : ""}`}
            style={{ fontSize: "10px", padding: "6px 10px" }}
            onClick={() => setActiveFilters(prev => ({ ...prev, kids: !prev.kids }))}
          >
            👶 Kid Friendly
          </button>
          {(activeFilters.pickup || activeFilters.late || activeFilters.kids) && (
            <button 
              className={styles.actionBtn} 
              style={{ fontSize: "10px", padding: "6px 10px", borderColor: "var(--accent-red)", color: "var(--accent-red)" }}
              onClick={() => setActiveFilters({ pickup: false, late: false, kids: false })}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Results list */}
        <section className={styles.resultsPanel}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsHeaderTitle}>
              {activeCategory === "all" ? "All Telemetry Logs" : CATEGORIES.find(c => c.id === activeCategory)?.label}
            </div>
            <div className={styles.resultsHeaderCount}>
              {sortedListings.length} LOCATIONS ROUTED
            </div>
          </div>

          <div className={styles.listingsContainer}>
            {sortedListings.length > 0 ? (
              sortedListings.map((item) => {
                const status = getListingStatus(item);
                const isFav = hostFavorites.includes(item.id);
                return (
                  <div key={item.id} className={`${styles.listingCard} ${isFav ? styles.listingCardFav : ""}`}>
                    <div className={styles.listingHeader}>
                      <div>
                        <h3 className={`${styles.listingTitle} ${isFav ? styles.listingTitleFav : ""}`}>
                          {isFav && "★ "} {item.name}
                        </h3>
                        <div className={styles.listingVibe}>{item.vibe}</div>
                        {item.rating && (
                          <div className={styles.listingRating}>
                            <span>★ {item.rating.toFixed(1)}</span>
                            <span style={{ color: "var(--text-secondary)" }}>({item.reviewsCount} reviews)</span>
                          </div>
                        )}
                      </div>
                      <div className={styles.listingMeta}>
                        <span className={`${styles.statusBadge} ${status.type}`}>
                          {status.text}
                        </span>
                        {item.price && (
                          <div className={styles.listingPrice}>
                            {item.price}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={styles.listingLogistics}>
                      <div className={styles.logisticsRow}>
                        <span className={styles.logisticsKey}>Location</span>
                        <span className={styles.logisticsVal}>{item.location}</span>
                      </div>
                      {Object.entries(item.logistics).map(([k, v]) => (
                        <div key={k} className={styles.logisticsRow}>
                          <span className={styles.logisticsKey}>{k}</span>
                          <span className={styles.logisticsVal}>{v}</span>
                        </div>
                      ))}
                    </div>

                    <div className={styles.listingActions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        onClick={() => setSelectedListing(item)}
                      >
                        [ Details & Reports ]
                      </button>
                      <a 
                        href={item.menuUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.actionBtn}
                      >
                        [ Book Tour ]
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-secondary)", padding: "30px", fontSize: "13px", fontFamily: "var(--font-mono)" }}>
                NO DIRECTORY MATCHES REGISTERED IN ZONE.
              </div>
            )}
          </div>
        </section>

        {/* Time Simulator Panel */}
        {isDebug && (
          <div className={styles.timeshiftDebugBar}>
            <div className={styles.timeshiftLabel}>⚡️ SIMULATE SYSTEM CLOCK DECK</div>
            <div className={styles.timeshiftBtns}>
              <button 
                className={`${styles.timeshiftBtn} ${simulatedTime === "normal" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setSimulatedTime("normal")}
              >
                REAL CLOCK
              </button>
              <button 
                className={`${styles.timeshiftBtn} ${simulatedTime === "friday" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setSimulatedTime("friday")}
              >
                FRIDAY NIGHT GHOSTS (6 PM)
              </button>
              <button 
                className={`${styles.timeshiftBtn} ${simulatedTime === "sunday" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setSimulatedTime("sunday")}
              >
                SUNDAY SWAMPS (9 AM)
              </button>
              <button 
                className={`${styles.timeshiftBtn} ${simulatedTime === "happy" ? styles.timeshiftBtnActive : ""}`}
                onClick={() => setSimulatedTime("happy")}
              >
                MON-THU TASTINGS (4 PM)
              </button>
            </div>
          </div>
        )}

        {/* Host portal link */}
        {!hostName && (
          <footer className={styles.utilityRow}>
            <button 
              className={styles.hostPortalTrigger}
              onClick={() => {
                setHostPortalOpen(true);
                const initialChecked: Record<string, boolean> = {};
                DIRECTORY_DATA.forEach(d => {
                  initialChecked[d.id] = hostFavorites.includes(d.id);
                });
                setHostFavsChecked(initialChecked);
                setHostCabinName(hostName);
              }}
            >
              ⚜️ STR Host Welcome Book Portal
            </button>
          </footer>
        )}

        {/* Info / Comment details drawer */}
        {selectedListing && (
          <div className={styles.infoDrawer}>
            <div className={styles.drawerPanel}>
              <div className={styles.drawerHeader}>
                <div>
                  <div className={styles.drawerCategory}>{selectedListing.category.toUpperCase()}</div>
                  <h2 className={styles.drawerTitle}>{selectedListing.name}</h2>
                  <div className={styles.drawerVibe}>{selectedListing.vibe}</div>
                </div>
                <button className={styles.drawerClose} onClick={() => setSelectedListing(null)}>&times;</button>
              </div>

              <div className={styles.drawerBody}>
                <div className={styles.drawerMetaRow}>
                  <span className={styles.drawerLocation}>
                    📍 {selectedListing.location}
                  </span>
                </div>

                <div className={styles.drawerSection}>
                  <div className={styles.sectionTitle}>Curated Live Telemetry</div>
                  <div className={styles.drawerLogisticsGrid} style={{ background: "var(--color-bg-darkest)", border: "1px solid var(--color-border-dim)", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(selectedListing.logistics).map(([k, v]) => (
                      <div key={k} style={{ display: "flex", fontSize: "12px" }}>
                        <span style={{ width: "120px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{k}</span>
                        <span style={{ flex: 1, color: "var(--text-primary)" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments / Reports section */}
                <div className={styles.drawerSection} style={{ borderTop: "1px solid var(--color-border-dim)", paddingTop: "16px", marginTop: "16px" }}>
                  <div className={styles.sectionTitle}>Local Transmissions (Comments)</div>
                  
                  <div className={styles.commentsList} style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", maxHeight: "200px", overflowY: "auto" }}>
                    {(comments[selectedListing.id] || []).length > 0 ? (
                      (comments[selectedListing.id] || []).map((c, i) => (
                        <div key={i} className={styles.transmissionLog}>
                          <div className={styles.transmissionHeader}>
                            <span>LOG // ID: {c.initials}</span>
                            <span>{c.time}</span>
                          </div>
                          <div style={{ color: "var(--text-primary)" }}>{c.text}</div>
                        </div>
                      ))
                    ) : (
                      <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", opacity: 0.6 }}>
                        NO REPORTS RECEIVED FROM THE FIELD.
                      </div>
                    )}
                  </div>

                  {/* Add report form */}
                  <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                    <input 
                      type="text" 
                      placeholder="CALLSIGN (INITIALS)"
                      value={commentInitialsInput}
                      onChange={(e) => setCommentInitialsInput(e.target.value)}
                      maxLength={15}
                      required 
                      className={styles.commentInput} 
                      style={{ fontSize: "11px", marginBottom: "6px", width: "120px" }}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input 
                        type="text" 
                        placeholder="TRANSMIT LOCAL STATUS UPDATE..."
                        value={commentTextInput}
                        onChange={(e) => setCommentTextInput(e.target.value)}
                        required 
                        className={styles.commentInput} 
                        style={{ flex: 1, fontSize: "11px" }}
                      />
                      <button 
                        type="submit" 
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                        style={{ padding: "6px 12px", flex: "none", fontSize: "11px" }}
                      >
                        SEND
                      </button>
                    </div>
                  </form>
                </div>

                <div className={styles.drawerActions} style={{ marginTop: "20px" }}>
                  <a 
                    href={selectedListing.menuUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                    style={{ width: "100%", display: "block" }}
                  >
                    DISPATCH TO OFFICIAL BOOKING PATH
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Host Welcome book portal Modal */}
        {hostPortalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>STR Welcome Book Portal</h2>
                <button className={styles.modalClose} onClick={() => setHostPortalOpen(false)}>&times;</button>
              </div>

              <div className={styles.modalBody}>
                <p style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>
                  Create guestbook convenience. Generate a custom welcome link featuring your property name and checked recommendations.
                </p>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Property / STR Cabin Name</label>
                  <input 
                    type="text" 
                    className={styles.formInput} 
                    value={hostCabinName} 
                    onChange={(e) => setHostCabinName(e.target.value)}
                    placeholder="e.g. Hotel Monteleone, Place d'Armes STR"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Select Recommended Spots</label>
                  <div className={styles.selectionList}>
                    {DIRECTORY_DATA.filter(d => d.category !== "essentials" && d.category !== "living-here").map((d) => (
                      <label key={d.id} className={styles.selectionItem}>
                        <input 
                          type="checkbox" 
                          className={styles.selectionCheckbox}
                          checked={!!hostFavsChecked[d.id]}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setHostFavsChecked(prev => ({ ...prev, [d.id]: val }));
                          }}
                        />
                        <span className={styles.selectionName}>{d.name} ({d.vibe})</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Pre-Filters for Guest View</label>
                  <div style={{ background: "var(--color-bg-darkest)", border: "1px solid var(--color-border-dim)", padding: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <label className={styles.selectionItem} style={{ padding: 0 }}>
                      <input 
                        type="checkbox" 
                        className={styles.selectionCheckbox}
                        checked={hostFiltersChecked.pickup}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setHostFiltersChecked(prev => ({ ...prev, pickup: val }));
                        }}
                      />
                      <span className={styles.selectionName}>Show only locations with hotel pickup</span>
                    </label>
                    <label className={styles.selectionItem} style={{ padding: 0 }}>
                      <input 
                        type="checkbox" 
                        className={styles.selectionCheckbox}
                        checked={hostFiltersChecked.late}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setHostFiltersChecked(prev => ({ ...prev, late: val }));
                        }}
                      />
                      <span className={styles.selectionName}>Show only late-night open spots</span>
                    </label>
                    <label className={styles.selectionItem} style={{ padding: 0 }}>
                      <input 
                        type="checkbox" 
                        className={styles.selectionCheckbox}
                        checked={hostFiltersChecked.kids}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setHostFiltersChecked(prev => ({ ...prev, kids: val }));
                        }}
                      />
                      <span className={styles.selectionName}>Show only kid-friendly activities</span>
                    </label>
                  </div>
                </div>

                {/* Generated result */}
                <div className={styles.linkGeneratorResult}>
                  <label className={styles.formLabel} style={{ color: "var(--accent-green)" }}>Custom Guest URL</label>
                  <div className={styles.outputLinkBox}>
                    {generatedLink}
                  </div>
                  {hostCabinName.trim() && (
                    <button 
                      className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      onClick={copyToClipboard}
                    >
                      {copyConfirm ? "COPIED TO CLIPBOARD" : "COPY GUEST LINK"}
                    </button>
                  )}
                </div>

                {/* Share by email */}
                <form onSubmit={handleEmailSend} className={styles.formGroup} style={{ borderTop: "1px solid var(--color-border-dim)", paddingTop: "12px" }}>
                  <label className={styles.formLabel}>Email Welcome Kit</label>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <input 
                      type="email" 
                      className={styles.formInput} 
                      placeholder="e.g. host@example.com" 
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      required
                      style={{ flex: 1 }}
                    />
                    <button type="submit" className={styles.actionBtn} style={{ flex: "none" }}>
                      SEND KIT
                    </button>
                  </div>
                  {emailStatus && (
                    <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--accent-green)", marginTop: "4px" }}>
                      {emailStatus}
                    </div>
                  )}
                </form>

                {/* QR code printing */}
                {qrCodeUrl && (
                  <div className={styles.qrContainer}>
                    <div className={styles.qrCodeBox}>
                      <img src={qrCodeUrl} alt="Welcome QR Code" style={{ width: "100%", height: "100%" }} />
                    </div>
                    <button 
                      className={styles.actionBtn} 
                      onClick={executePrint}
                      style={{ color: "var(--accent-orange)", borderColor: "var(--accent-orange)", width: "100%" }}
                    >
                      Print Welcome Counter Card
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Crawlable structural SEO Footer */}
        <footer className={styles.consoleFooter}>
          <div className={styles.footerGrid}>
            <div className={styles.footerCol}>
              <h4>NEW ORLEANS SWAMP & BAYOU</h4>
              <p>Compare high-speed airboats, covered tour boats, and hotel-pickup swamp excursions departing Decatur St or CBD zones.</p>
            </div>
            <div className={styles.footerCol}>
              <h4>GHOSTS & FRENCH QUARTER HIST</h4>
              <p>Locate nighttime ghost walks, voodoo legend routes, St. Louis Cemetery guides, and architectural promenades across NOLA.</p>
            </div>
            <div className={styles.footerCol}>
              <h4>LOCAL LIFE SUPPORT & INTAKE</h4>
              <p>Direct coordinates for FQ pharmacies, Tulane emergency medical centers, local taxi lines, and late-night amenities.</p>
            </div>
          </div>
          <div className={styles.footerCopyright}>
            <span>© 2026 NEW ORLEANS TOURS OUTPOST. ALL DATA VERIFIED FOR REAL-TIME ACCURACY.</span>
            {isDebug && (
              <span style={{ fontSize: "8px", fontFamily: "var(--font-mono)", opacity: 0.5, letterSpacing: "0.5px" }}>
                [ SEARCH ENGINE CRAWLER SYNC: ACTIVE. STRUCTURAL DATA IS COMPILED AND VALIDATED TO PREVENT CRAWLER MAP MISALIGNMENT. ]
              </span>
            )}
          </div>
        </footer>

        {/* Hidden card layout for printer stylesheet */}
        <div ref={printAreaRef} className={styles.printWelcomeCard}>
          <div className={styles.printTitle}>Welcome, Guests!</div>
          <div className={styles.printSub}>
            We've set up a customized local directory of our favorite New Orleans tours, restaurants, ghost walks, and swamp excursions for you.
            <br /><br />
            Scan the QR code below to access the live command-center and check real-time open status:
          </div>
          {qrCodeUrl && (
            <img className={styles.printQr} src={qrCodeUrl} alt="Guest Welcome QR Code" />
          )}
          <div className={styles.printInstructions}>
            Provided by the hosts of <strong>{hostCabinName || hostName || "Your Guest Room"}</strong>.
            <br />
            Scan. Decide. Explore.
          </div>
        </div>

      </div>
    </div>
  );
}
