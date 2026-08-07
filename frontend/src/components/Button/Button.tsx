import React from "react";
import { cn } from "../../utils/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconSize?: number | string;
  count?: number;
  isSelect?: boolean;
  active?: boolean;
}

const Button: React.FC<ButtonProps> = (props: ButtonProps) => {
  const {
    icon: Icon,
    children,
    className,
    iconSize = "20",
    title,
    count,
    disabled,
    isSelect,
    active,
    type = "button",
    name,
    onClick,
  } = props;

  return (
    <button
      disabled={disabled}
      data-is-select={isSelect || undefined}
      data-active={active || undefined}
      type={type}
      name={name}
      title={title}
      onClick={onClick}
      className={cn(
        "h-12 px-7 rounded-[20px] text-[18px] border-0 cursor-pointer transition-all duration-100 flex items-center justify-center gap-2",
        "bg-button-background text-primary-text",
        "hover:bg-button-hover-background active:bg-button-active-background",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      )}
    >
      {Icon && (
        <Icon width={iconSize} height={iconSize} className="button-icon" />
      )}
      {children && <span>{children}</span>}
      {typeof count === "number" && count > 0 && (
        <span className="button-count">{count}</span>
      )}
    </button>
  );
};

export default Button;
