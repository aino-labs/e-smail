import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getAllEmails } from "../../api/ApiEmail";

interface AllEmailsPageProps {
  navigate: (path: string) => void;
}

export default function AllEmailsPage({ navigate }: AllEmailsPageProps) {
  return (
    <BaseEmailPage
      currentView="all-emails"
      fetchEmails={getAllEmails}
      emptyMessage="empty_inbox"
      navigate={navigate}
    />
  );
}
