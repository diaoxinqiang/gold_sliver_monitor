import { MarketData } from '../types';

const STORAGE_KEY = 'gold_silver_history_v1';

export const getStoredHistory = (): MarketData[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load history", e);
    return [];
  }
};

export const saveStoredHistory = (history: MarketData[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save history", e);
  }
};

export const clearStoredHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
