import React from "react";
import { WorldMap } from "react-svg-worldmap";

function MapCompact() {
  const [isDark, setIsDark] = React.useState(false);

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

  const data = [
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
      country: "JP",
      value: "10993",
    },
    {
      country: "FR",
      value: "8096",
    },
    {
      country: "GB",
      value: "7355",
    },
    {
      country: "ES",
      value: "6264",
    },
    {
      country: "CA",
      value: "5470",
    },
    {
      country: "CH",
      value: "5082",
    },
    {
      country: "IT",
      value: "4087",
    },
    {
      country: "BR",
      value: "3668",
    },
    {
      country: "SE",
      value: "3555",
    },
    {
      country: "AU",
      value: "3368",
    },
    {
      country: "DK",
      value: "3317",
    },
    {
      country: "KR",
      value: "2822",
    },
    {
      country: "RU",
      value: "2391",
    },
    {
      country: "NL",
      value: "2227",
    },
    {
      country: "BE",
      value: "1912",
    },
    {
      country: "TW",
      value: "1472",
    },
    {
      country: "NO",
      value: "1439",
    },
    {
      country: "ZA",
      value: "1339",
    },
    {
      country: "FI",
      value: "1321",
    },
    {
      country: "PL",
      value: "1075",
    },
    {
      country: "IN",
      value: "877",
    },
    {
      country: "PT",
      value: "720",
    },
    {
      country: "MX",
      value: "607",
    },
    {
      country: "AR",
      value: "592",
    },
    {
      country: "HK",
      value: "536",
    },
    {
      country: "GR",
      value: "421",
    },
    {
      country: "UA",
      value: "409",
    },
    {
      country: "HU",
      value: "397",
    },
    {
      country: "IL",
      value: "323",
    },
    {
      country: "YU",
      value: "314",
    },
    {
      country: "CZ",
      value: "255",
    },
    {
      country: "SU",
      value: "227",
    },
    {
      country: "IE",
      value: "224",
    },
    {
      country: "TR",
      value: "212",
    },
    {
      country: "NZ",
      value: "146",
    },
    {
      country: "LU",
      value: "138",
    },
    {
      country: "CS",
      value: "137",
    },
    {
      country: "CL",
      value: "126",
    },
    {
      country: "SG",
      value: "120",
    },
    {
      country: "DD",
      value: "102",
    },
    {
      country: "SI",
      value: "93",
    },
    {
      country: "ID",
      value: "92",
    },
    {
      country: "PE",
      value: "84",
    },
    {
      country: "SK",
      value: "74",
    },
    {
      country: "HR",
      value: "63",
    },
    {
      country: "MY",
      value: "52",
    },
    {
      country: "EG",
      value: "36",
    },
    {
      country: "BG",
      value: "34",
    },
    {
      country: "EA",
      value: "26",
    },
    {
      country: "RO",
      value: "26",
    },
    {
      country: "MA",
      value: "999993",
    },
    {
      country: "LT",
      value: "15",
    },
    {
      country: "CO",
      value: "14",
    },
    {
      country: "MC",
      value: "13",
    },
    {
      country: "TN",
      value: "12",
    },
    {
      country: "RS",
      value: "11",
    },
    {
      country: "CY",
      value: "6",
    },
    {
      country: "LV",
      value: "6",
    },
    {
      country: "EE",
      value: "4",
    },
    {
      country: "CU",
      value: "3",
    },
    {
      country: "SA",
      value: "3",
    },
    {
      country: "DZ",
      value: "2",
    },
    {
      country: "IS",
      value: "2",
    },
    {
      country: "UY",
      value: "2",
    },
    {
      country: "AP",
      value: "1",
    },
    {
      country: "EC",
      value: "1",
    },
    {
      country: "GE",
      value: "1",
    },
    {
      country: "JO",
      value: "1",
    },
    {
      country: "ME",
      value: "1",
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
    context.maxValue = 121224;
    const opacityLevel =
      0.3 +
      (1.5 * (context.countryValue - context.minValue)) /
        (context.maxValue - context.minValue);
    //console.log(context);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* Map section - 3 columns on large screens */}
      <div className="lg:col-span-3">
        {/* Responsive SVG wrapper */}
        <div className="w-full rounded-lg overflow-hidden">
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
            size="responsive"
            data={data}
            styleFunction={stylingFunction}
          />
        </div>
      </div>

      {/* Sidebar section - 1 column on large screens */}
      <div className="flex flex-col justify-center">
        <h2 className="text-xl font-bold text-white mb-4">Statistics</h2>
        <div className="space-y-4 text-gray-300">
          <div>
            <p className="text-sm text-gray-400">Total Visits</p>
            <p className="text-2xl font-bold text-foreground">1,500</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Unique Visits</p>
            <p className="text-2xl font-bold text-foreground">1,250</p>
          </div>
          <div>
            <p className="text-sm text-gray-400">Countries</p>
            <p className="text-2xl font-bold text-foreground">2</p>
          </div>
          <div className="pt-4 border-t border-gray-700">
            <p className="text-sm">Additional content can go here</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapCompact;
