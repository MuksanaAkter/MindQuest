"use client";
import { create } from "zustand";
import type { ArenaConfig } from "@mindquest/server/arena/contracts";
type ArenaUi = { config: ArenaConfig; sound: boolean; setConfig: (config: Partial<ArenaConfig>) => void; toggleSound: () => void };
export const useArenaUi = create<ArenaUi>((set) => ({
  config: { category: "mixed", difficulty: "EASY", timed: false, daily: false }, sound: true,
  setConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch, daily: false } })),
  toggleSound: () => set((state) => ({ sound: !state.sound })),
}));
