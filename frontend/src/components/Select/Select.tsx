import { useState, useEffect } from "react";
import "./Select.scss";

const MONTHS_LIST: Record<number, number> = {
  1: 31, // Январь
  2: 28, // Февраль
  3: 31, // Март
  4: 30, // Апрель
  5: 31, // Май
  6: 30, // Июнь
  7: 31, // Июль
  8: 31, // Август
  9: 30, // Сентябрь
  10: 31, // Октябрь
  11: 30, // Ноябрь
  12: 31, // Декабрь
};

const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

const getDaysInMonth = (monthStr: string, year: number) => {
  const month = parseInt(monthStr);
  if (!month) return 31;
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 != 0) || year % 400 == 0;
    return isLeapYear ? 29 : 28;
  }

  return MONTHS_LIST[month] || 31;
};

interface SelectProps {
  id?: string;
  name: string;
  value?: string;
  label?: string;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  selectedMonth?: string;
  selectedYear?: number;
  onChange?: (value: string, label: string) => void;
}

export default function Select({
  name,
  id,
  value = "",
  label = "",
  placeholder,
  options,
  selectedMonth = "Январь",
  selectedYear = new Date().getFullYear(),
  onChange,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(label || value);

  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false);
    document.addEventListener("click", handleClickOutside);

    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleDropDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const selectOption = (val: string, lbl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setSelectedLabel(lbl);
    if (onChange) onChange(val, lbl);
  };

  const getOptions = () => {
    if (options && options.length > 0) return options;

    if (name === "day") {
      const dayInMonth = getDaysInMonth(selectedMonth, selectedYear);
      return Array.from({ length: dayInMonth }, (_, i) => ({
        value: String(i + 1),
        label: String(i + 1),
      }));
    }

    if (name === "month") {
      return MONTH_NAMES.map((month, i) => ({
        value: String(i + 1),
        label: month,
      }));
    }

    if (name === "year") {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 100 }, (_, i) => ({
        value: String(currentYear - i),
        label: String(currentYear - i),
      }));
    }

    return [];
  };

  const computedOptions = getOptions();

  return (
    <div className="select" id={id} onClick={toggleDropDown}>
      <div className="select__value">{selectedLabel || placeholder}</div>
      <div className={`select__toggle ${isOpen ? "open" : ""}`}>
        <div className="arrow-down" />
      </div>
      {isOpen && (
        <div className="select__dropdown shadow">
          {computedOptions.map((option: any) => (
            <div
              className="select__value"
              key={option.value}
              onClick={(e: any) => selectOption(option.value, option.label, e)}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
