import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getDrafts, deleteDraft } from "../../api/ApiDraft";

export default function DraftsPage() {
  return (
    <BaseEmailPage
      currentView="drafts"
      fetchEmails={getDrafts}
      deleteEmails={deleteDraft}
      emptyMessage="empty_drafts"
      showUnreadToggle={false}
      showMarkAsRead={false}
      showMoveToFolder={false}
    />
  );
}
