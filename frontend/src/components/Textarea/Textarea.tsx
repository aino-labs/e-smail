import "./Textarea.scss";

interface TextareaProps {
  className?: string;
  readonly?: boolean;
  value?: string;
  placeholder?: string;
  inputTitle?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Textarea({
  className = "",
  readonly = false,
  value = "",
  placeholder = "",
  inputTitle = "",
  onChange,
}: TextareaProps) {
  return (
    <div className="text-area">
      <span className="input__title">{inputTitle}</span>
      <textarea
        className={className}
        readOnly={readonly}
        value={value || ""}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}
