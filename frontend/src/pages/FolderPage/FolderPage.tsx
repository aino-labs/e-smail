import { useEffect } from "react";
import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import {
  getEmailsFromFolder,
  deleteEmailsFromFolder,
} from "../../api/ApiFolder";
import { AppStorage } from "../../stores/AppStorage";

interface FolderPageProps {
  folderId?: string | number;
  navigate: (path: string) => void;
}

export default function FolderPage({ folderId, navigate }: FolderPageProps) {
  const activeFolderId =
    Number(folderId) || AppStorage.getCurrentFolderId?.() || 0;
  const folderName =
    AppStorage.folders?.find((f: any) => f.id === activeFolderId)?.name ||
    "Папка";

  useEffect(() => {
    AppStorage.setCurrentFolderId(activeFolderId);
  }, [activeFolderId]);

  return (
    <BaseEmailPage
      currentView="folder"
      fetchEmails={(offset: number) =>
        getEmailsFromFolder(offset, activeFolderId)
      }
      deleteEmails={(ids: number[]) =>
        deleteEmailsFromFolder(activeFolderId, ids)
      }
      emptyMessage={`Папка "${folderName}" пуста`}
      emptySubMessage={"Переместите письма в эту папку"}
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      currentFolderId={activeFolderId}
      currentFolderName={folderName}
      navigate={navigate}
    />
  );
}
