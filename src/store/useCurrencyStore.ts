import { create } from 'zustand';
import { useSettingStore } from './useSettingStore';

export interface CountryIPMapping {
  country: string;
  abbreviation: string;
  flagUrl: string;
  ips: string[];
  currency: string;
  symbol: string;
}

export const IP_COUNTRY_MAPPINGS: CountryIPMapping[] = [
  {
    country: "United States",
    abbreviation: "USA",
    flagUrl: "https://flagcdn.com/w40/us.png",
    ips: ["8.8.8.8", "8.8.4.4", "12.34.56.78"],
    currency: "USD",
    symbol: "$"
  },
  {
    country: "United Kingdom",
    abbreviation: "GBR",
    flagUrl: "https://flagcdn.com/w40/gb.png",
    ips: ["192.168.1.1", "127.0.0.1", "2.24.0.0"],
    currency: "GBP",
    symbol: "£"
  },
  {
    country: "Germany",
    abbreviation: "DEU",
    flagUrl: "https://flagcdn.com/w40/de.png",
    ips: ["8.8.8.9", "46.223.128.0"],
    currency: "EUR",
    symbol: "€"
  },
  {
    country: "Nigeria",
    abbreviation: "NGA",
    flagUrl: "https://flagcdn.com/w40/ng.png",
    ips: ["102.89.0.1", "102.88.0.0", "197.210.0.0"],
    currency: "NGN",
    symbol: "₦"
  },
  {
    country: "Canada",
    abbreviation: "CAN",
    flagUrl: "https://flagcdn.com/w40/ca.png",
    ips: ["24.48.0.1", "198.50.0.0"],
    currency: "CAD",
    symbol: "CA$"
  }
];

interface CurrencyState {
  detectedIp: string | null;
  activeCountry: string;
  activeAbbreviation: string;
  activeFlag: string;
  activeCurrency: string;
  activeSymbol: string;
  exchangeRate: number; // relative to GBP
  rates: Record<string, number>;
  loading: boolean;
  initialized: boolean;
  initializeCurrency: (force?: boolean) => Promise<void>;
  setCurrencyManual: (currencyCode: string) => void;
  formatPrice: (amountInGBP: number | string) => string;
  convertPrice: (amountInGBP: number | string) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  detectedIp: null,
  activeCountry: "United Kingdom",
  activeAbbreviation: "GBR",
  activeFlag: "https://flagcdn.com/w40/gb.png",
  activeCurrency: "GBP",
  activeSymbol: "£",
  exchangeRate: 1.0,
  rates: { GBP: 1.0 },
  loading: false,
  initialized: false,

  initializeCurrency: async (force = false) => {
    if (get().initialized && !force) return;
    set({ loading: true });
    
    // Fetch settings to check dynamic currency preference
    let useDynamic = true;
    let defaultCountryAbbrev = "GBR";
    
    try {
      const { settings, fetchSettings } = useSettingStore.getState();
      let activeSettings = settings;
      if (!activeSettings) {
        activeSettings = await fetchSettings();
      }
      if (activeSettings) {
        useDynamic = activeSettings.use_dynamic_currency !== false;
        defaultCountryAbbrev = activeSettings.default_country || "GBR";
      }
    } catch (e) {
      console.warn("Failed to retrieve admin currency settings", e);
    }

    const defaultMapping = IP_COUNTRY_MAPPINGS.find(m => m.abbreviation === defaultCountryAbbrev) || IP_COUNTRY_MAPPINGS[1]; // fallback GBR

    let ip = "127.0.0.1";
    let matchedMapping: CountryIPMapping | null = null;
    let fallbackInfo: any = null;

    if (useDynamic) {
      try {
        // 1. Get user's IP
        const ipRes = await fetch("https://api.ipify.org?format=json");
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          ip = ipData.ip;
        }
      } catch (e) {
        console.warn("Failed to fetch public IP via ipify, falling back to client geo API directly", e);
      }

      // 2. Check if IP matches any of our predefined mapping arrays
      for (const mapping of IP_COUNTRY_MAPPINGS) {
        if (mapping.ips.includes(ip)) {
          matchedMapping = mapping;
          break;
        }
      }

      // 3. Fallback: If not in our custom array of mock IPs, get actual geo-location/currency from IP API!
      if (!matchedMapping) {
        try {
          const geoRes = await fetch(`https://ipapi.co/${ip === "127.0.0.1" ? "" : ip}/json/`);
          if (geoRes.ok) {
            fallbackInfo = await geoRes.json();
          }
        } catch (e) {
          console.warn("Failed to get geolocation fallback from ipapi", e);
        }
      }
    }

