"use client";
import { create } from "zustand";
import type { Avatar, PlayerState, PublicQuiz } from "@mindquest/server/quizzes/contracts";
import { quizApi } from "./api";
type LibraryState = { quizzes: PublicQuiz[]; player: PlayerState | null; loading: boolean; loaded: boolean; error: string; selectedCode: string; avatar: Avatar; avatarTouched: boolean; setCode: (code: string) => void; setAvatar: (avatar: Avatar) => void; load: (force?: boolean) => Promise<void> };
let loadingPromise: Promise<void> | null = null;
export const useLibrary = create<LibraryState>((set, get) => ({
  quizzes: [], player: null, loading: true, loaded: false, error: "", selectedCode: "", avatar: "owl", avatarTouched: false,
  setCode: (selectedCode) => set({ selectedCode }), setAvatar: (avatar) => set({ avatar, avatarTouched: true }),
  load: async (force = false) => {
    if (loadingPromise) return loadingPromise;
    if (get().loaded && !force) return;
    set({ loading: true, error: "" });
    loadingPromise = Promise.all([quizApi<{ quizzes: PublicQuiz[] }>("/api/quizzes/public"), quizApi<PlayerState>("/api/player")])
      .then(([catalogue, player]) => set({ quizzes: catalogue.quizzes, player, avatar: get().avatarTouched ? get().avatar : player.avatar, loaded: true }))
      .catch((e: unknown) => set({ error: e instanceof Error ? e.message : "The library is unavailable. Please retry." }))
      .finally(() => { set({ loading: false }); loadingPromise = null; });
    return loadingPromise;
  },
}));
