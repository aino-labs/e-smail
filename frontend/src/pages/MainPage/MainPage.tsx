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
      emptyMessage="Ваш почтовый ящик пуст :("
      emptySubMessage="Напишите ваше первое письмо, нажав на кнопку слева"
      showUnreadToggle
      showMarkAsRead
      showMoveToFolder
      currentFolderId={null}
      navigate={navigate}
    />
  );
}
