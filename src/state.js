import { create } from 'zustand'

// Read every frame by the camera rig; kept outside React so updating it never re-renders anything.
// (This file must not import three.js: it is part of the small first-load bundle.)
export const scrollState = { progress: 0 } // 0..1 across the whole journey (driven by GSAP ScrollTrigger)

export const useStore = create((set) => ({
  selected: null, // id of the project whose panel is open
  hovered: null, // id of the hovered planet
  mediaIndex: 0, // which media item of the selected project is showing
  audioOn: false,
  loading: { progress: 0, done: false },

  select: (id) => set({ selected: id, hovered: null, mediaIndex: 0 }),
  hover: (id) => set({ hovered: id }),
  setMediaIndex: (i) => set({ mediaIndex: i }),
  toggleAudio: () => set((s) => ({ audioOn: !s.audioOn })),
  setLoading: (loading) => set({ loading }),
}))
