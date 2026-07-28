import { useState } from "react";
import Button from "../../components/Button/Button";
import Input from "../../components/Input/Input";
import Select from "../../components/Select/Select";
import Textarea from "../../components/Textarea/Textarea";
import { sendSupportTicket } from "../../api/ApiSupport";
import "./SupportPage.scss";

const ticketCategories = [
  { value: "bug", label: "Ошибка" },
  { value: "proposal", label: "Предложение" },
  { value: "complaint", label: "Жалоба" },
  { value: "other", label: "Другое" },
];

export default function SupportPage() {
  const [category, setCategory] = useState({ value: "", label: "" });
  const [problem, setProblem] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleCategoryChange = (value: any, label: any) => {
    setCategory({ value, label });
  };

  const handleProblemChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProblem(event.target.value);
  };

  const handleDescriptionChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    setDescription(event.target.value);
  };

  const handleSubmit = async () => {
    const payload = {
      theme: category.value,
      header: problem,
      quesion_text: description,
      timestamp: new Date().toISOString(),
    };

    try {
      await sendSupportTicket(payload);

      setCategory({ value: "", label: "" });
      setProblem("");
      setDescription("");

      const url = window.location.origin;
      window.parent.postMessage({ action: "closeSupportModal" }, url);
    } catch (error) {
      console.error("Failed to submit ticket:", error);
    }
  };

  return (
    <div className="support-page-container">
      <h1 className="support-page__title">Расскажите о проблеме</h1>
      <span className="support-page__subtitle">
        С чем связано ваше обращение?
      </span>
      <Select
        id="category"
        options={ticketCategories}
        placeholder="Выберите категорию"
        value={category.value}
        onChange={handleCategoryChange}
      />
      <Input
        input_title="Что за проблема?"
        placeholder="Краткое описание проблемы"
        value={problem}
        onInput={handleProblemChange}
      />
      <Textarea
        className="support-textarea"
        inputTitle="Подробное описание проблемы"
        placeholder="Опишите проблему максимально подробно"
        value={description}
        onInput={handleDescriptionChange}
      />
      <Button title="Отправить" onClick={handleSubmit} />
    </div>
  );
}
