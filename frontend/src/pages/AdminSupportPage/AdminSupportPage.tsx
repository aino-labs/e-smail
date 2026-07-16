import { useState, useEffect, useCallback, useMemo } from "react";
import "./AdminSupportPage.scss";
import Button from "../../components/Button/Button";
import Textarea from "../../components/Textarea/Textarea";
import {
  getAdminTickets,
  getMessages,
  answerTicket,
  updateTicketStatus,
} from "../../api/ApiSupport";

interface AdminSupportPageProps {
  navigate: (path: string) => void;
}

export default function AdminSupportPage({ navigate }: AdminSupportPageProps) {
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInputText, setChatInputText] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortStatus, setSortStatus] = useState<string>("all");

  const fetchTicketMessages = useCallback(async (ticketId: number) => {
    try {
      const messages = await getMessages(ticketId);
      setChatMessages(messages);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
    }
  }, []);

  useEffect(() => {
    let pollingInterval: any = null;

    const fetchSupportTickets = async () => {
      const tickets = await getAdminTickets();
      setSupportTickets(tickets);
    };

    const startPolling = () => {
      pollingInterval = setInterval(() => {
        fetchSupportTickets();
        if (selectedTicketId) {
          fetchTicketMessages(selectedTicketId);
        }
      }, 5000);
    };

    const stopPolling = () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
      }
    };

    startPolling();

    return stopPolling;
  }, [selectedTicketId, fetchTicketMessages]);

  const handleChatInputChange = (e: any) => {
    setChatInputText(e.target.value);
  };

  const handleSelectTicket = (ticketId: number) => {
    setSelectedTicketId(ticketId);
    fetchTicketMessages(ticketId);
  };

  const handleSendMessage = async () => {
    if (!selectedTicketId) return;
    const resp = await answerTicket(selectedTicketId, chatInputText);
    if (resp) {
      setChatInputText("");
      setChatMessages((prev) => [...prev, resp]);
    }
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
    setSelectedTicketId(null);
    setChatMessages([]);
  };

  const handleSortChange = (status: string) => {
    setSortStatus(status);
    setSelectedTicketId(null);
    setChatMessages([]);
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicketId) return;

    try {
      await updateTicketStatus(selectedTicketId, newStatus);

      const updatedTickets = supportTickets.map((t: any) => {
        if (t.ticket_id === selectedTicketId) {
          return { ...t, status: newStatus };
        }
        return t;
      });
      setSupportTickets(updatedTickets);
    } catch (error) {
      console.error("Failed to update ticket status:", error);
    }
  };

  const getTicketStatus = (ticket: any) => {
    const status = ticket.status;
    if (status === "in_progress") return "pending";
    return status;
  };

  const filteredSortedTickets = useMemo(() => {
    let filtered = supportTickets;

    if (filterCategory !== "all") {
      filtered = filtered.filter((t: any) => t.theme === filterCategory);
    }

    if (sortStatus !== "all") {
      const priority = sortStatus;
      filtered = [...filtered].sort((a: any, b: any) => {
        if (a.status === priority && b.status !== priority) return -1;
        if (a.status !== priority && b.status === priority) return 1;
        return 0;
      });
    } else {
      const statusOrder: Record<string, number> = {
        open: 0,
        pending: 1,
        closed: 2,
      };
      filtered = [...filtered].sort(
        (a: any, b: any) =>
          (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3),
      );
    }
    return filtered;
  }, [supportTickets, filterCategory, sortStatus]);

  const selectedTicket = supportTickets.find(
    (t: any) => t.ticket_id === selectedTicketId,
  );

  return (
    <div className="admin-support-page">
      <div className="support-tickets-panel">
        <div className="support-tickets-header">
          <h2>Поддержка (Админ)</h2>
        </div>

        <div className="admin-filter-row">
          <div className="filter-group">
            <label>Категория</label>
            <select
              value={filterCategory}
              onChange={(e: any) => handleFilterChange(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="bug">Баг</option>
              <option value="proposal">Предложение</option>
              <option value="complaint">Жалоба</option>
              <option value="other">Другое</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Сорт. по статусу</label>
            <select
              value={sortStatus}
              onChange={(e: any) => handleSortChange(e.target.value)}
            >
              <option value="all">Все</option>
              <option value="open">Открытые</option>
              <option value="pending">Обработка</option>
              <option value="closed">Закрытые</option>
            </select>
          </div>
        </div>

        <ul className="tickets-list">
          {filteredSortedTickets.map((ticket: any) => (
            <li
              key={ticket.id}
              className={`ticket-item ${selectedTicketId === ticket.id ? "active" : ""}`}
              onClick={() => handleSelectTicket(ticket.ticket_id)}
            >
              <div className="ticket-subject">{ticket.header}</div>
              <div className="ticket-meta">
                <span
                  className="ticket-status"
                  data-status={getTicketStatus(ticket)}
                >
                  {getTicketStatus(ticket)}
                </span>
                <span className="ticket-category" data-category={ticket.theme}>
                  {ticket.theme}
                </span>
              </div>
              <div className="ticket-preview">{ticket.lastMessagePreview}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="support-chat-panel">
        {!selectedTicketId ? (
          <div className="chat-empty">Выберите тикет для просмотра</div>
        ) : (
          <>
            <div className="admin-chat-bar">
              <div className="status-control">
                <label>Статус:</label>
                <select
                  value={selectedTicket?.status || ""}
                  onChange={(e: any) => handleStatusChange(e.target.value)}
                >
                  <option value="open">Открыт</option>
                  <option value="pending">В обработке</option>
                  <option value="closed">Закрыт</option>
                </select>
              </div>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={`message ${msg.is_admin ? "admin" : "user"}`}
                >
                  <div className="message-bubble">
                    <div className="message-text">{msg.text}</div>
                    {/*<div className="message-time">
												{new Date(msg.timestamp).toLocaleTimeString()}
											</div>*/}
                  </div>
                </div>
              ))}
            </div>
            <div className="chat-input-area">
              <Textarea
                className="chat-input"
                placeholder="Ответить как администратор..."
                value={chatInputText}
                onInput={handleChatInputChange}
              />
              <Button
                title="Send"
                name="send-message"
                onClick={handleSendMessage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
