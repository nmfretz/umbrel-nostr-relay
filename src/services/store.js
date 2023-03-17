import { create } from "zustand";

export const useSettingsStore = create(() => ({
  npubOrnip05Address: "",
  publicRelays: [],
}));
