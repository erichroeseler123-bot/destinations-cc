"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DEFAULT_FALLBACK_RESPONSE } from "./catalog";
import type {
  ViatorJuneauProduct,
  ViatorJuneauProductsResponse,
  ViatorProductReviewsResponse,
  UseViatorProductsOptions,
} from "./types";

/**
 * Builds a booking URL that strictly preserves all existing API tracking
 * parameters (PID, MCID, medium, campaign) while appending date and traveler preferences.
 */
export function buildViatorBookingUrlWithPreferences(
  baseHref: string,
  date?: string | null,
  passengerCount?: number
): string {
  try {
    const url = new URL(baseHref);
    if (date) {
      url.searchParams.set("startDate", date);
    }
    if (passengerCount && passengerCount > 0) {
      url.searchParams.set("numTravelers", String(passengerCount));
    }
    return url.toString();
  } catch {
    return baseHref;
  }
}

/**
 * Direct client fetcher to retrieve Viator Juneau helicopter products
 * via the local serverless bridge.
 */
export async function fetchViatorJuneauProducts(options?: {
  date?: string | null;
  passengerCount?: number;
  tourType?: string;
  signal?: AbortSignal;
}): Promise<ViatorJuneauProductsResponse> {
  const params = new URLSearchParams();
  if (options?.date) params.set("date", options.date);
  if (options?.passengerCount) params.set("pax", String(options.passengerCount));
  if (options?.tourType && options.tourType !== "all") params.set("tourType", options.tourType);

  const qs = params.toString();
  const url = `/api/viator/products${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal: options?.signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to load Viator Juneau products: HTTP ${res.status}`);
  }

  return (await res.json()) as ViatorJuneauProductsResponse;
}

/**
 * Fetches protected traveler reviews and photos from the robot-blocked endpoint.
 * This ensures reviews and photos stay out of static page HTML.
 */
export async function fetchViatorProductReviews(
  productCode: string,
  signal?: AbortSignal
): Promise<ViatorProductReviewsResponse> {
  const res = await fetch(`/api/viator/reviews/${encodeURIComponent(productCode)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!res.ok) {
    throw new Error(`Failed to load reviews for ${productCode}: HTTP ${res.status}`);
  }

  return (await res.json()) as ViatorProductReviewsResponse;
}

export interface UseViatorJuneauProductsReturn {
  products: ViatorJuneauProduct[];
  loading: boolean;
  isSettled: boolean;
  error: Error | null;
  selectedDate: string | null;
  passengerCount: number;
  isLive: boolean;
  status: ViatorJuneauProductsResponse["status"];
  snapshotTimestamp?: string;
  attribution: ViatorJuneauProductsResponse["attribution"] | null;
  signals?: ViatorJuneauProductsResponse["signals"];
  browseHref: string;
  waitlistHref: string;
  refetch: () => Promise<void>;
}

/**
 * React hook for consuming Juneau helicopter products from the Viator Partner API.
 */
export function useViatorJuneauProducts({
  date = null,
  passengerCount = 2,
  tourType = "all",
  initialData = null,
  autoFetch = true,
}: UseViatorProductsOptions = {}): UseViatorJuneauProductsReturn {
  const baseData = initialData || DEFAULT_FALLBACK_RESPONSE;
  const filterKey = `${date || ""}|${passengerCount}|${tourType || "all"}`;
  const initialProducts =
    tourType && tourType !== "all"
      ? baseData.products.filter((p) => p.tourType === tourType)
      : baseData.products;

  const [products, setProducts] = useState<ViatorJuneauProduct[]>(initialProducts);
  const [loadingState, setLoadingState] = useState<boolean>(autoFetch);
  const [resolvedFilterKey, setResolvedFilterKey] = useState<string | null>(
    autoFetch ? null : filterKey
  );
  const [errorFilterKey, setErrorFilterKey] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLive, setIsLive] = useState<boolean>(baseData.isLive ?? false);
  const [status, setStatus] = useState<ViatorJuneauProductsResponse["status"]>(
    baseData.status ?? "operator_profiles"
  );
  const [snapshotTimestamp, setSnapshotTimestamp] = useState<string | undefined>(
    baseData.snapshotTimestamp
  );
  const [attribution, setAttribution] = useState<ViatorJuneauProductsResponse["attribution"] | null>(
    baseData.attribution || null
  );
  const [signals, setSignals] = useState<ViatorJuneauProductsResponse["signals"]>(
    baseData.signals
  );
  const [browseHref, setBrowseHref] = useState<string>(
    baseData.browseHref ||
      "https://www.viator.com/Juneau-tourism/d941-r8418047970-s323605581?pid=P00058396&mcid=42383&medium=api"
  );
  const [waitlistHref, setWaitlistHref] = useState<string>(
    baseData.waitlistHref || "/helicopter-waitlist"
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const loadData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingState(true);
    setError(null);
    setErrorFilterKey(null);

    try {
      const response = await fetchViatorJuneauProducts({
        date,
        passengerCount,
        tourType,
        signal: controller.signal,
      });

      if (controller.signal.aborted) {
        return;
      }

      setProducts(response.products);
      setIsLive(response.isLive);
      setStatus(response.status);
      setSnapshotTimestamp(response.snapshotTimestamp);
      setAttribution(response.attribution);
      setSignals(response.signals);
      setBrowseHref(response.browseHref);
      if (response.waitlistHref) setWaitlistHref(response.waitlistHref);
      setResolvedFilterKey(filterKey);
    } catch (err: any) {
      if (err.name !== "AbortError" && !controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
        setErrorFilterKey(filterKey);
        setResolvedFilterKey(null);
      }
    } finally {
      if (abortControllerRef.current === controller) {
        setLoadingState(false);
      }
    }
  }, [date, passengerCount, tourType, filterKey]);

  useEffect(() => {
    if (autoFetch) {
      loadData();
    }
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [loadData, autoFetch]);

  const activeError = errorFilterKey === filterKey ? error : null;
  const loading =
    loadingState ||
    (autoFetch && resolvedFilterKey !== filterKey && errorFilterKey !== filterKey);
  const isSettled = !loading && !activeError && resolvedFilterKey === filterKey;

  return {
    products,
    loading,
    isSettled,
    error: activeError,
    selectedDate: date,
    passengerCount,
    isLive,
    status,
    snapshotTimestamp,
    attribution,
    signals,
    browseHref,
    waitlistHref,
    refetch: loadData,
  };
}
