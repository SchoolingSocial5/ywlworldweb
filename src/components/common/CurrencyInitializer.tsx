"use client";

import { useEffect } from 'react';
import { useCurrencyStore } from '@/store/useCurrencyStore';

export default function CurrencyInitializer() {
  const initializeCurrency = useCurrencyStore(state => state.initializeCurrency);

  useEffect(() => {
    initializeCurrency().catch(err => {
      console.error("Failed to initialize visitor currency context:", err);
    });
  }, [initializeCurrency]);

  return null;
}
