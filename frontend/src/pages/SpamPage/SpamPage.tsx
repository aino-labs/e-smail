import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsSpam } from "../../api/ApiSpam";
import { trash } from "../../api/ApiTrash";

export default function SpamPage() {
  return (
    <BaseEmailPage
      currentView="spam"
      fetchEmails={getEmailsSpam}
      deleteEmails={trash}
      emptyMessage="empty_spam"
    />
  );
}
