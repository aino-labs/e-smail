import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getTrashEmails, trash } from "../../api/ApiTrash";

export default function TrashPage() {
  return (
    <BaseEmailPage
      currentView="trash"
      fetchEmails={getTrashEmails}
      deleteEmails={trash}
      emptyMessage="empty_trash"
    />
  );
}
