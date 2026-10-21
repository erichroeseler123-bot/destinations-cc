import type { Metadata } from "next";
import TourPlanningKit from "@/app/components/tour-tools/TourPlanningKit";
import { TOOLKIT_CONFIG } from "@/lib/toolkitConfig";

export const metadata: Metadata = { title: "Swamp Tour Planning Tools, Group Fit & Return Timing", description: "Plan your New Orleans swamp tour day, compare boats, check group requirements, save and share timing, and choose a weather backup.", alternates: { canonical: "https://welcometotheswamp.com/tools" } };
export default function ToolsPage() { return <main><div style={{ maxWidth: 1084, margin: "32px auto", padding: "0 18px" }}><p className="eyebrow">Welcome to the Swamp toolkit</p><h1>Get your whole tour day figured out</h1><p>Departure finder, waitlist requests, boat comparisons, group checks, weather resources, and a timing plan you can save and share.</p></div><TourPlanningKit config={TOOLKIT_CONFIG} /></main>; }
