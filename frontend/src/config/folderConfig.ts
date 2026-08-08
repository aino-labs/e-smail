import { TranslationKey } from "../hooks/useTranslation";
import { getAllEmails } from "../api/ApiEmail";
import { getDrafts } from "../api/ApiDraft";
import { getFavoriteEmails } from "../api/ApiFavorite";
import { getInboxEmails } from "../api/ApiEmail";
import { getSentEmails } from "../api/ApiEmail";
import { getSpamEmails } from "../api/ApiSpam";
import { getTrashEmails } from "../api/ApiTrash";
import { getFolderEmails } from "../api/ApiFolder";

export interface FolderConfig {
  view: string;
  fetchEmails: (offset: number, folderId?: number | null) => Promise<any>;
  emptyMessage: TranslationKey;
  emptySubMessage?: TranslationKey;
  showUnreadToggle?: boolean;
  showMarkAsRead?: boolean;
}

export const FOLDER_CONFIGS: Record<string, FolderConfig> = {
  inbox: {
    view: "inbox",
    fetchEmails: (offset) => getInboxEmails(offset),
    emptyMessage: "empty_inbox",
    emptySubMessage: "first_email_sub",
  },
  sent: {
    view: "sent",
    fetchEmails: (offset) => getSentEmails(offset),
    emptyMessage: "empty_sent",
    emptySubMessage: "first_email_sub",
  },
  trash: {
    view: "trash",
    fetchEmails: (offset) => getTrashEmails(offset),
    emptyMessage: "empty_trash",
  },
  drafts: {
    view: "drafts",
    fetchEmails: (offset) => getDrafts(offset),
    emptyMessage: "empty_drafts",
  },
  spam: {
    view: "spam",
    fetchEmails: (offset) => getSpamEmails(offset),
    emptyMessage: "empty_spam",
    showUnreadToggle: true,
  },
  favorite: {
    view: "favorite",
    fetchEmails: (offset) => getFavoriteEmails(offset),
    emptyMessage: "empty_favorites",
    showUnreadToggle: true,
  },
  "all-emails": {
    view: "all-emails",
    fetchEmails: (offset) => getAllEmails(offset),
    emptyMessage: "empty_inbox",
    showUnreadToggle: true,
  },
  folder: {
    view: "folder",
    fetchEmails: (offset, folderId) => getFolderEmails(folderId!, offset),
    emptyMessage: "empty_inbox",
    showUnreadToggle: true,
  },
};
