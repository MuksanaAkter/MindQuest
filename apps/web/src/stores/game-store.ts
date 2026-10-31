"use client";
import { create } from "zustand";
type GameUiState = {
  questDialogOpen: boolean;
  setQuestDialogOpen: (open: boolean) => void;
};
// Only temporary UI state lives here. XP and quest progress stay on the server.
export const useGameStore = create<GameUiState>((set) => ({
  questDialogOpen: false,
  setQuestDialogOpen: (questDialogOpen) => set({ questDialogOpen }),
}));
