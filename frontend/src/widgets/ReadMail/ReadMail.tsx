import { useState, useEffect } from "react";
import "./ReadMail.scss";
import Input from "../../components/Input/Input";
import Textarea from "../../components/Textarea/Textarea";
import HorizontalScroller from "../../components/HorizontalScroller/HorizontalScroller";
import MailTools from "../MailTools/MailTools";
import { AppStorage } from "../../store/AppStorage";
import { URLMINIO } from "../../api/config";
import { deleteEmailsFromFolder } from "../../api/ApiFolder";
import { sendSpam } from "../../api/ApiSpam";
import { trash } from "../../api/ApiTrash";
import { formatTime } from "../../utils/date";
import { getAttachments, downloadAttachment } from "../../api/ApiAttachments";
import {
  formatFileSize,
  getIconByContentType,
  trimFileName,
} from "../../utils/files";
import { useTranslation } from "../../hooks/useTranslation";

interface ReadMailProps {
  email?: any;
  selectedEmails?: any[];
  reloadMail?: () => void;
  backToMail?: () => void;
  backToSent?: () => void;
  onFavoriteToggled?: (newState: boolean) => void;
  navigate: (path: string) => void;
  selectedFolderId: number | null;
  previousPath?: string | null;
}

export default function ReadMail({
  email,
  selectedEmails,
  reloadMail,
  backToMail,
  backToSent,
  onFavoriteToggled,
  navigate,
  selectedFolderId,
  previousPath,
}: ReadMailProps) {
  const { t, language } = useTranslation();
  const [attachments, setAttachments] = useState<any[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState<boolean>(false);

  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" && window.innerWidth < 769,
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 769);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAttachments = async () => {
      if (!email?.id) return;

      setAttachmentsLoading(true);
      try {
        const data = await getAttachments(email.id);
        if (!isMounted) return;

        let attachmentsArray = [];
        if (Array.isArray(data)) {
          attachmentsArray = data;
        } else if (data && Array.isArray(data.attachments)) {
          attachmentsArray = data.attachments;
        } else if (data && typeof data === "object") {
          attachmentsArray = [data];
        }

        setAttachments(attachmentsArray);
      } catch {
        if (isMounted) setAttachments([]);
      } finally {
        if (isMounted) setAttachmentsLoading(false);
      }
    };

    fetchAttachments();

    return () => {
      isMounted = false;
    };
  }, [email]);

  const handleDownload = async (attachmentId: number, fileName: string) => {
    if (!email?.id) return;

    try {
      const blob = await downloadAttachment(email.id, attachmentId);
      if (!blob) return;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const handleCloseEmail = () => {
    navigate("/");
  };

  const handleDeleteEmail = async () => {
    if (selectedFolderId) {
      const ids = [email.id];
      await deleteEmailsFromFolder(selectedFolderId, ids);
      backToMail?.();
    } else if (previousPath === "/sent") {
      await trash([email.id]);
      backToSent?.();
    } else {
      await trash([email.id]);
      backToMail?.();
    }
  };

  const handleReply = () => {
    AppStorage.setReplyData({
      type: "reply",
      to: email.senderEmail || "",
      subject: `Re: ${email.header}`,
      body: `\n\n${t("original_email")}\n${t("from")} ${email.is_anonymous ? t("anonymous") : email.senderEmail || ""}\n${t("date")} ${email.createdAt ? new Date(email.createdAt).toLocaleString("ru-RU") : t("unknown")} \n\n${email.body}`,
      originalEmail: email,
    });

    AppStorage.replyingToAnonymous = email.is_anonymous;
    AppStorage.emailReplyingId = email.id;

    navigate("/send");
  };

  const handleForward = () => {
    AppStorage.setForwardData({
      type: "forward",
      subject: `Fwd: ${email.header || "Без темы"}`,
      body: `\n\n${t("forwarded_email")}\n${t("from")} ${email.senderEmail}\n${t("date")} ${email.createdAt ? new Date(email.createdAt).toLocaleString("ru-RU") : t("unknown")}\n${t("subject")} ${email.header || t("empty_subject")}\n${t("to")} ${email.receiverList}\n\n${email.body || ""}`,
      originalEmail: email,
    });

    navigate("/send");
  };

  const handleMarkAsSpam = async (event: any) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
      await sendSpam(selectedEmails);
      reloadMail?.();
    }
  };

  const handleMarkAsFavorite = async (event: any) => {
    event.preventDefault();
    if (selectedEmails && selectedEmails.length > 0) {
    }
  };

  const hasAttachments = attachments.length > 0;

  return (
    <div className="read-mail">
      {isMobile ? (
        <div className="read-mail__header-mobile">
          <div className="back-button" onClick={backToMail}></div>

          <MailTools
            deleteEmail={handleDeleteEmail}
            onReply={handleReply}
            onForward={handleForward}
            email={email}
            reloadMail={reloadMail}
            backToMail={backToMail}
          />
        </div>
      ) : null}
      <form action="" className="read-form">
        <div className="read-inputs">
          <div className="read-header">
            <div className="sender-avatar">
              <img
                src={
                  email.senderImage !== ""
                    ? `${URLMINIO}/${email.senderImage}`
                    : "/assets/svg/Avatar.svg"
                }
              />
            </div>
            <div className="sender-data">
              <div className="sender__email">
                <span>
                  {email.is_anonymous ? t("anonymous") : email.senderEmail}
                </span>
                {isMobile ? (
                  <div className="email-send-time">
                    {formatTime(email.createdAt)}
                  </div>
                ) : null}
              </div>
              <div className="recivers__emails">
                {t("to")}
                <div className="input-form">
                  {(email.receiverList || []).map(
                    (email: string, index: number) => (
                      <span key={index} className="email-tag">
                        <span>{email}</span>
                      </span>
                    ),
                  )}
                </div>
              </div>
            </div>
            {!isMobile ? (
              <div className="top-right-bar">
                <span className="email-send-time">
                  {formatTime(email.createdAt)}
                </span>
                <div className="close-button" onClick={handleCloseEmail} />
              </div>
            ) : null}
          </div>
          <Input
            type="text"
            placeholder={t("empty_subject")}
            input_title={t("subject")}
            name="theme"
            readonly={true}
            value={email.header}
            onInput={() => {}}
          />
        </div>
        <div
          className={`attachments-section${hasAttachments ? "" : " hidden"}`}
        >
          <HorizontalScroller className="attachments-list">
            {attachments.map((att: any) => (
              <div className="attachment-item">
                <div
                  className={`attachment-icon ${getIconByContentType(att.content_type)}`}
                />
                <div className="attachment-info">
                  <span className="attachment-name">
                    {trimFileName(att.file_name)}
                  </span>
                  <span className="attachment-size">
                    {formatFileSize(att.size_bytes)}
                  </span>
                </div>
                <div
                  className="attachment-download-btn"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    handleDownload(att.id, att.file_name);
                  }}
                ></div>
              </div>
            ))}
          </HorizontalScroller>
        </div>
        <Textarea readonly={true} value={email.body} />
      </form>
      {!isMobile ? (
        <MailTools
          deleteEmail={handleDeleteEmail}
          onReply={handleReply}
          onForward={handleForward}
          email={email}
          reloadMail={reloadMail}
          backToMail={backToMail}
          onFavoriteToggled={onFavoriteToggled}
          isFavorite={email.is_favorite}
        />
      ) : (
        <div className="tools-bottom-mobile">
          <div className="reply" onClick={handleForward} />
          <div className="answer" onClick={handleReply} />
        </div>
      )}
    </div>
  );
}
