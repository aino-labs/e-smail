import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailSend, getEmailByID } from "../../api/ApiEmail";
import { trash } from "../../api/ApiTrash";

interface SentPageProps {
  navigate: (path: string) => void;
}

export default function SentPage({ navigate }: SentPageProps) {
  const onReadMail = async (email: any) => {
    const fullEmail = await getEmailByID(email.id);
    navigate(`/read/${fullEmail.id}`);
  };

  return (
    <BaseEmailPage
      currentView="sent"
      fetchEmails={getEmailSend}
      deleteEmails={trash}
      emptyMessage="Нет отправленных писем"
      emptySubMessage="Напишите ваше первое письмо, нажав на кнопку слева"
      onReadMail={onReadMail}
      navigate={navigate}
    />
  );
}
