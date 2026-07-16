import React, { useState } from "react";
import "./Input.scss";

interface InputProps {
  // Appearance
  className?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  input_title?: string; // label above the input
  svg?: string; // icon inside the input
  suffix?: string; // text after the input (e.g., "@domain.com")

  // Behaviour
  type?: string; // "text", "password", "checkbox", "radio", etc.
  value?: string; // controlled value (used for text/password)
  checked?: boolean; // controlled checked (for checkbox/radio)
  readonly?: boolean;
  maxLength?: number; // default was 100

  // Events
  onInput?: (e: React.ChangeEvent<HTMLInputElement>) => void; // Standard React type for onInput
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;

  // Feedback
  error?: string | undefined;
  success?: boolean;
}

const Input: React.FC<InputProps> = (props) => {
  const {
    className,
    id,
    name,
    placeholder,
    input_title,
    svg,
    suffix,
    type = "text",
    value,
    checked,
    readonly = false,
    maxLength = 100,
    onInput,
    onChange,
    error,
    success,
  } = props;

  const [showPassword, setShowPassword] = useState(false);

  const hasError = !!error;
  const hasSuccess = !!success;
  const isPassword = type === "password";
  const isCheckbox = type === "checkbox";
  const isRadio = type === "radio";

  const inputType = isPassword && showPassword ? "text" : type;

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className="input-container" data-input-name={name}>
      <span className="input__title">{input_title}</span>
      <div
        className={`input-form ${hasError ? "error" : ""} ${hasSuccess ? "success" : ""} ${
          suffix ? "has-suffix" : ""
        }`}
      >
        {svg && <img src={svg} alt="" />}
        <input
          type={inputType}
          className={className}
          id={id}
          name={name}
          placeholder={placeholder}
          onChange={onChange}
          onInput={onInput ? (e: any) => onInput(e) : undefined}
          readOnly={readonly || false}
          maxLength={maxLength || 100}
          value={!isCheckbox && !isRadio ? value || "" : undefined}
        />
        {isPassword && (
          <div
            className={`password-toggle ${!showPassword ? "off" : ""}`}
            onClick={togglePasswordVisibility}
          />
        )}
        {suffix && (
          <span className="input-suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>

      <div className="auth-input__error" data-name={name}>
        {error}
      </div>
    </div>
  );
};

export default Input;
