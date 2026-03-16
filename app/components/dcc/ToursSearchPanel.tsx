import { getViatorCapabilities } from "@/lib/viator/access";
import { getViatorDestinationOptions } from "@/lib/viator/destinations";
import { getViatorFrontendCategoryTags } from "@/lib/viator/tags";

type ToursSearchPanelProps = {
  title: string;
  description: string;
  defaultCity?: string;
  defaultQuery?: string;
  defaultSort?: string;
  defaultCurrency?: string;
  defaultMinRating?: string;
  defaultMaxPrice?: string;
  defaultMaxDuration?: string;
  defaultTagId?: string;
  defaultRecommendedOnly?: boolean;
  defaultStartDate?: string;
  defaultEndDate?: string;
  sourceSection?: string;
  fixedCity?: string;
  suggestions?: string[];
};

const CITY_NAMES = getViatorDestinationOptions().map((destination) => destination.cityName);
const CATEGORY_OPTIONS = getViatorFrontendCategoryTags()
  .filter((tag) => Boolean(tag.query))
  .slice(0, 10);
const FILTER_TAG_OPTIONS = getViatorFrontendCategoryTags().slice(0, 16);
const VIATOR_CAPABILITIES = getViatorCapabilities();

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  { value: "rating", label: "Best rating" },
  { value: "reviews", label: "Most reviewed" },
  { value: "duration-short", label: "Shortest duration" },
];

const CURRENCY_OPTIONS = [
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "AUD", label: "AUD" },
  { value: "CAD", label: "CAD" },
  { value: "JPY", label: "JPY" },
];

export default function ToursSearchPanel({
  title,
  description,
  defaultCity = "",
  defaultQuery = "",
  defaultSort = "recommended",
  defaultCurrency = "USD",
  defaultMinRating = "",
  defaultMaxPrice = "",
  defaultMaxDuration = "",
  defaultTagId = "",
  defaultRecommendedOnly = false,
  defaultStartDate = "",
  defaultEndDate = "",
  sourceSection,
  fixedCity,
  suggestions = [],
}: ToursSearchPanelProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(255,176,124,0.14),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(61,243,255,0.1),transparent_24%),linear-gradient(180deg,rgba(18,18,22,0.92),rgba(9,9,11,0.96))] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)]">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.22em] text-[#f5c66c]">Things to do search</p>
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        <p className="max-w-3xl text-sm leading-7 text-white/72">{description}</p>
      </div>

      <form action="/tours" method="get" className="mt-6 grid gap-4 xl:grid-cols-12 xl:items-end">
        {fixedCity ? <input type="hidden" name="city" value={fixedCity} /> : null}
        {sourceSection ? <input type="hidden" name="source_section" value={sourceSection} /> : null}

        {!fixedCity ? (
          <label className="grid gap-2 xl:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Destination</span>
            <input
              type="text"
              name="city"
              list="dcc-tour-destinations"
              defaultValue={defaultCity}
              placeholder="Search by city"
              className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/34"
            />
          </label>
        ) : (
          <div className="grid gap-2 xl:col-span-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Destination</span>
            <div className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm font-semibold text-white">
              {defaultCity}
            </div>
          </div>
        )}

        <label className="grid gap-2 xl:col-span-3">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Activity or category</span>
          <input
            type="text"
            name="q"
            defaultValue={defaultQuery}
            placeholder="Food tours, ghost tours, day trips, sightseeing"
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white placeholder:text-white/34"
          />
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Sort</span>
          <select
            name="sort"
            defaultValue={defaultSort}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Currency</span>
          <select
            name="currency"
            defaultValue={defaultCurrency}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Start date</span>
          <input
            type="date"
            name="startDate"
            defaultValue={defaultStartDate}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          />
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">End date</span>
          <input
            type="date"
            name="endDate"
            defaultValue={defaultEndDate}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          />
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Min rating</span>
          <select
            name="minRating"
            defaultValue={defaultMinRating}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            <option value="">Any</option>
            <option value="4">4.0+</option>
            <option value="4.5">4.5+</option>
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Max price</span>
          <select
            name="maxPrice"
            defaultValue={defaultMaxPrice}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            <option value="">Any</option>
            <option value="50">Under $50</option>
            <option value="100">Under $100</option>
            <option value="200">Under $200</option>
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-1">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Max duration</span>
          <select
            name="maxDuration"
            defaultValue={defaultMaxDuration}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            <option value="">Any</option>
            <option value="120">Up to 2 hours</option>
            <option value="240">Up to 4 hours</option>
            <option value="480">Up to 8 hours</option>
          </select>
        </label>

        <label className="grid gap-2 xl:col-span-2">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-white/52">Viator-safe category</span>
          <select
            name="tag"
            defaultValue={defaultTagId}
            className="rounded-2xl border border-white/12 bg-black/25 px-4 py-3 text-sm text-white"
          >
            <option value="">Any approved category</option>
            {FILTER_TAG_OPTIONS.map((tag) => (
              <option key={tag.tagId} value={tag.tagId}>
                {tag.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-2xl border border-white/12 bg-black/25 px-4 py-3 xl:col-span-2">
          <input
            type="checkbox"
            name="recommended"
            value="1"
            defaultChecked={defaultRecommendedOnly}
            className="h-4 w-4 rounded border-white/20 bg-transparent"
          />
          <span className="text-sm text-white">Recommended by DCC</span>
        </label>

        <button
          type="submit"
          className="rounded-2xl bg-[#f5c66c] px-5 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#120f0b] transition hover:bg-[#ffd989] xl:col-span-2"
        >
          Update search
        </button>
      </form>

      {suggestions.length > 0 ? (
        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.slice(0, 6).map((query) => (
            <button
              key={query}
              type="submit"
              formAction="/tours"
              formMethod="get"
              name="q"
              value={query}
              className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-white/72 transition hover:border-[#f5c66c]/30 hover:bg-[#f5c66c]/10 hover:text-white"
            >
              {query}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((tag) => (
          <button
            key={tag.tagId}
            type="submit"
            formAction="/tours"
            formMethod="get"
            name="q"
            value={tag.query}
            className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] text-cyan-100 transition hover:bg-cyan-500/20"
          >
            {tag.label}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-white/52">
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
          Access tier: {VIATOR_CAPABILITIES.accessTier.replace(/_/g, " ")}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
          Search {VIATOR_CAPABILITIES.canUseSearch ? "enabled" : "disabled"}
        </span>
        <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1.5">
          {VIATOR_CAPABILITIES.shouldUseIngestionModel ? "Ingestion-ready" : "Search-first"}
        </span>
      </div>

      {!fixedCity ? (
        <datalist id="dcc-tour-destinations">
          {CITY_NAMES.map((cityName) => (
            <option key={cityName} value={cityName} />
          ))}
        </datalist>
      ) : null}
    </section>
  );
}
