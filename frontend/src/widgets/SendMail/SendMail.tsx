import { useState, useRef, useMemo, useEffect } from "react";
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
import { AppStorage } from "../../store/AppStorage";
import { toast } from "../../store/toastStore";
import { createDraft, sendDraft, updateDraft } from "../../api/ApiDraft";
import {
  formatFileSize,
  getIconByContentType,
  trimFileName,
} from "../../utils/files";
import { useTranslation } from "../../hooks/useTranslation";

interface SendMailProps {
  actionData?: any;
  backToMail?: () => void;
}

export default function SendMail({ actionData, backToMail }: SendMailProps) {
  const { t, language } = useTranslation();

  const initialData = useMemo(() => {
    const draftData = AppStorage.getDraftData();

    let header = "";
    let body = "";
    let receivers: string[] = [];
    let draftId: number | null = null;

    if (actionData) {
      if (actionData.type === "reply") {
        header = actionData.subject || "";
        body = actionData.body || "";
        receivers = actionData.to ? [actionData.to] : [];
      } else if (actionData.type === "forward") {
        header = actionData.subject || "";
        body = actionData.body || "";
        receivers = [];
      }
    } else if (draftData) {
      header = draftData.header || "";
      body = draftData.body || "";
      receivers = draftData.receivers || [];
      draftId = draftData.id || null;
    }

    return { header, body, receivers, draftId };
  }, [actionData]);

  const [header, setHeader] = useState(initialData.header);
  const [body, setBody] = useState(initialData.body);
  const [receivers, setReceivers] = useState<string[]>(initialData.receivers);
  const [invalidReceivers, setInvalidReceivers] = useState<string[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [draftId, setDraftId] = useState<number | null>(initialData.draftId);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showDraftConfirm, setShowDraftConfirm] = useState(false);

  const [emailId] = useState<number | null>(
    () => AppStorage.emailReplyingId || null,
  );
  const [replyingToAnonymous] = useState<boolean>(
    () => !!AppStorage.replyingToAnonymous,
  );

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 769;

  const isFormValid =
    body.trim().length > 0 &&
    (receivers.length > 0 || replyingToAnonymous) &&
    invalidReceivers.length === 0;

  const buttonBlock = !isFormValid;

  useEffect(() => {
    if (!draftId) return;

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

        setFiles([...files, ...draftFiles]);
      } catch (err) {
        console.error("Failed to fetch draft attachments", err);
      }
    };

    fetchDraftAttachments();
  }, [draftId]);

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

  const handleSubmit = async (e?: React.SubmitEvent) => {
    if (e) e.preventDefault();
    setSending(true);

    let responseSend;

    if (replyingToAnonymous && emailId !== null) {
      responseSend = await replyToEmail(emailId, {
        header: header.trim(),
        body: body.trim(),
        files: files.map((f: any) => f.file),
        is_anonymous: isAnonymous,
      });
    } else if (draftId) {
      await updateDraft(
        {
          header: header.trim(),
          body: body.trim(),
          receivers: receivers,
        },
        draftId,
      );

      uploadFiles(draftId);
      responseSend = await sendDraft(
        {
          header: header.trim(),
          body: body.trim(),
          receivers: receivers,
          is_anonymous: isAnonymous || replyingToAnonymous,
        },
        draftId,
      );
    } else {
      responseSend = await sendEmail({
        header: header.trim(),
        body: body.trim(),
        receivers: receivers,
        files: files.map((f: any) => f.file),
        is_anonymous: isAnonymous,
      });
    }

    if (!responseSend.error) {
      AppStorage.clearMailActionData();
      backToMail?.();
      toast.show("message_sent", "success");
    } else {
      setSending(false);
      if (responseSend.error.includes("recipient not found")) {
        toast.show("recipient_not_found", "error");
      } else if (
        responseSend.error.includes(
          "some recipients do not accept anonymous emails",
        )
      ) {
        toast.show("anonymous_forbidden", "error");
      } else {
        toast.show("email_send_error", "error");
      }
    }
  };

  const handleCancel = () => {
    AppStorage.clearMailActionData();
    setShowDraftConfirm(false);
    backToMail?.();
  };

  const handleSaveDraft = async () => {
    let savedDraftId: number | null = null;

    if (draftId) {
      const response = await updateDraft(
        {
          header: header.trim(),
          body: body.trim(),
          receivers: receivers,
        },
        draftId,
      );

      if (response) {
        savedDraftId = draftId;
      }
    } else {
      if (
        header === "" &&
        body === "" &&
        receivers.length === 0 &&
        files.length === 0
      ) {
        backToMail?.();
        return;
      }
      const response = await createDraft({
        header: header.trim(),
        body: body.trim(),
        receivers: receivers,
      });

      if (response) {
        savedDraftId = response.id;
      }
    }

    if (savedDraftId && files.length > 0) {
      await uploadFiles(savedDraftId);
    }

    if (savedDraftId) {
      AppStorage.clearMailActionData();
      backToMail?.();
      toast.show("draft_saved", "error");
    }

    setShowDraftConfirm(false);
  };

  const handleFileChange = (e: any) => {
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

    if (fileItem.uploaded && fileItem.attachmentId && draftId) {
      try {
        await deleteAttachments(draftId, [fileItem.attachmentId]);
      } catch (err) {
        console.error("Failed to delete attachment", err);
      }
    }

    setFiles((prev) => prev.filter((file: any) => file.id !== fileId));
  };

  const handleMobileCloseButton = () => {
    if (
      header === "" &&
      body === "" &&
      receivers.length === 0 &&
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
      <form action="" className="send-form">
        <div className="send-inputs">
          {replyingToAnonymous ? (
            <span className="input-container" data-name="anonymous">
              {t("to")}
              {"\t"}
              {t("anonymous")}
            </span>
          ) : (
            <InputEmail
              input_title={t("to")}
              placeholder={t("enter_email")}
              emails={receivers}
              onChange={(emails: string[], invalid: string[]) => {
                setReceivers(emails);
                setInvalidReceivers(invalid);
              }}
            />
          )}
          <Input
            type="text"
            placeholder={t("enter_subject")}
            input_title={t("subject")}
            name="theme"
            maxLength={255}
            value={header}
            onInput={(e: React.ChangeEvent<HTMLInputElement>) =>
              setHeader(e.target.value)
            }
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
          onInput={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setBody(e.target.value)
          }
        />
      </form>
      <div className="send-down">
        <div className="send-tools">
          <input
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
                  id="anon-toggle"
                  type="checkbox"
                  name="radio-anonymous"
                  checked={isAnonymous}
                  onChange={() => setIsAnonymous((prev) => !prev)}
                />
                <label htmlFor="anon-toggle">{t("toggle_anon")}</label>
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
