import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getInbox } from "../../api/ApiEmail";

interface MainPageProps {
  navigate: (path: string) => void;
}

export default function MainPage({ navigate }: MainPageProps) {
  return (
    <BaseEmailPage
      currentView="inbox"
      fetchEmails={getInbox}
      emptyMessage="empty_inbox"
      emptySubMessage="first_email_sub"
      showUnreadToggle
      showMarkAsRead
      showMoveToFolder
      currentFolderId={null}
      navigate={navigate}
    />
  );
}
