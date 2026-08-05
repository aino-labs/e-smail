import { useState } from "react";
import "./UploadAvatar.scss";
import { uploadAvatar } from "../../api/ApiAuth";
import { useUserStore } from "../../store/useUserStore";
import { useTranslation } from "../../hooks/useTranslation";

interface UploadAvatarProps {
  image?: string;
  onAvatarUpdate?: any;
}

export default function UploadAvatar({
  image = "../../assets/svg/Avatar.svg",
  onAvatarUpdate,
}: UploadAvatarProps) {
  const { t } = useTranslation();
  const { setImagePath, getAvatarUrl } = useUserStore();
  const [isLoading, setIsLoading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = (event: any) => {
      if (typeof event.target?.result === "string") {
        setLocalPreview(event.target.result);
      }
    };
    reader.readAsDataURL(file);

    try {
      const imagePath = await uploadAvatar(file);
      if (imagePath) {
        setImagePath(imagePath);
        setLocalPreview(null);

        onAvatarUpdate?.();
      }
    } catch (error) {
      console.error("Avatar upload failed: ", error);
    } finally {
      setIsLoading(false);
    }
  };

  const src =
    localPreview || image || getAvatarUrl() || "../../assets/svg/Avatar.svg";

  return (
    <div className="upload">
      <div className="upload__preview">
        <img id="upload-image" src={src} alt="avatar" />
        {isLoading && (
          <div className="upload__overlay">
            <div className="upload__spinner"></div>
          </div>
        )}
      </div>
      <input
        id="file-input"
        type="file"
        name="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />
      <label htmlFor="file-input">{t("change_avatar")}</label>
    </div>
  );
}
