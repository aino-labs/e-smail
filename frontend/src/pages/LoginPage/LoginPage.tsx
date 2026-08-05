import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { validation } from "../../utils/validation";
import { postDataLogin, getProfile, getCSRFToken } from "../../api/ApiAuth";
import "./LoginPage.scss";
import { TranslationKey, useTranslation } from "../../hooks/useTranslation";
import { useUserStore } from "../../store/useUserStore";
import { useAuthStore } from "../../store/useAuthStore";
import Footer from "../../widgets/Footer/Footer";

const SUFFIX = "@e-smail.ru";

export default function LoginPage() {
  const navigate = useNavigate();

  const { t } = useTranslation();
  const { setProfileData } = useUserStore();
  const { setAuthenticated } = useAuthStore();

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const validateField = (
    field: string,
    value: string,
    currentEmail: string,
    currentPassword: string,
  ) => {
    const data: any = {
      email: field === "email" ? value + SUFFIX : currentEmail + SUFFIX,
      password: field === "password" ? value : currentPassword,
    };

    const result = validation(data, t);

    if (!result.isValid) {
      const fieldError = result.errors.find((err: any) => err.field === field);
      if (fieldError) {
        return fieldError.message;
      }
    }
    return undefined;
  };

  const handleInputChange = (field: string, value: string) => {
    const targetEmail = field === "email" ? value : email;
    const targetPassword = field === "password" ? value : password;

    const error = validateField(field, value, targetEmail, targetPassword);

    if (field === "email") {
      setEmail(value);
    } else if (field === "password") {
      setPassword(value);
    } else {
      setErrors((prev) => ({
        ...prev,
        [field]: error || "",
      }));
    }
  };

  const validateAllFields = () => {
    const data = {
      email: email + SUFFIX,
      password: password,
    };

    const result = validation(data, t);
    const newErrors: any = {};

    if (!result.isValid) {
      result.errors.forEach((err: any) => {
        if (err.field && !newErrors[err.field]) {
          newErrors[err.field] = err.message;
        }
      });
    }

    setErrors(newErrors);
    return result.isValid;
  };

  const handleSubmit = async () => {
    const isValid = validateAllFields();

    if (!isValid) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await postDataLogin({
        email: email + SUFFIX,
        password: password,
      });

      if (response && response.isValid) {
        // 1. Fetch & save fresh session CSRF token to useAuthStore
        await getCSRFToken();

        // 2. Mark user as authenticated in store
        setAuthenticated(true);
        const data = await getProfile();
        setProfileData(data);
        navigate("/");
      } else if (response && !response.isValid) {
        const serverErrors: any = {};
        response.errors?.forEach((err: any) => {
          if (err.field && !serverErrors[err.field]) {
            serverErrors[err.field] = err.message;
          }
        });
        setErrors(serverErrors);
      }
    } catch {
      setErrors({ password: t("server_error"), email: " " });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-page__form-container">
          <div className="logo-container">
            <img src="../../assets/svg/Logo.svg" />
            <h1 className="logo__title">SMail</h1>
          </div>
          <h1 className="auth-form__subtitle">{t("auth_subtitle")}</h1>
          <h1 className="auth-form__title">{t("auth_title")}</h1>
          <form
            action=""
            className="auth-form"
            onSubmit={async (event: React.SubmitEvent<HTMLFormElement>) => {
              event.preventDefault();
              await handleSubmit();
            }}
          >
            <div className="auth-form__inputs">
              <Input
                placeholder={t("enter_email")}
                input_title={t("email")}
                name="email"
                suffix="@e-smail.ru"
                error={t(errors.email as TranslationKey)}
                value={email}
                onInput={(e: any) => {
                  const raw = e.target.value;
                  const atIndex = raw.indexOf("@");
                  const clean =
                    atIndex !== -1 ? raw.substring(0, atIndex) : raw;
                  handleInputChange("email", clean);
                }}
              />
              <Input
                type="password"
                placeholder={t("enter_password")}
                input_title={t("password")}
                name="password"
                error={t(errors.password as TranslationKey)}
                value={password}
                onInput={(e: any) => {
                  handleInputChange("password", e.target.value);
                }}
              />
            </div>
            <div className="auth-form__actions">
              <Button
                type="submit"
                title={t("enter")}
                name="button-login-for-login"
              />
              <Button
                title={t("register")}
                name="button-reg-for-login"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                  event.preventDefault();
                  navigate("/register");
                }}
              />
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
