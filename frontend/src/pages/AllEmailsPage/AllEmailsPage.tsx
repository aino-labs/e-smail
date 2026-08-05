import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getAllEmails } from "../../api/ApiEmail";

export default function AllEmailsPage() {
  return (
    <BaseEmailPage
      currentView="all-emails"
      fetchEmails={getAllEmails}
      emptyMessage="empty_inbox"
    />
  );
}
