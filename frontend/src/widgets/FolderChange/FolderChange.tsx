import { useState, useRef, useEffect } from "react";
import "./FolderChange.scss";
import Button from "../../components/Button/Button";
import { AppStorage } from "../../stores/AppStorage";
import { toast } from "../../stores/toastStore";
import { getProfile } from "../../api/ApiAuth";
import {
  createNewFolder,
  changeFolderName,
  deleteFolder,
} from "../../api/ApiFolder";
import ConfirmationDialog from "../../widgets/ConfirmationDialog/ConfirmationDialog";

interface FolderChangeProps {
  isEditMode: boolean;
}

const t = (key: string) => {
  return AppStorage.t ? AppStorage.t(key) : key;
};

export default function FolderChange({
  isEditMode = false,
}: FolderChangeProps) {
  const [folders, setFolders] = useState<any[]>(() => {
    return Array.isArray(AppStorage.folders) ? AppStorage.folders : [];
  });
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editingFolderName, setEditingFolderName] = useState<string>("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    show: boolean;
    id: number | null;
    name: string;
  }>({
    show: false,
    id: null,
    name: "",
  });

  const lastClickTime = useRef<number>(0);

  const stateRef = useRef({ folders, editingFolderId, editingFolderName });
  useEffect(() => {
    stateRef.current = { folders, editingFolderId, editingFolderName };
  }, [folders, editingFolderId, editingFolderName]);

  const loadFolders = async () => {
    const data = await getProfile();
    if (data && data.folder && Array.isArray(data.folder)) {
      const folders = data.folder.map((folder: any) => ({
        id: folder.folder_id,
        name: folder.folder_name,
      }));
      setFolders(folders);
      AppStorage.setFolders(folders);
    }
  };

  useEffect(() => {
    loadFolders();

    AppStorage.folderChangeInstance = { loadFolders };

    return () => {
      AppStorage.folderChangeInstance = null;
    };
  }, []);

  const startEditing = (folderId: number, currentName: string) => {
    const { editingFolderId: activeId } = stateRef.current;
    if (activeId !== null) {
      commitFolderEdit(activeId);
    }
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  };

  const cancelEditing = () => {
    setEditingFolderId(null);
    setEditingFolderName("");
  };

  const commitFolderEdit = async (folderId: number) => {
    const { editingFolderName: currentName, folders: currentFolders } =
      stateRef.current;
    const trimmed = currentName.trim();
    const original =
      currentFolders.find((f: any) => f.id === folderId)?.name || "";

    if (!trimmed || trimmed === original) {
      cancelEditing();
      return;
    }

    if (
      currentFolders.some((f: any) => f.id !== folderId && f.name === trimmed)
    ) {
      console.warn("Folder already exists with this name");
      return;
    }

    try {
      await changeFolderName(folderId, trimmed);
      const updatedFolders = currentFolders.map((folder: any) =>
        folder.id === folderId ? { ...folder, name: trimmed } : folder,
      );
      setFolders(updatedFolders);
      cancelEditing();
      AppStorage.setFolders(updatedFolders);
    } catch (error) {
      console.error("Error saving folder name:", error);
      cancelEditing();
    }
  };

  const handleFolderKeyDown = (e: any, folderId: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitFolderEdit(folderId);
    } else if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const handleNameClick = (e: any, folderId: number, name: string) => {
    const now = Date.now();
    if (now - lastClickTime.current < 300) {
      startEditing(folderId, name);
    }
    lastClickTime.current = now;
  };

  const handleAddFolder = async () => {
    const currentFolders = stateRef.current.folders;
    if (folders.length >= 6) {
      toast.show("too_many_folders", "error");
      return;
    }

    let newFolderName = t("new_folder");
    if (folders.some((f: any) => f.name === newFolderName)) {
      let i = 2;
      while (folders.some((f: any) => f.name === `${newFolderName} ${i}`)) {
        i++;
      }
      newFolderName = `${newFolderName} ${i}`;
    }

    const response = await createNewFolder(newFolderName);
    if (response?.folder_id) {
      const updatedFolders = [
        ...folders,
        { id: response.folder_id, name: newFolderName },
      ];
      setFolders(updatedFolders);
      AppStorage.setFolders(updatedFolders);
    } else {
      await loadFolders();
    }
  };

  const handleDeleteFolder = (
    folderId: number,
    folderName: string,
    event: any,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setDeleteConfirm({
      show: true,
      id: folderId,
      name: folderName,
    });
  };

  const confirmDelete = async () => {
    const { id: folderToDeleteId, folders: currentFolders } = {
      id: deleteConfirm.id,
      folders: stateRef.current.folders,
    };
    if (!folderToDeleteId) return;

    const updatedFolders = currentFolders.filter(
      (f: any) => f.id !== folderToDeleteId,
    );
    await deleteFolder(folderToDeleteId);
    setFolders(updatedFolders);
    cancelEditing();
    setDeleteConfirm({ show: false, id: null, name: "" });
    AppStorage.setFolders(updatedFolders);
  };

  const cancelDelete = () => {
    setDeleteConfirm({ show: false, id: null, name: "" });
  };

  return (
    <div className="folder-container">
      <div className="folder-list">
        {folders.map((folder: any) => (
          <div key={folder.id} className="folder-item">
            <button
              className="folder-delete-btn"
              onClick={(e: any) =>
                handleDeleteFolder(folder.id, folder.name, e)
              }
            >
              ✕
            </button>

            {editingFolderId === folder.id ? (
              <div className="folder-edit">
                <input
                  className="folder-edit__input"
                  value={editingFolderName}
                  onInput={(e: any) => setEditingFolderName(e.target.value)}
                  onBlur={() => commitFolderEdit(folder.id)}
                  onKeyDown={(e) => handleFolderKeyDown(e, folder.id)}
                  autoFocus
                />
              </div>
            ) : (
              <span
                className="folder-name"
                onClick={(e: any) => handleNameClick(e, folder.id, folder.name)}
              >
                {folder.name}
              </span>
            )}

            {isEditMode && editingFolderId !== folder.id && (
              <button
                className="folder-drag-btn"
                onClick={(e: any) => e.preventDefault()}
              />
            )}
          </div>
        ))}
      </div>
      <div className="folder-actions">
        <Button
          title={t("add_a_folder")}
          name="add_a_folder"
          onClick={(e: any) => {
            e.preventDefault();
            handleAddFolder();
          }}
        />
      </div>
      {deleteConfirm.show && (
        <ConfirmationDialog
          text={`${t("confirm_delete_folder")} "${deleteConfirm.name}"?`}
          callbackConfirm={confirmDelete}
          callbackCancel={cancelDelete}
        />
      )}
    </div>
  );
}
