import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getInboxEmails } from "../../api/ApiEmail";

export default function MainPage() {
  return (
    <BaseEmailPage
      currentView="inbox"
      fetchEmails={getInboxEmails}
      emptyMessage="empty_inbox"
      emptySubMessage="first_email_sub"
      showUnreadToggle
      showMarkAsRead
      showMoveToFolder
      currentFolderId={null}
    />
  );
}
