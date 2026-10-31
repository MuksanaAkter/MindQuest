"use client";
import { useCallback, useEffect, useRef } from "react";
export type GameCue = "select" | "lock" | "next" | "tick" | "correct" | "wrong" | "timeout" | "complete";
type Note = [frequency: number, offset: number, duration: number];
// Original synthesized effects: no downloads, external audio or background music.
const notes: Record<GameCue, Note[]> = {
  select: [[440, 0, .065]], lock: [[392, 0, .08], [587.33, .075, .12]],
  next: [[523.25, 0, .07], [659.25, .07, .1]], tick: [[880, 0, .045]],
  correct: [[523.25, 0, .15], [659.25, .1, .16], [783.99, .2, .17], [1046.5, .33, .28]],
  wrong: [[329.63, 0, .16], [261.63, .15, .25]],
  timeout: [[392, 0, .15], [329.63, .15, .17], [261.63, .32, .27]],
  complete: [[523.25, 0, .15], [659.25, .15, .15], [783.99, .3, .15], [1046.5, .5, .45], [783.99, .5, .4], [659.25, .5, .4]],
};
export function useGameAudio(enabled: boolean) {
  const enabledRef = useRef(enabled);
  const context = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null);
  const active = useRef(new Set<OscillatorNode | AudioBufferSourceNode>());
  const clapNoise = useRef<AudioBuffer | null>(null);
  const unlock = useCallback(() => {
    try {
      if (!context.current || context.current.state === "closed") {
        context.current = new AudioContext();
        master.current = context.current.createGain();
        master.current.gain.value = .075;
        master.current.connect(context.current.destination);
      }
      if (context.current.state === "suspended") void context.current.resume().catch(() => {});
    } catch { /* Audio is optional on unsupported/restricted browsers. */ }
  }, []);
  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      for (const oscillator of active.current) { try { oscillator.stop(); } catch { /* Already finished. */ } }
      active.current.clear();
      return;
    }
    // Creating/resuming inside a gesture works with browser autoplay policies.
    if (navigator.userActivation?.hasBeenActive) unlock();
    const activate = () => unlock();
    document.addEventListener("pointerdown", activate, true);
    document.addEventListener("keydown", activate, true);
    return () => { document.removeEventListener("pointerdown", activate, true); document.removeEventListener("keydown", activate, true); };
  }, [enabled, unlock]);
  useEffect(() => () => {
    if (context.current && context.current.state !== "closed") void context.current.close().catch(() => {});
    context.current = null; master.current = null; clapNoise.current = null;
  }, []);
  const play = useCallback((cue: GameCue) => {
    const audio = context.current;
    if (document.hidden || !enabledRef.current || !audio || audio.state !== "running" || !master.current) return;
    try {
      if (cue === "correct" || cue === "complete") {
        // Short, overlapping filtered noise bursts imitate hands clapping.
        // Reuse one original noise buffer; every burst has its own envelope.
        if (!clapNoise.current) {
          const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * .19), audio.sampleRate);
          const data = buffer.getChannelData(0);
          let seed = 317;
          for (let i = 0; i < data.length; i++) {
            seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
            data[i] = seed / 2147483648 - 1;
          }
          clapNoise.current = buffer;
        }
        const claps = cue === "complete" ? 9 : 6;
        for (let i = 0; i < claps; i++) {
          const source = audio.createBufferSource(); const filter = audio.createBiquadFilter(); const gain = audio.createGain();
          source.buffer = clapNoise.current; source.playbackRate.value = .94 + (i % 3) * .075;
          filter.type = "highpass"; filter.frequency.value = 900; filter.Q.value = .65;
          const at = audio.currentTime + .08 + i * .17 + (i % 2) * .025;
          gain.gain.setValueAtTime(.001, at);
          gain.gain.exponentialRampToValueAtTime(1.65, at + .004);
          gain.gain.exponentialRampToValueAtTime(.45, at + .035);
          gain.gain.exponentialRampToValueAtTime(.001, at + .17);
          source.connect(filter); filter.connect(gain); gain.connect(master.current);
          active.current.add(source);
          source.onended = () => { active.current.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect(); };
          source.start(at); source.stop(at + .19);
        }
      }
      for (const [frequency, offset, duration] of notes[cue]) {
        const oscillator = audio.createOscillator(); const gain = audio.createGain();
        oscillator.type = cue === "tick" ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        const at = audio.currentTime + offset;
        gain.gain.setValueAtTime(.001, at); gain.gain.exponentialRampToValueAtTime(cue === "tick" ? .25 : .65, at + .008);
        gain.gain.exponentialRampToValueAtTime(.001, at + duration);
        oscillator.connect(gain); gain.connect(master.current);
        active.current.add(oscillator);
        oscillator.onended = () => { active.current.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
        oscillator.start(at); oscillator.stop(at + duration + .015);
      }
    } catch { /* Gameplay remains available if audio output fails. */ }
  }, []);
  return { play, unlock };
}
