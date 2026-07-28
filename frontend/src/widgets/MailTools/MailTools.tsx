import Button from "../../components/Button/Button";
import "./MailTools.scss";
import { sendSpam, unSpam } from "../../api/ApiSpam";
import { sendFavorite, unFavorite } from "../../api/ApiFavorite";
import { useTranslation } from "../../hooks/useTranslation";

interface MailToolsProps {
  email?: any;
  isFavorite?: boolean;
  onFavoriteToggled?: (newState: boolean) => void;
  deleteEmail?: () => Promise<void> | void;
  onReply?: () => void;
  onForward?: () => void;
  backToMail?: () => void;
  reloadMail?: () => void;
}

export default function MailTools({
  email,
  isFavorite,
  onFavoriteToggled,
  deleteEmail,
  onReply,
  onForward,
  backToMail,
  reloadMail,
}: MailToolsProps) {
  const { t, language } = useTranslation();

  const handleDeleteClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    await deleteEmail?.();
  };

  const handleReplyClick = (event: React.MouseEvent) => {
    event.preventDefault();
    onReply?.();
  };

  const handleForwardClick = (event: React.MouseEvent) => {
    event.preventDefault();
    onForward?.();
  };

  const handleSpamClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (email) {
      await sendSpam([email.id]);
      backToMail?.();
    }
  };

  const handleUnSpamClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    if (email) {
      await unSpam([email.id]);
      reloadMail?.();
    }
  };

  const handleFavoriteToggle = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (email) {
      if (email.is_favorite) {
        await unFavorite([email.id]);
        onFavoriteToggled?.(false);
      } else {
        await sendFavorite([email.id]);
        onFavoriteToggled?.(true);
      }
    }
  };

  const isSpam = email?.is_spam;

  return (
    <div className="tools-container">
      <div className="tools-left">
        <Button
          name="favorite"
          active={isFavorite}
          help={isFavorite ? t("unstarred") : t("starred")}
          onClick={handleFavoriteToggle}
        />
        {isSpam ? (
          <Button
            name="unspam"
            help={t("unspam")}
            onClick={handleUnSpamClick}
          />
        ) : (
          <Button name="spam" help={t("spam")} onClick={handleSpamClick} />
        )}
        <Button name="trash" help={t("trash")} onClick={handleDeleteClick} />
      </div>
      <div className="tools-right">
        <Button
          name="answer"
          help={t("answer")}
          title={t("answer")}
          onClick={handleForwardClick}
        />
        <Button
          name="reply"
          title={t("reply")}
          help={t("reply")}
          onClick={handleReplyClick}
        />
      </div>
    </div>
  );
}
