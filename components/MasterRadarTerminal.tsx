"use client";

import { useState, useEffect, useRef } from "react";

const TELEMETRY_POOL = [
  "SYS_OK: SECURE GATEWAY ONLINE",
  "LIVE: PORT MIAMI DENSITY PEAKING",
  "TX AUTHORIZED: DENVER ARGO SHUTTLE",
  "RADAR: SWAMP AIRBOAT RESUPPLY SECURED",
  "GATE_ALERT: ROUTE PARR OVER CAPACITY",
  "SYS: EDGE ROUTING MATRIX STABLE",
  "LIVE: EAU CLAIRE INBOUND CORRIDOR ACCEL",
  "TX AUTHORIZED: COZUMEL SHORE PASSES ACTIVE",
  "TELEMETRY: SATELLITE HANDOFFS RECONCILED",
  "SYS: SHADOW ECONOMY VELVET GATES ARMED",
  "LIVE: NASSAU SHUTTLE DEPARTURE CLEARED",
  "RADAR: HELICOPTER GLACIER DISPATCH CONFIRMED",
  "GATE_ALERT: KEY WEST CORRIDOR PEAK DENSITY",
];

const MOCK_AVATARS = [
  { name: "S. Miller", color: "#00D2FF", initials: "SM" },
  { name: "J. Vance", color: "#FF5E97", initials: "JV" },
  { name: "K. Chen", color: "#39FF14", initials: "KC" },
];

