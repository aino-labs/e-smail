import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsTrash, trash } from "../../api/ApiTrash";

export default function TrashPage() {
  return (
    <BaseEmailPage
      currentView="trash"
      fetchEmails={getEmailsTrash}
      deleteEmails={trash}
      emptyMessage="empty_trash"
    />
  );
}
