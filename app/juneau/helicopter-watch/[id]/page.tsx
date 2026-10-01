import type { Metadata } from "next";
import HelicopterWatchControls from "@/components/HelicopterWatchControls";
export const metadata: Metadata = { title: "Manage Helicopter Watch", robots: { index: false, follow: false }, referrer: "no-referrer" };
export default async function Page({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ token?: string }> }) { const [{ id }, { token }] = await Promise.all([params, searchParams]); return <main style={{ maxWidth: 850, margin: "auto", padding: 24 }}><h1>Manage this availability request</h1><HelicopterWatchControls id={id} token={token || ""}/></main>; }
