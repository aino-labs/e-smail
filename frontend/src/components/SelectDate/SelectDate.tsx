import { useState, useEffect } from "react";
import "./SelectDate.scss";
import Select from "../Select/Select";
import { AppStorage } from "../../store/AppStorage";

const daysInMonth = (month: number, year: number): number => {
  return new Date(year, month, 0).getDate();
};

const isValidDay = (day: number, month: number, year: number): boolean => {
  if (isNaN(day) || isNaN(month) || isNaN(year)) return false;
  const max = daysInMonth(month, year);
  return day >= 1 && day <= max;
};

const t = (key: string): string => {
  return AppStorage.t(key);
};

interface DateObject {
  day: string;
  month: string;
  year: string;
}

interface SelectDateProps {
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  onChange?: (date: DateObject) => void;
}

export default function SelectDate({
  birthDay = "",
  birthMonth = "",
  birthYear = "",
  onChange,
}: SelectDateProps) {
  const [day, setDay] = useState(birthDay);
  const [month, setMonth] = useState(birthMonth);
  const [year, setYear] = useState(birthYear);

  const handleDayChange = (value: string) => {
    setDay(value);
    if (onChange) {
      onChange({ day: value, month, year });
    }
  };

  const handleMonthChange = (value: string) => {
    const newMonth = value;
    const currentDay = day;

    let newDay = currentDay;
    if (currentDay && newMonth && year) {
      const dayNum = parseInt(currentDay, 10);
      const monthNum = parseInt(newMonth, 10);
      const yearNum = parseInt(year, 10);
      if (!isValidDay(dayNum, monthNum, yearNum)) {
        newDay = "";
      }
    }

    setDay(newDay);
    setMonth(newMonth);
    if (onChange) {
      onChange({ day: newDay, month: newMonth, year });
    }
  };

  const handleYearChange = (value: string) => {
    const newYear = value;
    let newDay = day;

    if (day && month && newYear) {
      const dayNum = parseInt(day, 10);
      const monthNum = parseInt(month, 10);
      const yearNum = parseInt(newYear, 10);
      if (!isValidDay(dayNum, monthNum, yearNum)) {
        newDay = "";
      }
    }

    setDay(newDay);
    setYear(newYear);
    if (onChange) {
      onChange({ day: newDay, month, year: newYear });
    }
  };

  return (
    <div className="select-date">
      <span>{t("date_of_birth")}</span>
      <div className="select-container">
        <Select
          name="day"
          value={day}
          placeholder={t("day")}
          selectedMonth={month}
          selectedYear={year ? parseInt(year, 10) : undefined}
          onChange={handleDayChange}
        />
        <Select
          name="month"
          value={month}
          placeholder={t("month")}
          onChange={handleMonthChange}
        />
        <Select
          name="year"
          value={year}
          placeholder={t("year")}
          onChange={handleYearChange}
        />
      </div>
    </div>
  );
}
