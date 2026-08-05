import Button from "../../components/Button/Button";
import { TranslationKey, useTranslation } from "../../hooks/useTranslation";
import "./ConfirmationDialog.scss";

interface ConfirmationDialogProps {
  callbackConfirm: () => void;
  callbackCancel: () => void;
  text: string;
  cancelButtonTitle?: TranslationKey;
  confirmButtonTitle?: TranslationKey;
  highlightCancel?: boolean;
}

export default function ConfirmationDialog({
  callbackConfirm,
  callbackCancel,
  text,
  cancelButtonTitle = "action_cancel",
  confirmButtonTitle = "action_confirm",
  highlightCancel = false,
}: ConfirmationDialogProps) {
  const { t, language } = useTranslation();
  return (
    <div className="confirmation-dialog">
      <div className="__overlay" />
      <div className="__content">
        <h2>{text}</h2>
        <div className="__buttons">
          <Button
            className={highlightCancel ? "primary" : "secondary"}
            title={t(cancelButtonTitle)}
            onClick={callbackCancel}
          />
          <Button
            className={!highlightCancel ? "primary" : "secondary"}
            title={t(confirmButtonTitle)}
            onClick={callbackConfirm}
          />
        </div>
      </div>
    </div>
  );
}
