import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { GoogleGenerativeAI } from "@google/generative-ai";
import haversine from 'haversine';

const CSV_FILE_PATH = path.join(process.cwd(), 'ports.csv');
const JSON_OUTPUT_PATH = path.join(process.cwd(), 'data/ports.json');

const UNSPLASH_ACCESS_KEY = 'yNJqvWSoqQJch6t4f4LLJZfXLBcJ1ZFqS4duJDnrM8';
const VIATOR_API_KEY = '406d9dde-ffa7-4b8c-9031-c707010c716b';
const GEMINI_API_KEY = 'AIzaSyDiiv1Pcalig8SYYS-NMNo-mhSZjE8mHfw';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function fetchImage(query: string) {
  try {
    const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1`, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` }
    });
    const data = await res.json();
    return data.results[0]?.urls?.regular || 'https://images.unsplash.com/photo-1548574505-5e239809ee19';
  } catch { return 'https://images.unsplash.com/photo-1548574505-5e239809ee19'; }
}

async function automateTourData(portName: string) {
  try {
    // CLEANING: "Port of Miami" becomes "Miami" for better search
    const cleanName = portName.replace('Port of ', '');
    
    let searchRes = await fetch(`https://api.viator.com/partner/products/search`, {
      method: 'POST',
      headers: { 'exp-api-key': VIATOR_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ searchTerm: `${cleanName} shore excursions`, count: 1 })
    });
    let searchData = await searchRes.json();

    // RETRY: If no shore excursions, try general tours
    if (!searchData.products || searchData.products.length === 0) {
      searchRes = await fetch(`https://api.viator.com/partner/products/search`, {
        method: 'POST',
        headers: { 'exp-api-key': VIATOR_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: `${cleanName} tours`, count: 1 })
      });
      searchData = await searchRes.json();
    }

    const product = searchData.products?.[0];
    if (!product) return { viator_id: null, reviewSummary: null, price: null };

    const reviewRes = await fetch(`https://api.viator.com/partner/reviews/list?productCode=${product.productCode}&count=5`, {
      headers: { 'exp-api-key': VIATOR_API_KEY }
    });
    const reviewData = await reviewRes.json();
    const reviewText = reviewData.reviews?.map((r: any) => r.text).join(" ") || "Top rated experience.";

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(`Summarize these reviews for ${cleanName} in 2 sentences starting with 'Travelers generally say...': ${reviewText}`);

    return {
      viator_id: product.productCode,
      reviewSummary: result.response.text(),
      price: product.pricing?.lowRate || 0
    };
  } catch { return { viator_id: null, reviewSummary: null, price: null }; }
}

async function runIngestion() {
  console.log('🚀 RUNNING ROBUST PIPELINE...');
  const csvFile = fs.readFileSync(CSV_FILE_PATH, 'utf8');
  Papa.parse(csvFile, {
    header: true, skipEmptyLines: true, dynamicTyping: true,
    complete: async (results) => {
      const rawPorts = results.data as any[];
      const enrichedData = [];
      for (const port of rawPorts) {
        console.log(`📦 Processing: ${port.port_name}...`);
        const imageUrl = await fetchImage(`${port.port_name} travel`);
        const tourData = await automateTourData(port.port_name);
        const nearby = rawPorts.filter(p => p.slug !== port.slug).map(p => ({
          name: p.port_name, slug: p.slug, dist: haversine({ latitude: port.lat, longitude: port.lng }, { latitude: p.lat, longitude: p.lng }, { unit: 'km' })
        })).sort((a, b) => a.dist - b.dist).slice(0, 4);
        enrichedData.push({ ...port, imageUrl, ...tourData, nearby });
        await new Promise(r => setTimeout(r, 1000));
      }
      fs.writeFileSync(JSON_OUTPUT_PATH, JSON.stringify(enrichedData, null, 2));
      console.log(`✅ Success! Data saved to: ${JSON_OUTPUT_PATH}`);
    }
  });
}
runIngestion();
