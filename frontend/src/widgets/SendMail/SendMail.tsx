import { useState, useRef, useEffect } from "react";
import "./SendMail.scss";
import InputEmail from "../../components/InputEmail/InputEmail";
import Input from "../../components/Input/Input";
import Textarea from "../../components/Textarea/Textarea";
import Button from "../../components/Button/Button";
import ConfirmationDialog from "../../widgets/ConfirmationDialog/ConfirmationDialog";
import HorizontalScroller from "../../components/HorizontalScroller/HorizontalScroller";
import { sendEmail, replyToEmail } from "../../api/ApiEmail";
import {
  uploadAttachment,
  getAttachments,
  deleteAttachments,
} from "../../api/ApiAttachments";
import { toast } from "../../store/toastStore";
import { createDraft, sendDraft, updateDraft } from "../../api/ApiDraft";
import {
  formatFileSize,
  getIconByContentType,
  trimFileName,
} from "../../utils/files";
import { useTranslation } from "../../hooks/useTranslation";
import { useComposerStore } from "../../store/useComposerStore";
import { useUIStore } from "../../store/useUIStore";

interface SendMailProps {
  actionData?: any;
  backToMail?: () => void;
}

export default function SendMail({ backToMail }: SendMailProps) {
  const { t } = useTranslation();
  const { data: composerData, clearComposerData } = useComposerStore();

  const [subject, setSubject] = useState(composerData.subject || "");
  const [body, setBody] = useState(composerData.body || "");
  const [recipients, setRecipients] = useState<string[]>(
    composerData.recipients || [],
  );
  const [invalidRecipients, setInvalidRecipients] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 769);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 769);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Sync state when store data changes
  useEffect(() => {
    setSubject(composerData.subject || "");
    setBody(composerData.body || "");
    setRecipients(composerData.recipients || []);
  }, [composerData]);

  const isReply = composerData.type === "reply";
  const isDraft = composerData.type === "draft";

  // Fixed recipient length check and safe union checks
  const isFormValid =
    body.trim().length > 0 &&
    (recipients.length > 0 || (isReply && composerData.replyingToAnonymous)) &&
    invalidRecipients.length === 0;

  const buttonBlock = !isFormValid;

  useEffect(() => {
    console.log(composerData);
    if (composerData.type !== "draft") return;
    const draftId = composerData.draftId;

    const fetchDraftAttachments = async () => {
      try {
        const data = await getAttachments(draftId);

        if (!data) return;

        let attachmentsArray = [];
        if (Array.isArray(data)) {
          attachmentsArray = data;
        } else if (data && Array.isArray(data.attachments)) {
          attachmentsArray = data.attachments;
        } else if (data && Array.isArray(data.data)) {
          attachmentsArray = data.data;
        } else if (data && typeof data === "object") {
          attachmentsArray = [data];
        }

        const draftFiles = attachmentsArray.map((att: any) => ({
          id: att.id || Math.random(),
          name: att.file_name || att.fileName,
          size: att.size_bytes || att.sizeBytes,
          type:
            att.content_type || att.contentType || "application/octet-stream",
          attachmentId: att.id,
          uploaded: true,
          file: null,
        }));

        setFiles((prev) => {
          const existingIds = new Set(prev.map((f: any) => f.attachmentId));
          const newUniqueFiles = draftFiles.filter(
            (f: any) => !existingIds.has(f.attachmentId),
          );
          return [...prev, ...newUniqueFiles];
        });
      } catch (err) {
        console.error("Failed to fetch draft attachments", err);
      }
    };

    fetchDraftAttachments();
  }, [composerData]);

  const uploadFiles = async (emailId: number) => {
    const newFiles = files.filter((f: any) => !f.uploaded);

    if (newFiles.length === 0) return true;

    setUploadingFiles(true);
    setSending(true);

    try {
      const uploadPromises = newFiles.map((fileItem: any) =>
        uploadAttachment(emailId, fileItem.file),
      );

      const results = await Promise.all(uploadPromises);
      const allSuccessful = results.every((result) => result !== null);

      if (!allSuccessful) {
        toast.show("file_upload_error", "error");
        return false;
      }

      return true;
    } catch {
      toast.show("file_upload_error", "error");
      return false;
    } finally {
      setUploadingFiles(false);
      setSending(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSending(true);

    let responseSend;

    if (composerData.type === "reply" && composerData.replyingToAnonymous) {
      responseSend = await replyToEmail(composerData.replyToId, {
        header: subject.trim(),
        body: body.trim(),
        files: files.map((f: any) => f.file),
        is_anonymous: isAnonymous,
      });
    } else if (composerData.type === "draft") {
      const draftId = composerData.draftId;

      await updateDraft(
        {
          header: subject.trim(),
          body: body.trim(),
          receivers: recipients,
        },
        draftId,
      );

      await uploadFiles(draftId);

      responseSend = await sendDraft(
        {
          header: subject.trim(),
          body: body.trim(),
          receivers: recipients,
          is_anonymous: isAnonymous,
        },
        draftId,
      );
    } else {
      responseSend = await sendEmail({
        header: subject.trim(),
        body: body.trim(),
        receivers: recipients,
        files: files.map((f: any) => f.file),
        is_anonymous: isAnonymous,
      });
    }

    if (responseSend && !responseSend.error) {
      clearComposerData();
      backToMail?.();
      toast.show("message_sent", "success");
    } else {
      setSending(false);
      const err = responseSend?.error || "";
      if (err.includes("recipient not found")) {
        toast.show("recipient_not_found", "error");
      } else if (
        err.includes("some recipients do not accept anonymous emails")
      ) {
        toast.show("anonymous_forbidden", "error");
      } else {
        toast.show("email_send_error", "error");
      }
    }
  };

  const handleCancel = () => {
    clearComposerData();
    setShowDraftConfirm(false);
    backToMail?.();
  };

  const handleSaveDraft = async () => {
    let savedDraftId: number | null = null;

    if (composerData.type === "draft") {
      const draftId = composerData.draftId;
      const response = await updateDraft(
        {
          header: subject.trim(),
          body: body.trim(),
          receivers: recipients,
        },
        draftId,
      );

      if (response) {
        savedDraftId = draftId;
      }
    } else {
      if (
        subject === "" &&
        body === "" &&
        recipients.length === 0 &&
        files.length === 0
      ) {
        backToMail?.();
        return;
      }
      const response = await createDraft({
        header: subject.trim(),
        body: body.trim(),
        receivers: recipients,
      });

      if (response) {
        savedDraftId = response.id;
      }
    }

    if (savedDraftId && files.length > 0) {
      await uploadFiles(savedDraftId);
    }

    if (savedDraftId) {
      clearComposerData();
      backToMail?.();
      toast.show(t("draft_saved"), "success");
    }

    setShowDraftConfirm(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles: File[] = Array.from(e.target.files || []);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (newFiles.length === 0) return;

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    const validFiles = newFiles.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        toast.show("file_too_large", "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const processedFiles = validFiles.map((file: File) => ({
      file: file,
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploaded: false,
    }));

    setFiles((prev) => [...processedFiles, ...prev]);
  };

  const handleFileButtonClick = () => {
    if (uploadingFiles) return;
    fileInputRef.current?.click();
  };

  const removeFile = async (fileId: number) => {
    const fileItem = files.find((f: any) => f.id === fileId);
    if (!fileItem) return;

    if (
      fileItem.uploaded &&
      fileItem.attachmentId &&
      composerData.type === "draft"
    ) {
      try {
        await deleteAttachments(composerData.draftId, [fileItem.attachmentId]);
      } catch (err) {
        console.error("Failed to delete attachment", err);
      }
    }

    setFiles((prev) => prev.filter((file: any) => file.id !== fileId));
  };

  const handleMobileCloseButton = () => {
    if (
      subject === "" &&
      body === "" &&
      recipients.length === 0 &&
      files.length === 0
    ) {
      handleCancel();
      return;
    }
    setShowDraftConfirm(true);
  };

  return (
    <div className="send-mail">
      {isMobile ? (
        sending ? (
          <div className="send-mail-mobile-buttons">
            <div className="close-button disabled"></div>
            <div className="sending-loader">
              <div className="spinner" />
            </div>
          </div>
        ) : (
          <div className="send-mail-mobile-buttons">
            <div
              className="close-button"
              onClick={handleMobileCloseButton}
            ></div>
            <div
              className={`send-button${buttonBlock ? " disabled" : ""}`}
              onClick={() => handleSubmit()}
            ></div>
          </div>
        )
      ) : null}
      <div className="send-mail-header">
        <span className="send-mail-header__text">{t("new_letter")}</span>
      </div>
      <form className="send-form" onSubmit={handleSubmit}>
        <div className="send-inputs">
          {isReply && composerData.replyingToAnonymous ? (
            <span className="input-container" data-name="anonymous">
              {t("to")}
              {"\t"}
              {t("anonymous")}
            </span>
          ) : (
            <InputEmail
              input_title={t("to")}
              placeholder={t("enter_email")}
              emails={recipients}
              onChange={(emails: string[], invalid: string[]) => {
                setRecipients(emails);
                setInvalidRecipients(invalid);
              }}
            />
          )}
          <Input
            type="text"
            placeholder={t("enter_subject")}
            input_title={t("subject")}
            name="theme"
            maxLength={255}
            value={subject}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSubject(e.target.value);
            }}
          />
        </div>
        {files.length > 0 ? (
          <HorizontalScroller className="files-list">
            {files.map((fileItem: any) => (
              <div key={fileItem.id} className="file-item">
                <div
                  className={`file-icon ${getIconByContentType(fileItem.type)}`}
                />
                <div className="file-info">
                  <span className="file-name">
                    {trimFileName(fileItem.name)}
                  </span>
                  <span className="file-size">
                    {formatFileSize(fileItem.size)}
                  </span>
                </div>
                <div
                  className={`file-remove-btn ${uploadingFiles ? "disabled" : ""}`}
                  onClick={() => removeFile(fileItem.id)}
                />
              </div>
            ))}
          </HorizontalScroller>
        ) : null}
        {isMobile && (
          <div className="anonymous-radio">
            <input
              id="anon-toggle"
              type="checkbox"
              name="radio-anonymous"
              checked={isAnonymous}
              onChange={() => setIsAnonymous((prev) => !prev)}
            />
            <label htmlFor="anon-toggle">{t("toggle_anon")}</label>
          </div>
        )}
        <Textarea
          readonly={false}
          value={body}
          onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
            setBody(e.target.value);
          }}
        />
      </form>
      <div className="send-down">
        <div className="send-tools">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            multiple
            onChange={handleFileChange}
            accept="*/*"
            disabled={uploadingFiles}
            title={t("add_attachment")}
          />
          <div
            className={`upload-attachments-button ${uploadingFiles ? "disabled" : ""}`}
            onClick={handleFileButtonClick}
          />
        </div>
        {!isMobile ? (
          sending ? (
            <div className="send-actions">
              <div className="sending-loader">
                <div className="spinner" />
                <span>{t("sending")}...</span>
              </div>
            </div>
          ) : (
            <div className="send-actions">
              <div className="anonymous-radio">
                <input
                  id="anon-toggle-desktop"
                  type="checkbox"
                  name="radio-anonymous"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous((prev) => !prev)}
                />
                <label htmlFor="anon-toggle-desktop">{t("toggle_anon")}</label>
              </div>
              <Button
                title={t("save")}
                name="save-mail"
                onClick={handleSaveDraft}
                block={sending}
              />
              <Button
                title={t("send")}
                name="send-mail"
                block={buttonBlock || sending}
                onClick={(event: any) => {
                  handleSubmit(event);
                }}
              />
            </div>
          )
        ) : null}
      </div>
      {showDraftConfirm && (
        <ConfirmationDialog
          text={t("confirm_save_draft")}
          cancelButtonTitle={"delete_draft"}
          confirmButtonTitle={"save_draft"}
          callbackCancel={handleCancel}
          callbackConfirm={handleSaveDraft}
          highlightCancel={false}
        />
      )}
    </div>
  );
}
