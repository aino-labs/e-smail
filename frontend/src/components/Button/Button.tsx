import React from "react";
import "./Button.scss";

interface ButtonProps {
  svg?: string; // URL of the icon
  className?: string; // additional CSS class
  size?: string | number; // icon size (default "20")
  title?: string; // button text (used inside a <span>)
  count?: number; // badge count (rendered if not 0)
  block?: boolean; // if true, disables the button
  isSelect?: boolean; // sets data-is-select attribute
  active?: boolean; // sets data-active to "true" or "false"
  type?: "button" | "submit" | "reset"; // button type
  name?: string; // HTML name attribute
  help?: string; // tooltip (HTML title attribute)
  onClick?: (_event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = (props) => {
  const {
    svg,
    className,
    size = "20",
    title,
    count,
    block,
    isSelect,
    active,
    type = "button",
    name,
    help,
    onClick,
  } = props;

  return (
    <button
      className={className}
      disabled={block}
      data-is-select={isSelect}
      data-active={active ? "true" : "false"}
      type={type}
      name={name}
      title={help || ""}
      onClick={onClick}
    >
      {svg && <img src={svg} width={size} height={size} alt="" />}
      <span>{title || ""}</span>
      {count !== 0 && <span className="button-count">{count}</span>}
    </button>
  );
};

export default Button;
