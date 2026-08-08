import React from "react";
import { cn } from "../../utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const buttonItemVariants = cva(
  "h-12 px-6 rounded-[20px] text-[18px] border-0 cursor-pointer transition-all duration-100 flex flex-row items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-button-background text-primary-text hover:bg-button-hover-background active:bg-button-active-background",
        //secondary:
        sidebar:
          "bg-transparent text-muted-text w-full justify-start font-xs gap-3 hover:bg-muted-text/10 hover:font-medium",
      },
    },
    defaultVariants: {
      variant: "primary",
    },
  },
);

interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonItemVariants> {
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
    variant = "primary",
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
      className={cn(buttonItemVariants({ variant }), className)}
    >
      {Icon && (
        <Icon
          name="button icon"
          width={iconSize}
          height={iconSize}
          className={cn(
            "button-icon transition-transform duration-300",
            active && "rotate-180",
          )}
        />
      )}
      {children && <span>{children}</span>}
      {typeof count === "number" && count > 0 && (
        <span className="button-count">{count}</span>
      )}
    </button>
  );
};

export default Button;
