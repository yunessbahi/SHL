"use client";
import { useCallback, useEffect, useState } from "react";
import { authFetch } from "@/lib/api";

export type Country = {
  id: string;
  name: string;
  iso2?: string;
  iso3?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type CountryOption = {
  label: string;
  value: string;
};

// Comprehensive fallback list covering major global markets
const FALLBACK_COUNTRIES: CountryOption[] = [
  // Americas
  { label: "United States", value: "US" },
  { label: "Canada", value: "CA" },
  { label: "Mexico", value: "MX" },
  { label: "Brazil", value: "BR" },
  { label: "Argentina", value: "AR" },
  { label: "Chile", value: "CL" },
  { label: "Colombia", value: "CO" },
  { label: "Peru", value: "PE" },
  { label: "Venezuela", value: "VE" },
  { label: "Ecuador", value: "EC" },

  // Europe
  { label: "United Kingdom", value: "GB" },
  { label: "Germany", value: "DE" },
  { label: "France", value: "FR" },
  { label: "Italy", value: "IT" },
  { label: "Spain", value: "ES" },
  { label: "Netherlands", value: "NL" },
  { label: "Belgium", value: "BE" },
  { label: "Switzerland", value: "CH" },
  { label: "Austria", value: "AT" },
  { label: "Sweden", value: "SE" },
  { label: "Norway", value: "NO" },
  { label: "Denmark", value: "DK" },
  { label: "Finland", value: "FI" },
  { label: "Poland", value: "PL" },
  { label: "Czech Republic", value: "CZ" },
  { label: "Portugal", value: "PT" },
  { label: "Greece", value: "GR" },
  { label: "Ireland", value: "IE" },
  { label: "Luxembourg", value: "LU" },
  { label: "Estonia", value: "EE" },
  { label: "Latvia", value: "LV" },
  { label: "Lithuania", value: "LT" },

  // Asia-Pacific
  { label: "China", value: "CN" },
  { label: "Japan", value: "JP" },
  { label: "South Korea", value: "KR" },
  { label: "India", value: "IN" },
  { label: "Indonesia", value: "ID" },
  { label: "Philippines", value: "PH" },
  { label: "Thailand", value: "TH" },
  { label: "Vietnam", value: "VN" },
  { label: "Malaysia", value: "MY" },
  { label: "Singapore", value: "SG" },
  { label: "Hong Kong", value: "HK" },
  { label: "Taiwan", value: "TW" },
  { label: "Australia", value: "AU" },
  { label: "New Zealand", value: "NZ" },
  { label: "Pakistan", value: "PK" },
  { label: "Bangladesh", value: "BD" },
  { label: "Sri Lanka", value: "LK" },
  { label: "Nepal", value: "NP" },
  { label: "Myanmar", value: "MM" },
  { label: "Cambodia", value: "KH" },
  { label: "Laos", value: "LA" },
  { label: "Mongolia", value: "MN" },

  // Middle East & Africa
  { label: "Turkey", value: "TR" },
  { label: "Israel", value: "IL" },
  { label: "Saudi Arabia", value: "SA" },
  { label: "United Arab Emirates", value: "AE" },
  { label: "Qatar", value: "QA" },
  { label: "Kuwait", value: "KW" },
  { label: "Bahrain", value: "BH" },
  { label: "Oman", value: "OM" },
  { label: "Egypt", value: "EG" },
  { label: "South Africa", value: "ZA" },
  { label: "Nigeria", value: "NG" },
  { label: "Morocco", value: "MA" },
  { label: "Algeria", value: "DZ" },
  { label: "Tunisia", value: "TN" },
  { label: "Kenya", value: "KE" },
  { label: "Ghana", value: "GH" },
  { label: "Ethiopia", value: "ET" },

  // Rest of World
  { label: "Russia", value: "RU" },
  { label: "Ukraine", value: "UA" },
  { label: "Kazakhstan", value: "KZ" },
  { label: "Belarus", value: "BY" },
  { label: "Romania", value: "RO" },
  { label: "Bulgaria", value: "BG" },
  { label: "Hungary", value: "HU" },
  { label: "Croatia", value: "HR" },
  { label: "Slovakia", value: "SK" },
  { label: "Slovenia", value: "SI" },
  { label: "Serbia", value: "RS" },
  { label: "Bosnia and Herzegovina", value: "BA" },
  { label: "Montenegro", value: "ME" },
  { label: "North Macedonia", value: "MK" },
  { label: "Albania", value: "AL" },
  { label: "Iceland", value: "IS" },
  { label: "Malta", value: "MT" },
  { label: "Cyprus", value: "CY" },
  { label: "Armenia", value: "AM" },
  { label: "Georgia", value: "GE" },
  { label: "Azerbaijan", value: "AZ" },
  { label: "Moldova", value: "MD" },
];

interface TimeoutPromise<T> extends Promise<T> {
  cancel: () => void;
}

function withTimeout<T>(promise: Promise<T>, ms: number): TimeoutPromise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${ms}ms`));
    }, ms);
  });

  const combinedPromise = Promise.race([
    promise,
    timeoutPromise,
  ]) as TimeoutPromise<T>;

  combinedPromise.cancel = () => {
    clearTimeout(timeoutId);
  };

  return combinedPromise;
}

export function useCountries() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [countryOptions, setCountryOptions] = useState<CountryOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [lastSuccessfulLoad, setLastSuccessfulLoad] = useState<Date | null>(
    null,
  );

  const MAX_RETRIES = 3;
  const RETRY_DELAY = 1000; // 1 second
  const API_TIMEOUT = 8000; // 8 seconds

  const load = useCallback(
    async (attempt = 1, forceRefresh = false) => {
      // Only show loading state if not already loaded or forcing refresh
      if (!countries.length || forceRefresh) {
        setLoading(true);
      }
      setError(null);

      try {
        console.log(`Loading countries (attempt ${attempt}/${MAX_RETRIES})...`);

        // Create timeout promise for main API call
        const timeoutPromise = withTimeout(
          authFetch("/api/countries/rules"),
          API_TIMEOUT,
        ) as TimeoutPromise<Response>;

        const res = await timeoutPromise;

        if (!res.ok) {
          throw new Error(`API returned ${res.status}: ${await res.text()}`);
        }

        const data = (await res.json()) as CountryOption[];

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("Received empty country data from API");
        }

        console.log(`Successfully loaded ${data.length} countries from API`);

        // Store the options directly for RuleTabs
        setCountryOptions(data);

        // Also get full country data for potential future use
        try {
          const fullRes = await authFetch("/api/countries/");
          if (fullRes.ok) {
            const fullData = (await fullRes.json()) as Country[];
            setCountries(fullData);
          }
        } catch (fullErr) {
          console.warn("Failed to load full country data:", fullErr);
          // Don't fail the whole request for this
        }

        setIsUsingFallback(false);
        setRetryCount(0);
        setLastSuccessfulLoad(new Date());
      } catch (e: any) {
        const errorMessage = e?.message || "Failed to load countries";
        console.error(`Failed to load countries (attempt ${attempt}):`, e);

        setError(errorMessage);

        // Retry logic
        if (attempt < MAX_RETRIES) {
          console.log(`Retrying in ${RETRY_DELAY}ms...`);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          return load(attempt + 1, forceRefresh);
        }

        // All retries exhausted, use fallback
        console.log(
          "All retry attempts exhausted, falling back to hardcoded countries",
        );
        setIsUsingFallback(true);
        setCountryOptions(FALLBACK_COUNTRIES);
        setRetryCount(attempt - 1);

        // Try to get full country data from fallback (limited data available)
        const fallbackCountries: Country[] = FALLBACK_COUNTRIES.map(
          (option) => ({
            id: option.value,
            name: option.label,
            iso2: option.value,
            is_active: true,
          }),
        );
        setCountries(fallbackCountries);
      } finally {
        setLoading(false);
      }
    },
    [countries.length],
  );

  const reload = useCallback(
    (forceRefresh = false) => {
      console.log("Reloading countries...");
      setRetryCount(0);
      load(1, forceRefresh);
    },
    [load],
  );

  // Auto-reload when component mounts and periodically refresh cache
  useEffect(() => {
    load();

    // Set up periodic refresh every 10 minutes to keep cache fresh
    const refreshInterval = setInterval(
      () => {
        if (!loading && !isUsingFallback) {
          console.log("Periodic refresh of countries data...");
          load(1, true);
        }
      },
      10 * 60 * 1000,
    ); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, [load, loading, isUsingFallback]);

  return {
    countries,
    countryOptions,
    loading,
    error,
    isUsingFallback,
    retryCount,
    lastSuccessfulLoad,
    reload: () => reload(true),
    forceRefresh: () => reload(true),
  };
}
