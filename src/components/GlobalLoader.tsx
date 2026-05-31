"use client";

import { useState, useEffect } from "react";
import { useSettings } from "@/context/SettingsContext";
import { getImageUrl } from "@/utils/image";

export default function GlobalLoader() {
  const [show, setShow] = useState(true);
  const { settings, loading } = useSettings();
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // Only run this logic once when the component mounts (on full app refresh)
    // If settings are loaded, start the fade out process
    if (!loading) {
      const timer1 = setTimeout(() => setFade(true), 1000); // Wait 1s to show the logo
      const timer2 = setTimeout(() => setShow(false), 1500); // 500ms fade transition
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [loading]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-white dark:bg-neutral-950 transition-opacity duration-500 pointer-events-none ${
        fade ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-pulse flex items-center justify-center">
        {!loading && (settings?.logo || settings?.dark_logo) ? (
          <>
            {settings.logo && (
              <img
                src={getImageUrl(settings.logo)!}
                alt={settings?.company_name || "Logo"}
                className={`h-20 md:h-28 w-auto object-contain ${
                  settings.dark_logo ? "dark:hidden block" : ""
                }`}
              />
            )}
            {settings.dark_logo && (
              <img
                src={getImageUrl(settings.dark_logo)!}
                alt={settings?.company_name || "Logo"}
                className={`h-20 md:h-28 w-auto object-contain ${
                  settings.logo ? "hidden dark:block" : ""
                }`}
              />
            )}
          </>
        ) : (
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-neutral-800 border-t-black dark:border-t-white rounded-full animate-spin" />
        )}
      </div>
    </div>
  );
}