    let country = defaultMapping.country;
    let abbreviation = defaultMapping.abbreviation;
    let flagUrl = defaultMapping.flagUrl;
    let currency = defaultMapping.currency;
    let symbol = defaultMapping.symbol;

    if (useDynamic) {
      if (matchedMapping) {
        country = matchedMapping.country;
        abbreviation = matchedMapping.abbreviation;
        flagUrl = matchedMapping.flagUrl;
        currency = matchedMapping.currency;
        symbol = matchedMapping.symbol;
      } else if (fallbackInfo && !fallbackInfo.error) {
        country = fallbackInfo.country_name || defaultMapping.country;
        abbreviation = fallbackInfo.country_code || defaultMapping.abbreviation;
        flagUrl = `https://flagcdn.com/w40/${(fallbackInfo.country_code || "gb").toLowerCase()}.png`;
        currency = fallbackInfo.currency || defaultMapping.currency;
        
        // Resolve currency symbol
        const symbolMap: Record<string, string> = {
          USD: "$", EUR: "€", GBP: "£", NGN: "₦", CAD: "CA$", AUD: "A$", 
          JPY: "¥", CNY: "¥", INR: "₹", ZAR: "R", GHS: "GH₵", KES: "KSh"
        };
        symbol = symbolMap[currency] || fallbackInfo.currency_symbol || currency;
      }
    }

    // 4. Fetch the latest exchange rates relative to GBP (Base database currency)
    let exchangeRate = 1.0;
    let rates: Record<string, number> = { GBP: 1.0 };
    try {
      const ratesRes = await fetch("https://open.er-api.com/v6/latest/GBP");
      if (ratesRes.ok) {
        const ratesData = await ratesRes.json();
        if (ratesData && ratesData.rates) {
          rates = ratesData.rates;
          exchangeRate = rates[currency] || 1.0;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch exchange rates, using 1:1 default", e);
    }

    set({
      detectedIp: useDynamic ? ip : "Dynamic Currency Disabled",
      activeCountry: country,
      activeAbbreviation: abbreviation,
      activeFlag: flagUrl,
      activeCurrency: currency,
      activeSymbol: symbol,
      exchangeRate: exchangeRate,
      rates: rates,
      loading: false,
      initialized: true
    });
  },

  setCurrencyManual: (currencyCode: string) => {
    const { rates } = get();
    const rate = rates[currencyCode] || 1.0;
    
    // Check if we have a mapping matching the code
    const mapping = IP_COUNTRY_MAPPINGS.find(m => m.currency === currencyCode);
    
    const symbolMap: Record<string, string> = {
      USD: "$", EUR: "€", GBP: "£", NGN: "₦", CAD: "CA$", AUD: "A$", 
      JPY: "¥", CNY: "¥", INR: "₹", ZAR: "R", GHS: "GH₵", KES: "KSh"
    };

    set({
      activeCountry: mapping?.country || currencyCode,
      activeAbbreviation: mapping?.abbreviation || currencyCode,
      activeFlag: mapping?.flagUrl || `https://flagcdn.com/w40/${currencyCode.substring(0, 2).toLowerCase()}.png`,
      activeCurrency: currencyCode,
      activeSymbol: mapping?.symbol || symbolMap[currencyCode] || currencyCode,
      exchangeRate: rate
    });
  },

  convertPrice: (amountInGBP: number | string) => {
    const numericAmount = typeof amountInGBP === 'string' ? parseFloat(amountInGBP) : amountInGBP;
    if (isNaN(numericAmount)) return 0;
    return numericAmount * get().exchangeRate;
  },

  formatPrice: (amountInGBP: number | string) => {
    const numericAmount = typeof amountInGBP === 'string' ? parseFloat(amountInGBP) : amountInGBP;
    if (isNaN(numericAmount)) return `${get().activeSymbol}0.00`;
    
    const converted = numericAmount * get().exchangeRate;
    return `${get().activeSymbol}${converted.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}));
