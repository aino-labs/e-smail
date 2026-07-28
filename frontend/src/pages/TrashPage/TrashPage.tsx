import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsTrash, trash } from "../../api/ApiTrash";

interface TrashPageProps {
  navigate: (path: string) => void;
}

export default function TrashPage({ navigate }: TrashPageProps) {
  return (
    <BaseEmailPage
      currentView="trash"
      fetchEmails={getEmailsTrash}
      deleteEmails={trash}
      emptyMessage="Корзина пуста"
      navigate={navigate}
    />
  );
}
