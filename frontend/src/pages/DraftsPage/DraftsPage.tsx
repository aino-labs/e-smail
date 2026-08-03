import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getDrafts, deleteDraft } from "../../api/ApiDraft";

interface DraftsPageProps {
  navigate: (path: string) => void;
}

export default function DraftsPage({ navigate }: DraftsPageProps) {
  return (
    <BaseEmailPage
      currentView="drafts"
      fetchEmails={getDrafts}
      deleteEmails={deleteDraft}
      emptyMessage="empty_drafts"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
      navigate={navigate}
    />
  );
}
