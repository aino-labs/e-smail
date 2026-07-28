import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsSpam } from "../../api/ApiSpam";
import { trash } from "../../api/ApiTrash";

interface SpamPageProps {
  navigate: (path: string) => void;
}

export default function SpamPage({ navigate }: SpamPageProps) {
  return (
    <BaseEmailPage
      currentView="spam"
      fetchEmails={getEmailsSpam}
      deleteEmails={trash}
      emptyMessage="Спам пуст"
      navigate={navigate}
    />
  );
}
