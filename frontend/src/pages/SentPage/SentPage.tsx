import { useNavigate } from "react-router-dom";

import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailSend, getEmailByID } from "../../api/ApiEmail";
import { trash } from "../../api/ApiTrash";

export default function SentPage() {
  const navigate = useNavigate();

  const onReadMail = async (email: any) => {
    const fullEmail = await getEmailByID(email.id);
    navigate(`/read/${fullEmail.id}`);
  };

  return (
    <BaseEmailPage
      currentView="sent"
      fetchEmails={getEmailSend}
      deleteEmails={trash}
      emptyMessage="empty_sent"
      emptySubMessage="first_email_sub"
      onReadMail={onReadMail}
    />
  );
}
