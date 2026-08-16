import { apiClient } from "../lib/api";
import { Ticket, TicketPriority, TicketStatus, TicketCategory } from "../types/ticket";

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority: TicketPriority;
  category: TicketCategory;
}

export const ticketService = {
  getTickets: async (filters?: { status?: string; priority?: string }): Promise<Ticket[]> => {
    const res = await apiClient.get<any>("/tickets", { params: filters });
    if (res.data && Array.isArray(res.data.tickets)) return res.data.tickets;
    if (Array.isArray(res.data)) return res.data;
    return [];
  },

  getTicket: async (id: number): Promise<Ticket> => {
    const res = await apiClient.get<any>(`/tickets/${id}`);
    return res.data?.ticket || res.data;
  },

  getSimilarTickets: async (id: number): Promise<Ticket[]> => {
    const res = await apiClient.get<any>(`/tickets/${id}/similar`);
    if (res.data && Array.isArray(res.data.similar_tickets)) return res.data.similar_tickets;
    if (Array.isArray(res.data)) return res.data;
    return [];
  },

  createTicket: async (payload: CreateTicketPayload): Promise<Ticket> => {
    const res = await apiClient.post<any>("/tickets", {
      ticket: payload,
    });
    return res.data?.ticket || res.data;
  },

  updateTicketStatus: async (id: number, status: TicketStatus): Promise<Ticket> => {
    const res = await apiClient.patch<any>(`/tickets/${id}`, {
      ticket: { status },
    });
    return res.data?.ticket || res.data;
  },

  addComment: async (ticketId: number, body: string, internal: boolean = false) => {
    const res = await apiClient.post<any>(`/tickets/${ticketId}/comments`, {
      comment: { body, internal },
    });
    return res.data?.comment || res.data;
  },
};