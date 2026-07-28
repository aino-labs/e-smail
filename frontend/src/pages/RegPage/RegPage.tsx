import { useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import { validation } from "../../utils/validation";
import { postDataReg, getProfile } from "../../api/ApiAuth";
import "./RegPage.scss";
import { AppStorage } from "../../store/AppStorage";
import { useTranslation } from "../../hooks/useTranslation";

interface RegPageProps {
  navigate: (path: string) => void;
}

export default function RegPage({ navigate }: RegPageProps) {
  const { t, language } = useTranslation();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<Record<string, string>>({
    name: "",
    surname: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleInputChange = (field: string, value: string) => {
    const nextFormData = {
      ...formData,
      [field]: value,
    };

    const error = validateField(field, nextFormData);

    setFormData(nextFormData);
    setErrors((prev) => ({
      ...prev,
      [field]: error,
    }));
  };

  const validateField = (
    field: string,
    currentFormData: Record<string, string>,
  ) => {
    const suffix = "@e-smail.ru";
    const data: any = {
      ...currentFormData,
      email: currentFormData.email ? currentFormData.email + suffix : "",
    };

    const result = validation(data, t);

    if (!result.isValid) {
      const fieldError = result.errors.find((err: any) => err.field === field);
      if (fieldError) {
        return fieldError.message;
      }
    }
    return "";
  };

  const validateStep1 = () => {
    const data = {
      name: formData.name,
      surname: formData.surname,
    };

    const result = validation(data, t);
    const newErrors: any = {};

    if (!result.isValid) {
      result.errors.forEach((err: any) => {
        if (err.field) {
          newErrors[err.field] = err.message;
        }
      });
    }

    setErrors(newErrors);
    return result.isValid;
  };

  const validateStep2 = () => {
    const fullEmail = formData.email + "@e-smail.ru";
    const data = {
      email: fullEmail,
      password: formData.password,
    };

    const result = validation(data, t);
    const newErrors: any = {};

    if (!result.isValid) {
      result.errors.forEach((err: any) => {
        if (err.field) {
          newErrors[err.field] = err.message;
        }
      });
    }

    setErrors(newErrors);
    return result.isValid;
  };

  const handleNextStep = (event: React.MouseEvent) => {
    event.preventDefault();

    const isValid = validateStep1();

    if (isValid) {
      setStep(2);
    }
  };

  const handleBackStep = (event: React.MouseEvent) => {
    event.preventDefault();
    setStep(1);
  };

  const handleRegister = async (event: React.MouseEvent) => {
    event.preventDefault();

    const isValid = validateStep2();

    if (!isValid) {
      return;
    }

    try {
      const payload = {
        ...formData,
        email: formData.email + "@e-smail.ru",
      };
      const response = await postDataReg(payload);

      if (response && response.isValid) {
        const data = await getProfile();
        AppStorage.setProfileData(data);
        navigate("/");
      } else if (response && !response.isValid) {
        const serverErrors: any = {};
        response.errors?.forEach((err: any) => {
          if (err.field) {
            serverErrors[err.field] = err.message;
          }
        });
        setErrors(serverErrors);
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        email: "Ошибка соединения",
        password: "Ошибка соединения",
      });
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
          <h1 className="auth-form__title">{t("auth_title2")}</h1>
          <form action="" className="auth-form">
            <div className="auth-form__inputs">
              {step === 1 && (
                <div className="auth-form__inputs">
                  <Input
                    key="name-input"
                    type="text"
                    placeholder={t("enter_name")}
                    input_title={t("name")}
                    name="name"
                    error={errors.name}
                    value={formData.name}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleInputChange("name", e.target.value);
                    }}
                  />
                  <Input
                    key="surname-input"
                    type="text"
                    placeholder={t("enter_surname")}
                    input_title={t("surname")}
                    name="surname"
                    error={errors.surname}
                    value={formData.surname}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleInputChange("surname", e.target.value);
                    }}
                  />
                </div>
              )}
              {step === 2 && (
                <div className="auth-form__inputs">
                  <Input
                    type="email"
                    placeholder={t("enter_email")}
                    input_title={t("email")}
                    name="email"
                    suffix="@e-smail.ru"
                    error={errors.email}
                    value={formData.email}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                    error={errors.password}
                    value={formData.password}
                    onInput={(e: React.ChangeEvent<HTMLInputElement>) => {
                      handleInputChange("password", e.target.value);
                    }}
                  />
                </div>
              )}
            </div>
            <div className="auth-form__actions">
              {step === 1 && (
                <div className="auth-form__actions">
                  <Button
                    title={t("continue")}
                    name="button-reg-for-reg"
                    onClick={handleNextStep}
                  />
                  <Button
                    title={t("enter")}
                    name="button-login-for-reg"
                    onClick={(e) => {
                      e.preventDefault();
                      navigate("/login");
                    }}
                  />
                </div>
              )}
              {step === 2 && (
                <div className="auth-form__actions">
                  <Button
                    title={t("register")}
                    name="button-reg-for-reg"
                    onClick={handleRegister}
                  />
                  <Button
                    title={t("back")}
                    name="button-login-for-reg"
                    onClick={handleBackStep}
                  />
                </div>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
