import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../utils/cn";
import { cva, type VariantProps } from "class-variance-authority";

const sidebarItemVariants = cva(
  "flex items-center gap-3 w-full px-6 py-2.5 rounded-[20px] text-md transition-all duration-150 select-none no-underline font-medium text-tertiary-text",
  {
    variants: {
      variant: {
        regular:
          "bg-transparent font-sm hover:bg-accent/20 hover:font-semibold",
        highlight:
          "bg-accent-2 text-primary-text! hover:bg-button-hover-background font-semibold",
        muted:
          "text-[var(--muted-text)] opacity-70 hover:opacity-100 hover:bg-white/5 hover:text-[var(--tertiary-text)]",
      },
      isActive: {
        true: "bg-accent/7.5 font-semibold",
        false: "",
      },
      nestedLevel: {
        "0": "",
        "1": "pl-12",
      },
    },
    compoundVariants: [
      {
        variant: "regular",
        isActive: true,
        className: "bg-accent/15",
      },
    ],
    defaultVariants: {
      variant: "regular",
      isActive: false,
      nestedLevel: "0",
    },
  },
);

interface SidebarItemProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof sidebarItemVariants> {
  to: string;
  label: string;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
  iconSize?: number | string;
  badge?: number | string;
  isCollapsed?: boolean;
}

export default function SidebarItem({
  to,
  label,
  icon: Icon,
  iconSize,
  badge,
  isActive,
  nestedLevel = "0",
  className,
  variant = "regular",
  isCollapsed = false,
}: SidebarItemProps) {
  if (isCollapsed) return null;

  return (
    <NavLink
      to={to}
      className={cn(
        sidebarItemVariants({ variant, isActive, nestedLevel }),
        className,
      )}
      title={!isCollapsed ? label : undefined}
    >
      {Icon && <Icon width={iconSize} height={iconSize} className="shrink-0" />}
      <span className="truncate">{label}</span>
      {badge !== undefined && (
        <span className="px-2 py-0.5 text-xs rounded-full bg-transparent text-tertiary-text ml-auto!">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
