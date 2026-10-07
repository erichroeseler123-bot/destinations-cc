async function testUrls() {
  const base = "https://juneauflightdeck-gwn7c0vpw-erichroeseler123-bots-projects.vercel.app";
  const urls = [
    "/temsco-vs-coastal-vs-northstar-juneau",
    "/temsco-vs-northstar-juneau",
    "/temsco-vs-coastal-juneau",
    "/juneau-dogsled-helicopter-tours",
    "/llms-full.txt",
    "/api/viator/products"
  ];
  for (const u of urls) {
    const res = await fetch(base + u);
    const text = await res.text();
    console.log(`${u}: status=${res.status}, length=${text.length}`);
    if (u === "/llms-full.txt") {
      console.log("  llms-full has Walkabout:", text.includes("Helicopter Glacier Walkabout"));
      console.log("  llms-full has Coastal Dog Sled:", text.includes("Dog Sled Tour on Herbert Glacier"));
      console.log("  llms-full has Wings Airways note:", text.includes("Wings Airways"));
    }
    if (u === "/temsco-vs-coastal-vs-northstar-juneau") {
      console.log("  3-op has $429 (Coastal landing):", text.includes("$429"));
      console.log("  3-op has $499 (NorthStar walkabout):", text.includes("$499"));
      console.log("  3-op has $709 (Coastal dogsled):", text.includes("$709"));
      console.log("  3-op has Wings Airways note:", text.includes("Wings Airways"));
      console.log("  3-op mentions all 3 offer dog sledding:", text.includes("all three Juneau helicopter operators offer glacier dog sledding"));
    }
    if (u === "/temsco-vs-coastal-juneau") {
      console.log("  temsco-vs-coastal has $429:", text.includes("$429"));
      console.log("  temsco-vs-coastal has $709:", text.includes("$709"));
      console.log("  temsco-vs-coastal has Wings Airways note:", text.includes("Wings Airways"));
    }
    if (u === "/temsco-vs-northstar-juneau") {
      console.log("  temsco-vs-northstar has Walkabout ($499):", text.includes("$499"));
      console.log("  temsco-vs-northstar has Trek ($549):", text.includes("$549"));
      console.log("  temsco-vs-northstar has Dogsled ($739):", text.includes("$739"));
    }
  }
}
testUrls();
