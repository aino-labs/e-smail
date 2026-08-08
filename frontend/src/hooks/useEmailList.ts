import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FOLDER_CONFIGS, FolderConfig } from "../config/folderConfig";
import { useUIStore } from "../store/useUIStore";
import { useUserStore } from "../store/useUserStore";
import { useMailStore } from "../store/useMailStore";
import { useComposerStore } from "../store/useComposerStore";
import { readEmail, unReadEmail } from "../api/ApiEmail";
import { deleteEmailsFromFolder, addEmailsInFolder } from "../api/ApiFolder";
import { deleteDraft, getDraftByID } from "../api/ApiDraft";
import { trash } from "../api/ApiTrash";
import { sendFavorite, unFavorite } from "../api/ApiFavorite";

export function useEmailList() {
  const navigate = useNavigate();
  const { folder = "inbox", folderId } = useParams<{
    folder: string;
    folderId?: string;
  }>();
  const currentFolderId = folderId ? Number(folderId) : null;

  const config: FolderConfig = FOLDER_CONFIGS[folder] ?? FOLDER_CONFIGS.inbox;

  const { setCurrentView } = useUIStore();
  const { isProfileLoaded } = useUserStore();
  const {
    cacheEmails,
    setCurrentFolderId,
    setUnreadCount,
    setDraftCount,
    setSpamCount,
  } = useMailStore();
  const { setComposerData } = useComposerStore();

  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [selectedEmails, setSelectedEmails] = useState<Set<number>>(new Set());
  const [isSelectAll, setIsSelectAll] = useState(false);

  const initialLoadDone = useRef(false);
  const offsetRef = useRef(offset);
  offsetRef.current = offset;

  const selectedArray = Array.from(selectedEmails);

  // --- Core Fetching ---

  const loadEmails = useCallback(
    async (targetOffset: number = 0) => {
      if (!isProfileLoaded) return;

      setIsLoading(true);
      try {
        const data = await config.fetchEmails(targetOffset, currentFolderId);
        const fetched = data.emails || data.drafts || data || [];
        const list = Array.isArray(fetched) ? fetched : [];

        cacheEmails(list);
        setEmails(list);
        setTotal(data.total || list.length);
        if (folder === "inbox") {
          setUnreadCount(data.unread_count);
        }
        if (folder === "drafts") {
          setDraftCount(data.total || list.length);
        }
        if (folder === "spam") {
          setSpamCount(data.total || list.length);
        }
        setOffset(targetOffset);
        setSelectedEmails(new Set());
        setIsSelectAll(false);
      } catch (error) {
        console.error(`Failed to load ${config.view}:`, error);
      } finally {
        setIsLoading(false);
        initialLoadDone.current = true;
      }
    },
    [config, currentFolderId, isProfileLoaded, cacheEmails],
  );

  // Sync route view to UI Store
  useEffect(() => {
    setCurrentView(config.view);
  }, [config.view, setCurrentView]);

  // Refetch when folder or folderId changes
  useLayoutEffect(() => {
    loadEmails(0);
  }, [folder, currentFolderId]);

  // Refetch on window focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && initialLoadDone.current) {
        loadEmails(offsetRef.current);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [loadEmails]);

  // --- Selection Actions ---

  const toggleSelectEmail = (emailId: number) => {
    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);

      setIsSelectAll(emails.length > 0 && next.size === emails.length);
      return next;
    });
  };

  const toggleSelectAll = (isChecked?: boolean) => {
    if (isChecked) {
      setSelectedEmails(new Set(emails.map((e) => e.id)));
      setIsSelectAll(true);
    } else {
      setSelectedEmails(new Set());
      setIsSelectAll(false);
    }
  };

  // --- Email Operations ---

  const handleReadMail = async (email: any) => {
    if (config.view === "drafts") {
      try {
        const response = await getDraftByID(email.id);
        if (response) {
          const draft = await response.json();
          setComposerData({
            type: "draft",
            draftId: draft.id,
            subject: draft.header,
            body: draft.body,
            recipients: draft.receivers || [],
          });
          navigate("/send");
        }
      } catch (error) {
        console.error("Failed to load draft:", error);
      }
      return;
    }

    await readEmail([email.id]);
    if (config.view === "folder") {
      setCurrentFolderId(currentFolderId);
    }
    navigate(`/read/${email.id}`);
  };

  const handleDeleteSelected = async () => {
    if (selectedEmails.size === 0) return;
    const ids = selectedArray;

    let success = false;
    if (config.view === "drafts") {
      success = await deleteDraft(ids);
    } else if (config.view === "folder" && currentFolderId !== null) {
      success = await deleteEmailsFromFolder(currentFolderId, ids);
    } else {
      success = await trash(ids);
    }

    if (success) await loadEmails(offset);
  };

  const handleToggleReadSingle = async (
    emailId: number,
    newReadState: boolean,
  ) => {
    if (!config.showUnreadToggle) return;
    if (newReadState) await readEmail([emailId]);
    else await unReadEmail([emailId]);

    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, is_read: newReadState } : e)),
    );
  };

  const handleToggleFavoriteSingle = async (
    emailId: number,
    newState: boolean,
  ) => {
    if (newState) await sendFavorite([emailId]);
    else await unFavorite([emailId]);

    setEmails((prev) =>
      prev.map((e) => (e.id === emailId ? { ...e, is_starred: newState } : e)),
    );
  };

  const handleMoveToFolder = async (targetFolderId: number) => {
    if (selectedEmails.size === 0 || !targetFolderId) return;
    await addEmailsInFolder(targetFolderId, selectedArray);
    await loadEmails(offset);
  };

  const handleMarkAsRead = async () => {
    if (!(folder === "inbox" || folder === "all-emails")) return;

    const unreadIds = selectedArray.filter((selectedId: number) => {
      const email = emails.find((e: any) => e.id === selectedId);
      return email && !email.is_read;
    });

    if (unreadIds.length > 0) {
      await readEmail(unreadIds);
      const updatedEmails = emails.map((email: any) =>
        unreadIds.includes(email.id) ? { ...email, is_read: true } : email,
      );

      setEmails(updatedEmails);
    }
  };

  const handleTrashSingle = async (emailId: number) => {
    let success = false;
    if (folder === "drafts") {
      success = await deleteDraft([emailId]);
    } else if (folder === "folder" && currentFolderId !== null) {
      success = await deleteEmailsFromFolder(currentFolderId, [emailId]);
    } else {
      success = await trash([emailId]);
    }

    if (success) {
      await loadEmails(offset);
    }
  };

  return {
    config,
    currentFolderId,
    emails,
    isLoading,
    offset,
    setOffset,
    total,
    selectedArray,
    isSelectAll,
    loadEmails,
    toggleSelectEmail,
    toggleSelectAll,
    handleReadMail,
    handleDeleteSelected,
    handleToggleReadSingle,
    handleToggleFavoriteSingle,
    handleMoveToFolder,
    handleMarkAsRead,
    handleTrashSingle,
  };
}
