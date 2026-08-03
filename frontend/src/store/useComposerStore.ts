import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface BaseComposerData {
  subject: string;
  body: string;
  recipients: string[];
}

export type ComposerData =
  | ({ type: "new" } & BaseComposerData)
  | ({ type: "draft"; draftId: number } & BaseComposerData)
  | ({
      type: "reply";
      replyToId: number;
      replyingToAnonymous: boolean;
    } & BaseComposerData)
  | ({
      type: "forward";
      originalEmailId?: number;
    } & BaseComposerData);

interface ComposerState {
  data: ComposerData;
  replyingToAnonymous: boolean;
  emailReplyingId: number | null;

  setComposerData: (data: Partial<ComposerData>) => void;
  setEmailReplyingId: (emailId: number) => void;
  setReplyingToAnonymous: (enabled: boolean) => void;
  clearComposerData: () => void;
}

const initialData: ComposerData = {
  type: "new",
  subject: "",
  body: "",
  recipients: [] as string[],
};

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      data: initialData,
      replyingToAnonymous: false,
      emailReplyingId: null,

      setComposerData: (newData: Partial<ComposerData>) =>
        set((prev) => ({ ...prev, data: { ...prev.data, newData } })),
      setEmailReplyingId: (emailId: number) =>
        set({ emailReplyingId: emailId }),
      setReplyingToAnonymous: (enabled: boolean) =>
        set({ replyingToAnonymous: enabled }),
      clearComposerData: () =>
        set({
          data: initialData,
          replyingToAnonymous: false,
          emailReplyingId: null,
        }),
    }),
    {
      name: "composer-state",
    },
  ),
);
