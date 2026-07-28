import "./Textarea.scss";

interface TextareaProps {
  className?: string;
  readonly?: boolean;
  value?: string;
  placeholder?: string;
  inputTitle?: string;
  onInput?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export default function Textarea({
  className = "",
  readonly = false,
  value = "",
  placeholder = "",
  inputTitle = "",
  onInput,
}: TextareaProps) {
  return (
    <div className="text-area">
      <span className="input__title">{inputTitle}</span>
      <textarea
        className={className}
        readOnly={readonly}
        value={value || ""}
        placeholder={placeholder}
        onChange={onInput}
      />
    </div>
  );
}
