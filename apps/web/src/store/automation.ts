/** Salvo em `postId` na API: automação para qualquer post/reel da conta conectada. */
export const AUTOMATION_ALL_POSTS_POST_ID = "*";

export type TriggerAutomationDraft = {
  postId: string;
  keywords: string[];
  replyToCommentEnabled: boolean;
  /** Três respostas públicas; uma é escolhida aleatoriamente a cada comentário. */
  commentReplyVariants: [string, string, string];
};

import { create } from "zustand";

type AutomationStore = {
  draft: TriggerAutomationDraft;
  setField: <K extends keyof TriggerAutomationDraft>(key: K, value: TriggerAutomationDraft[K]) => void;
  setReplyVariant: (index: 0 | 1 | 2, value: string) => void;
  addKeyword: (word: string) => void;
  removeKeyword: (word: string) => void;
  reset: () => void;
};

const initialState: TriggerAutomationDraft = {
  postId: "",
  keywords: ["link"],
  replyToCommentEnabled: true,
  commentReplyVariants: [
    "Feito! Verifique suas DMs para o link 📩",
    "Te mandei o link na dm!",
    "O link está nas suas DMs 📩"
  ]
};

export const useAutomationStore = create<AutomationStore>((set) => ({
  draft: initialState,
  setField: (key, value) => set((state) => ({ draft: { ...state.draft, [key]: value } })),
  setReplyVariant: (index, value) =>
    set((state) => {
      const next = [...state.draft.commentReplyVariants] as [string, string, string];
      next[index] = value;
      return { draft: { ...state.draft, commentReplyVariants: next } };
    }),
  addKeyword: (word) =>
    set((state) => {
      const normalized = word.trim().toLowerCase();
      if (!normalized || state.draft.keywords.includes(normalized)) return state;
      return { draft: { ...state.draft, keywords: [...state.draft.keywords, normalized] } };
    }),
  removeKeyword: (word) =>
    set((state) => ({ draft: { ...state.draft, keywords: state.draft.keywords.filter((k) => k !== word) } })),
  reset: () => set({ draft: initialState })
}));
