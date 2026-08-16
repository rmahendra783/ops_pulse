import { apiClient } from "../lib/api";
import { Ticket, TicketPriority, TicketStatus, TicketCategory } from "../types/ticket";

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export const ticketService = {
  getTickets: async (filters?: { status?: string; priority?: string }) => {
    const res = await apiClient.get<{ tickets: Ticket[] }>("/tickets", { params: filters });
    return res.data.tickets;
  },

  getTicket: async (id: number) => {
    const res = await apiClient.get<{ ticket: Ticket }>(`/tickets/${id}`);
    return res.data.ticket;
  },

  getSimilarTickets: async (id: number) => {
    const res = await apiClient.get<{ similar_tickets: Ticket[] }>(`/tickets/${id}/similar`);
    return res.data.similar_tickets;
  },

  createTicket: async (payload: CreateTicketPayload) => {
    const res = await apiClient.post<{ message: string; ticket: Ticket }>("/tickets", {
      ticket: payload,
    });
    return res.data.ticket;
  },

  updateTicketStatus: async (id: number, status: TicketStatus) => {
    const res = await apiClient.patch<{ message: string; ticket: Ticket }>(`/tickets/${id}`, {
      ticket: { status },
    });
    return res.data.ticket;
  },

  addComment: async (ticketId: number, body: string, internal: boolean = false) => {
    const res = await apiClient.post(`/tickets/${ticketId}/comments`, {
      comment: { body, internal },
    });
    return res.data.comment;
  },
};