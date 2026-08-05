import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsFavorite } from "../../api/ApiFavorite";

export default function FavoritePage() {
  return (
    <BaseEmailPage
      currentView="favorite"
      fetchEmails={getEmailsFavorite}
      emptyMessage="empty_favorites"
    />
  );
}
