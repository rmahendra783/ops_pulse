import { User } from "../context/AuthContext";

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketCategory = "general" | "technical" | "billing" | "feature_request";
export type SlaStatus = "on_track" | "warning" | "breached";

export interface Comment {
  id: number;
  body: string;
  internal: boolean;
  created_at: string;
  user: User;
}

export interface AuditLog {
  id: number;
  action: string;
  metadata: Record<string, any>;
  created_at: string;
  user: User;
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  sla_status?: SlaStatus;
  sla_due_at: string;
  breached_at?: string | null;
  ai_summary?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: User;
  assigned_to?: User;
  comments?: Comment[];
  audit_logs?: AuditLog[];
}