import { useEffect } from "react";
import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import {
  getEmailsFromFolder,
  deleteEmailsFromFolder,
} from "../../api/ApiFolder";
import { useMailStore } from "../../store/useMailStore";
import { useTranslation } from "../../hooks/useTranslation";

interface FolderPageProps {
  navigate: (path: string) => void;
}

export default function FolderPage({ navigate }: FolderPageProps) {
  const { t } = useTranslation();
  const { folders, currentFolderId } = useMailStore();
  const folderName =
    folders.find((f: any) => f.id === currentFolderId)?.name || t("folder");

  return (
    <BaseEmailPage
      currentView="folder"
      fetchEmails={(offset: number) =>
        getEmailsFromFolder(offset, currentFolderId)
      }
      deleteEmails={(ids: number[]) =>
        deleteEmailsFromFolder(currentFolderId, ids)
      }
      emptyMessage="empty_folder"
      emptySubMessage="empty_folder_sub"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      currentFolderId={currentFolderId}
      currentFolderName={folderName}
      navigate={navigate}
    />
  );
}
