import { Spinner } from "@/components/ui/spinner";
import { AnalyticsFilters, analyticsAPI } from "@/lib/analytics-api";
import React from "react";
import { WorldMap } from "react-svg-worldmap";

interface MapCompactProps {
  data?: Array<{ country: string; value: string | number }>;
  size?: "responsive" | "sm" | "md" | "lg" | "xl" | "xxl" | number;
  period?: string;
  filters?: AnalyticsFilters;
  refreshTrigger?: number;
}

function MapCompact({
  data,
  size = "responsive",
  period = "30d",
  filters,
  refreshTrigger,
}: MapCompactProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [mapData, setMapData] = React.useState<
    Array<{ country: string; value: string | number }>
  >([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const checkTheme = () => {
      const theme = document.documentElement.classList.contains("dark")
        ? "dark"
        : "light";
      setIsDark(theme === "dark");
    };

    checkTheme();

    // Listen for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  // Fetch data if not provided via props
  const fetchData = async () => {
    if (data) return; // Use provided data if available

    try {
      setLoading(true);
      const result = await analyticsAPI.getGlobalTopCountries(
        "country",
        period,
        1000, // Get all countries (high limit)
      );
      const formatted = result.map((item) => ({
        country: item.location,
        value: item.click_count,
      }));
      setMapData(formatted);
    } catch (err) {
      console.error("Map data fetch error:", err);
      setMapData([]);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (data) {
      setMapData(data);
      setLoading(false);
    } else {
      fetchData();
    }
  }, [data, period, refreshTrigger]);

  const defaultData = [
    {
      country: "DE",
      value: "121224",
    },
    {
      country: "EP",
      value: "46667",
    },
    {
      country: "US",
      value: "37193",
    },
    {
      country: "WO",
      value: "33117",
    },
    {
      country: "CN",
      value: "16899",
    },
    {
      country: "AT",
      value: "12168",
    },
    {
      country: "NI",
      value: "1",
    },
    {
      country: "PH",
      value: "1",
    },
  ];

  // Calculate the maximum clicks value from the data for dynamic scaling
  const maxClicks =
    mapData.length > 0
      ? Math.max(...mapData.map((item) => Number(item.value) || 0))
      : 0;
  console.log("max: ", maxClicks);
  // const stylingFunction = (context: any) => {
  //   const opacityLevel =
  //     0.1 +
  //     (1.5 * (context.countryValue - context.minValue)) /
  //       (context.maxValue - context.minValue);
  //   console.log(context);
  //   return {
  //     fill: context.color,
  //     fillOpacity: opacityLevel,
  //     stroke: "white",
  //     strokeWidth: 1,
  //     strokeOpacity: 0.2,
  //     cursor: "pointer"
  //   };
  // };

  /*const stylingFunction = (context) => ({
        fill: context.countryValue > 0 ? "#03ff8e" : "#2a2b3a",
        fillOpacity: context.countryValue > 0 ? 0.8 : 0.3,
    });*/

  const stylingFunction = (context: any) => {
    context.maxValue = maxClicks;
    let opacityLevel;

    if (context.maxValue === context.minValue) {
      // When all values are the same (e.g., single country or all countries have same clicks)
      opacityLevel = context.countryValue > 0 ? 0.8 : 0.1; // Full opacity only for countries with data
    } else {
      opacityLevel =
        0.3 +
        (1.5 * (context.countryValue - context.minValue)) /
          (context.maxValue - context.minValue);
    }

    return {
      fill: context.color,
      fillOpacity: isNaN(opacityLevel) ? 0.1 : opacityLevel,
      stroke: "white",
      strokeWidth: 0.02,
      strokeOpacity: 0.02,
      cursor: "pointer",
    };
  };

  return (
    <div className={` ${loading ? "flex items-center justify-center" : ""}`}>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <Spinner className="size-4" />
          <span className="ml-2 text-sm">Loading</span>
        </div>
      ) : (
        <>
          {/* Map section - 3 columns on large screens */}

          {/* Responsive SVG wrapper */}
          <div className="w-full h-full overflow-hidden">
            <WorldMap
              richInteraction={true}
              backgroundColor=""
              borderColor="transparent"
              strokeOpacity={0.02}
              color={isDark ? "#fff" : "#000"}
              tooltipBgColor="#31323f"
              title=""
              valueSuffix="visit"
              valuePrefix=":"
              size={size}
              data={mapData}
              styleFunction={stylingFunction}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default MapCompact;
