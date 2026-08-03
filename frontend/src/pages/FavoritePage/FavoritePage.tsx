import BaseEmailPage from "../../widgets/BaseEmailPage/BaseEmailPage";
import { getEmailsFavorite } from "../../api/ApiFavorite";

interface FavoritePageProps {
  navigate: (path: string) => void;
}

export default function FavoritePage({ navigate }: FavoritePageProps) {
  return (
    <BaseEmailPage
      currentView="favorite"
      fetchEmails={getEmailsFavorite}
      emptyMessage="empty_favorites"
      navigate={navigate}
    />
  );
}
