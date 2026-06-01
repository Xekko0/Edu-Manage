import { create } from 'zustand';

const useChatStore = create((set, get) => ({
  open: false,
  hasNewSuggestion: false,
  sessionToken: null,
  messages: [], // [{ role, content, type?, payload?, chips?, timestamp }]

  toggle: () => set({ open: !get().open, hasNewSuggestion: false }),
  close: () => set({ open: false }),
  addMessage: (msg) => set({ messages: [...get().messages, msg] }),
  setSession: (token) => set({ sessionToken: token }),
  setSuggestion: (val) => set({ hasNewSuggestion: val }),
  reset: () => set({ messages: [], sessionToken: null }),
}));

export default useChatStore;