export default function MasterRadarTerminal() {
  const [telemetry, setTelemetry] = useState<Array<{ time: string; tag: string; msg: string; color: string }>>([
    { time: "19:09:00", tag: "SYS_OK", msg: "MASTER RADAR TELEMETRY STREAM ONLINE", color: "#39FF14" },
    { time: "19:09:05", tag: "SYS_OK", msg: "SECURE TELEMETRY PIPELINE CONNECTED", color: "#39FF14" },
    { time: "19:09:10", tag: "AUTH", msg: "VELVET GATES ENCRYPTED", color: "#ffb000" },
  ]);

  const [blips, setBlips] = useState([
    { id: 1, name: "DCC-01: MIA-PORT", x: 120, y: 150, lat: "25.774", lng: "-80.185", status: "ONLINE", opacity: 0.8 },
    { id: 2, name: "DCC-02: NOLA-SWAMP", x: 280, y: 100, lat: "29.951", lng: "-90.071", status: "ONLINE", opacity: 0.5 },
    { id: 3, name: "DCC-03: RR-TRANSIT", x: 180, y: 280, lat: "39.665", lng: "-105.205", status: "BUSY", opacity: 0.9 },
  ]);

  const [authStatus, setAuthStatus] = useState<"unauthenticated" | "validating" | "authenticated">("unauthenticated");
  const [authCode, setAuthCode] = useState("");
  const [authLogs, setAuthLogs] = useState<string[]>([]);
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);
  const [operatorId, setOperatorId] = useState("");

  const telemetryEndRef = useRef<HTMLDivElement>(null);

  // Periodically append new telemetry logs and update blips slightly to simulate movement
  useEffect(() => {
    const logInterval = setInterval(() => {
      const time = new Date().toLocaleTimeString([], { hour12: false });
      const randomMsg = TELEMETRY_POOL[Math.floor(Math.random() * TELEMETRY_POOL.length)];
      
      let tag = "LIVE";
      let color = "#00D2FF"; // Cruise Cyan
      if (randomMsg.startsWith("SYS")) {
        tag = "SYS_OK";
        color = "#39FF14"; // City Green
      } else if (randomMsg.startsWith("GATE_ALERT")) {
        tag = "WARN";
        color = "#ef4444"; // Alarm Red
      } else if (randomMsg.startsWith("TX")) {
        tag = "AUTH";
        color = "#ffb000"; // Amber
      }

      setTelemetry((prev) => {
        const nextList = [...prev, { time, tag, msg: randomMsg, color }];
        return nextList.slice(-20); // Keep last 20 logs
      });

      // Jiggle blips coordinate simulation
      setBlips((prev) =>
        prev.map((b) => {
          const shiftX = Math.floor(Math.random() * 5) - 2;
          const shiftY = Math.floor(Math.random() * 5) - 2;
          const newX = Math.max(80, Math.min(320, b.x + shiftX));
          const newY = Math.max(80, Math.min(320, b.y + shiftY));
          
          return {
            ...b,
            x: newX,
            y: newY,
            opacity: Math.random() * 0.5 + 0.5
          };
        })
      );
    }, 3000);

    return () => clearInterval(logInterval);
  }, []);

  // Auto-scroll telemetry log to bottom
  useEffect(() => {
    if (telemetryEndRef.current) {
      telemetryEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [telemetry]);

  const handleKeypadPress = (val: string) => {
    if (authStatus !== "unauthenticated") return;
    if (val === "CLR") {
      setAuthCode("");
    } else if (val === "ENT") {
      if (authCode.length > 0) {
        startAuthValidation();
      }
    } else {
      if (authCode.length < 6) {
        setAuthCode((prev) => prev + val);
      }
    }
  };

  const startAuthValidation = () => {
    setAuthStatus("validating");
    setAuthLogs(["[WAIT] CONNECTING SECURE SATELLITE CORE..."]);
    
    const logs = [
      "[OK] COMPLETED ENCRYPTED HANDSHAKE",
      "[WAIT] DECRYPTING IDENTITY CHIP...",
      "[OK] CRYPTOGRAPHIC SIGNATURE MATCHED",
      "[OK] LEVEL 3 CLEARANCE DETECTED",
      "[OK] ACCESS GRANTED. COMMAND DECK LIVE."
    ];

    logs.forEach((log, index) => {
      setTimeout(() => {
        setAuthLogs((prev) => [...prev, log]);
        if (index === logs.length - 1) {
          setTimeout(() => {
            setAuthStatus("authenticated");
            setOperatorId(`OP-${authCode}-${Math.floor(Math.random() * 900) + 100}`);
            setIsKeypadOpen(false);
          }, 600);
        }
      }, (index + 1) * 600);
    });
  };

  const handleLogout = () => {
    setAuthStatus("unauthenticated");
    setAuthCode("");
    setAuthLogs([]);
    setOperatorId("");
  };

  return (
    <div className="h-screen w-screen bg-[#07080a] text-zinc-100 flex flex-col md:flex-row p-3 gap-3 overflow-hidden select-none font-mono relative">
      
      {/* CRT Scanline layers */}
      <div className="crt-overlay" />
      <div className="crt-flicker" />

      {/* LEFT COLUMN: ACTIVE RADAR & TELEMETRY DECK */}
      <div className="flex-1 flex flex-col gap-3 min-h-0 md:h-full">
        
        {/* Vector Radar Deck */}
        <div className="flex-1 flex flex-col border border-zinc-800 bg-[#0b0c10]/80 p-3 shadow-lg relative min-h-0">
          <div className="flex justify-between items-center text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 mb-2">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
              MASTER_RADAR_DECK [ONLINE]
            </span>
            <span className="text-zinc-600">BEAM_ROTATION: 72rpm</span>
          </div>

          {/* Radar Plot Graphic Area */}
          <div className="flex-1 flex justify-center items-center relative my-2 overflow-hidden border border-zinc-900 bg-black/40">
            
            {/* Compass Heading Labels */}
            <div className="absolute top-2 text-[9px] text-emerald-500 font-bold">000° (NORTH)</div>
            <div className="absolute right-2 text-[9px] text-emerald-500 font-bold">090° (EAST)</div>
            <div className="absolute bottom-2 text-[9px] text-emerald-500 font-bold">180° (SOUTH)</div>
            <div className="absolute left-2 text-[9px] text-emerald-500 font-bold">270° (WEST)</div>

            {/* Radar Coordinates Overlay */}
            <div className="absolute top-2 left-2 text-[9px] text-zinc-600 leading-tight">
              SYS_REF: DCC_GLOBAL_V1<br/>
              SEC_ROT: MULTI-PASS
            </div>

            {/* Actual Vector Radar SVG */}
            <svg className="w-full h-full max-w-[280px] max-h-[280px] md:max-w-[340px] md:max-h-[340px]" viewBox="0 0 400 400">
              <defs>
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#00FF88" stopOpacity="0.08" />
                  <stop offset="100%" stopColor="#00FF88" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Radar Outer Limit Boundary */}
              <circle cx="200" cy="200" r="180" fill="url(#radarGlow)" stroke="#16a34a" strokeWidth="1.5" strokeDasharray="3 3" />
              
              {/* Concentric Calibration Rings */}
              <circle cx="200" cy="200" r="140" fill="none" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.5" />
              <circle cx="200" cy="200" r="100" fill="none" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="6 6" />
              <circle cx="200" cy="200" r="60" fill="none" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.5" />
              <circle cx="200" cy="200" r="20" fill="none" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.3" />

              {/* Crosshair Axes */}
              <line x1="200" y1="10" x2="200" y2="390" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.25" />
              <line x1="10" y1="200" x2="390" y2="200" stroke="#16a34a" strokeWidth="1" strokeOpacity="0.25" />

              {/* Rotating Radar Sweeper Line & Beam */}
              <g style={{ animation: "spin 5s linear infinite", transformOrigin: "200px 200px" }}>
                <line x1="200" y1="200" x2="200" y2="20" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" style={{ filter: "drop-shadow(0 0 3px #39FF14)" }} />
                <path d="M200,200 L200,20 A180,180 0 0,0 72,72 Z" fill="#16a34a" opacity="0.15" />
              </g>

              {/* Radar Blips */}
              {blips.map((blip) => (
                <g key={blip.id} opacity={blip.opacity}>
                  {/* Blip Outer Ring Pulse */}
                  <circle cx={blip.x} cy={blip.y} r="8" fill="none" stroke="#ffb000" strokeWidth="1" className="animate-ping" />
                  {/* Solid Blip Core */}
                  <circle cx={blip.x} cy={blip.y} r="4.5" fill="#ffb000" style={{ filter: "drop-shadow(0 0 2px #ffb000)" }} />
                  
                  {/* Blip Label Overlay */}
                  <text x={blip.x + 8} y={blip.y - 4} fill="#ffb000" fontSize="9" fontWeight="bold">
                    {blip.id === 1 ? "MIA" : blip.id === 2 ? "NOLA" : "RR"}
                  </text>
                  <text x={blip.x + 8} y={blip.y + 6} fill="#71717a" fontSize="8">
                    {blip.lat},{blip.lng}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Live Scrolling Telemetry Log */}
        <div className="h-[140px] md:h-[180px] border border-zinc-800 bg-[#090a0d] p-3 flex flex-col shadow-lg">
          <div className="text-[10px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2 flex justify-between">
            <span>DCC_EDGE_TELEMETRY_LOG</span>
            <span className="text-zinc-600">BUFFER_LIMIT: 20</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 pr-1 font-mono text-[10px] scrollbar-thin">
            {telemetry.map((log, i) => (
              <div key={i} className="flex gap-2 items-start leading-relaxed hover:bg-white/[0.02] px-1 rounded">
                <span className="text-zinc-600">{log.time}</span>
                <span style={{ color: log.color }} className="font-bold flex-shrink-0">
                  [{log.tag}]
                </span>
                <span className="text-zinc-300 truncate">{log.msg}</span>
              </div>
            ))}
            <div ref={telemetryEndRef} />
          </div>

          <div className="border-t border-zinc-950 pt-1.5 mt-1 text-[9px] text-emerald-500 flex items-center gap-1.5 animate-pulse">
            <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
            <span>OPERATOR@DCC_CORE:~$ LISTENING FOR INGRESS FLIGHTS...</span>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: ROUTING MATRIX & AUTH GATEWAY */}
      <div className="w-full md:w-[380px] flex flex-col gap-3 min-h-0 md:h-full">
        
        {/* Department Routing Matrix (Center 40%) */}
        <div className="flex-1 flex flex-col justify-center border border-zinc-800 bg-[#0b0c10]/80 p-4 shadow-lg gap-3 relative">
          <div className="text-[10px] text-zinc-500 border-b border-zinc-900 pb-2 absolute top-3 left-4 right-4">
            ROUTING_DEPARTMENT_MATRIX
          </div>

          <div className="flex flex-col gap-3.5 mt-6">
            
            {/* CRUISE OS Link (Cyan) */}
            <a 
              href="/cruises"
              className="group border border-sky-950 bg-sky-950/10 hover:bg-sky-950/30 p-3.5 transition flex flex-col gap-1 shadow-md border-l-[4px] border-l-[#00D2FF]"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wider text-[#00D2FF] group-hover:scale-[1.01] transition-transform">
                  [ INITIATE: CRUISE OS ]
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-sky-950 text-[#00D2FF] font-bold rounded">
                  PORTGATE
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 group-hover:text-zinc-300">
                Miami, Nassau, Cozumel, Everglades, Canaveral
              </div>
              <div className="text-[8px] text-sky-400/70 border-t border-sky-950 pt-1 mt-1 font-mono">
                TELEMETRY: 5 PORTS CONNECTED | MIA_DENSITY: 84%
              </div>
            </a>

            {/* RESORT OS Link (Pink/Coral) */}
            <a 
              href="/transportation"
              className="group border border-pink-950 bg-pink-950/10 hover:bg-pink-950/30 p-3.5 transition flex flex-col gap-1 shadow-md border-l-[4px] border-l-[#FF5E97]"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wider text-[#FF5E97] group-hover:scale-[1.01] transition-transform">
                  [ INITIATE: RESORT OS ]
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-pink-950 text-[#FF5E97] font-bold rounded">
                  RESORTGATE
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 group-hover:text-zinc-300">
                Argo Cable Car, Somerset logistics, airport shuttles
              </div>
              <div className="text-[8px] text-pink-400/70 border-t border-pink-950 pt-1 mt-1 font-mono">
                LOGISTICS: 2 CORES ONLINE | ARGO_CAPACITY: 79%
              </div>
            </a>

            {/* CITY OS Link (Green) */}
            <a 
              href="/network"
              className="group border border-emerald-950 bg-emerald-950/10 hover:bg-emerald-950/30 p-3.5 transition flex flex-col gap-1 shadow-md border-l-[4px] border-l-[#39FF14]"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wider text-[#39FF14] group-hover:scale-[1.01] transition-transform">
                  [ INITIATE: CITY RADAR ]
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-950 text-[#39FF14] font-bold rounded">
                  CITYOS
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 group-hover:text-zinc-300">
                New Orleans, Denver Red Rocks, Eau Claire shows
              </div>
              <div className="text-[8px] text-emerald-400/70 border-t border-emerald-950 pt-1 mt-1 font-mono">
                GROUND SIGS: 3 TELEMETRY LANES | NOLA_WEATHER: CLEAR
              </div>
            </a>

            {/* SHADOW ECONOMY Link (Amber) */}
            <a 
              href="/operator"
              className="group border border-amber-950 bg-amber-950/10 hover:bg-amber-950/30 p-3.5 transition flex flex-col gap-1 shadow-md border-l-[4px] border-l-[#ffb000]"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm tracking-wider text-[#ffb000] group-hover:scale-[1.01] transition-transform">
                  [ ENTER: SHADOW ECONOMY ]
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-amber-950 text-[#ffb000] font-bold rounded">
                  PRIVATE
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 group-hover:text-zinc-300">
                Secure high-value private shuttle & checkout handoffs
              </div>
              <div className="text-[8px] text-amber-400/70 border-t border-amber-950 pt-1 mt-1 font-mono">
                VELVET ROPE: ENABLED | AUTHORIZED CHANNELS ONLY
              </div>
            </a>

          </div>
        </div>

        {/* Authentication Gateway (Bottom 20%) */}
        <div className="h-[210px] border border-zinc-800 bg-[#090a0d] p-3 flex flex-col justify-between shadow-lg relative">
          
          <div className="text-[10px] text-zinc-500 border-b border-zinc-900 pb-1.5 mb-2">
            OPERATIVE_SECURITY_GATEWAY
          </div>

          {authStatus === "unauthenticated" && !isKeypadOpen && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="flex items-center gap-3 py-1">
                {/* Contributor Avatars */}
                <div className="flex -space-x-1.5">
                  {MOCK_AVATARS.map((av) => (
                    <div 
                      key={av.name} 
                      className="w-7 h-7 rounded-full border border-black flex items-center justify-center text-[9px] font-bold text-white shadow-md"
                      style={{ backgroundColor: av.color }}
                      title={av.name}
                    >
                      {av.initials}
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-zinc-400 leading-tight">
                  Verified contributors active.<br/>Authenticate operative key for telemetry.
                </div>
              </div>

              <button 
                onClick={() => setIsKeypadOpen(true)}
                className="w-full py-2.5 bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-center font-bold text-xs uppercase tracking-wider transition active:bg-zinc-700"
              >
                VALIDATE_IDENTITY_KEY
              </button>
            </div>
          )}

          {/* Inline Keypad/Authentication Modal Overlay */}
          {isKeypadOpen && authStatus === "unauthenticated" && (
            <div className="absolute inset-0 bg-[#07080a] p-3 flex flex-col justify-between z-20">
              <div className="flex justify-between items-center text-[9px] border-b border-zinc-900 pb-1 mb-1">
                <span className="text-zinc-500">ENTER_VERIFICATION_KEY:</span>
                <span className="text-amber-400 font-bold">{authCode.padEnd(6, "_")}</span>
              </div>
              
              {/* Interactive Keypad Grid */}
              <div className="grid grid-cols-4 gap-1.5 flex-1 max-h-[120px] my-1">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "CLR", "ENT"].map((char) => (
                  <button
                    key={char}
                    onClick={() => handleKeypadPress(char)}
                    className={`text-xs py-1.5 font-bold border rounded transition active:scale-95 ${
                      char === "ENT" 
                        ? "bg-emerald-950 text-[#39FF14] border-emerald-800 hover:bg-emerald-900" 
                        : char === "CLR"
                          ? "bg-red-950 text-red-400 border-red-900 hover:bg-red-900"
                          : "bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800"
                    }`}
                  >
                    {char}
                  </button>
                ))}
              </div>

              <button
                onClick={() => { setIsKeypadOpen(false); setAuthCode(""); }}
                className="w-full py-1 border border-zinc-900 text-[8px] uppercase text-zinc-500 hover:text-zinc-300 transition text-center"
              >
                [ ABORT SECURE ENTRY ]
              </button>
            </div>
          )}

          {/* Validating Logs Screen */}
          {authStatus === "validating" && (
            <div className="flex-1 flex flex-col justify-between text-[9px] font-mono py-1">
              <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {authLogs.map((log, i) => (
                  <div key={i} className="text-amber-400">
                    &gt; {log}
                  </div>
                ))}
              </div>
              <div className="h-6 w-full flex items-center justify-center bg-zinc-950 border border-zinc-900 text-amber-500 text-[8px] animate-pulse">
                DECRYPTING SECURITY ROTORS...
              </div>
            </div>
          )}

          {/* Authenticated State Operator Card */}
          {authStatus === "authenticated" && (
            <div className="flex-1 flex flex-col justify-between">
              <div className="border border-emerald-900/60 bg-emerald-950/10 p-2.5 rounded flex flex-col gap-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-[#39FF14]">
                  <span>OPERATOR CONNECTED</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <div className="text-[9px] text-zinc-400 leading-tight mt-1">
                  ID: <span className="text-zinc-200 font-bold">{operatorId}</span><br/>
                  CLEARANCE: <span className="text-zinc-200 font-bold">LEVEL_3 (ADMIN)</span><br/>
                  MATRIX_SYNC: <span className="text-zinc-200 font-bold">ACTIVE</span>
                </div>
              </div>

              <button 
                onClick={handleLogout}
                className="w-full py-1.5 border border-emerald-900 text-[#39FF14] hover:bg-emerald-950/30 text-center font-bold text-[10px] uppercase tracking-wider transition"
              >
                LOGOUT_OPERATIVE
              </button>
            </div>
          )}

          <div className="text-[8px] text-zinc-600 text-center mt-1 border-t border-zinc-900 pt-1.5 leading-normal">
            DCC CRYPTO SHIELD ARMED // TRANSIT RECORD ENCRYPTION ENABLED
          </div>
        </div>

      </div>

      {/* Retro scanline & container CSS */}
      <style jsx global>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .crt-overlay {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.22) 50%),
                      linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.04));
          background-size: 100% 3.5px, 6px 100%;
          pointer-events: none;
          z-index: 50;
          opacity: 0.4;
        }

        .crt-flicker {
          animation: flicker 0.18s infinite;
          pointer-events: none;
          position: absolute;
          inset: 0;
          background: rgba(18, 16, 16, 0.03);
          z-index: 45;
        }

        @keyframes flicker {
          0% { opacity: 0.96; }
          50% { opacity: 0.98; }
          100% { opacity: 0.96; }
        }

        /* Scrollbar styles */
        .scrollbar-thin::-webkit-scrollbar {
          width: 3px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.2);
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 9px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}
