import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getDrafts, getDraftByID, deleteDraft } from "../../api/ApiDraft";
import { AppStorage } from "../../store/AppStorage";

interface DraftsPageProps {
  navigate: (path: string) => void;
}

export default function DraftsPage({ navigate }: DraftsPageProps) {
  const handleReadMail = async (email: any) => {
    try {
      const response = await getDraftByID(email.id);
      if (response) {
        const draft = await response.json();
        AppStorage.setDraftData({
          id: draft.id,
          header: draft.header,
          body: draft.body,
          receivers: draft.receivers || [],
        });
        navigate("/send");
      }
    } catch (error) {
      console.error("Failed to load draft:", error);
    }
  };

  return (
    <BaseEmailPage
      currentView="drafts"
      fetchEmails={getDrafts}
      deleteEmails={deleteDraft}
      emptyMessage="Нет черновиков"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      navigate={navigate}
    />
  );
}
