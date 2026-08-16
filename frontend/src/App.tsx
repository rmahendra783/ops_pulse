import { useState, useEffect, useMemo, useRef } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ticketService } from "./services/ticketService";
import { Ticket, TicketStatus, TicketPriority, TicketCategory } from "./types/ticket";
import { getCableConsumer } from "./lib/cable";
import {
  ShieldCheck,
  LogOut,
  Building2,
  Plus,
  Clock,
  MessageSquare,
  Activity,
  Send,
  Filter,
  Layers,
  Inbox,
  X,
  Sparkles,
  GitFork,
  AlertTriangle,
  Flame,
  Radio
} from "lucide-react";

// ==========================================
// 1. Ticket Workspace (Responsive Viewport)
// ==========================================
function TicketOperationsWorkspace() {
  const { user, logout } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [similarTickets, setSimilarTickets] = useState<Ticket[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);

  // Keep ref for live updates inside subscription callback
  const selectedTicketIdRef = useRef<number | null>(null);
  useEffect(() => {
    selectedTicketIdRef.current = selectedTicket?.id || null;
  }, [selectedTicket]);

  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState<TicketPriority>("medium");
  const [newCategory, setNewCategory] = useState<TicketCategory>("technical");

  // Comment State
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  const fetchTickets = async () => {
    try {
      const data = await ticketService.getTickets({
        status: statusFilter || undefined,
        priority: priorityFilter || undefined,
      });
      setTickets(data);
    } catch (err) {
      console.error("Failed to load tickets", err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [statusFilter, priorityFilter]);

  // Real-time ActionCable WebSocket Subscription
  useEffect(() => {
    if (!user) return;

    const orgId = user.organization_id || user.organization?.id || 5;
    const consumer = getCableConsumer();
    
    const subscription = consumer.subscriptions.create(
      { channel: "TicketChannel", organization_id: orgId },
      {
        connected() {
          console.log(`[ActionCable] ✅ Successfully connected to TicketChannel (Org: ${orgId})`);
          setIsLiveConnected(true);
        },
        disconnected() {
          console.warn("[ActionCable] ⚠️ Disconnected from TicketChannel");
          setIsLiveConnected(false);
        },
        received(data: any) {
          console.log("[ActionCable] ⚡ Event received:", data);
          if (!data || !data.event) return;

          const incomingTicket = data.ticket;

          if (data.event === "ticket_created" && incomingTicket) {
            setTickets((prev) => {
              const filtered = prev.filter((t) => t.id !== incomingTicket.id);
              return [incomingTicket, ...filtered];
            });
          } else if (
            (data.event === "ticket_updated" || data.event === "ticket_ai_classified") &&
            incomingTicket
          ) {
            setTickets((prev) =>
              prev.map((t) => (t.id === incomingTicket.id ? incomingTicket : t))
            );
            if (selectedTicketIdRef.current === incomingTicket.id) {
              setSelectedTicket(incomingTicket);
            }
          } else if (data.event === "ticket_deleted") {
            setTickets((prev) => prev.filter((t) => t.id !== data.ticket_id));
            if (selectedTicketIdRef.current === data.ticket_id) {
              setSelectedTicket(null);
            }
          } else if (data.event === "comment_added") {
            if (selectedTicketIdRef.current === data.ticket_id && data.comment) {
              setSelectedTicket((curr) => {
                if (!curr) return null;
                const existingComments = curr.comments || [];
                if (existingComments.some((c) => c.id === data.comment.id)) return curr;
                return {
                  ...curr,
                  comments: [...existingComments, data.comment],
                };
              });
            }
          }
        },
      }
    );

    return () => {
      subscription.unsubscribe();
      consumer.disconnect();
    };
  }, [user]);

  const loadTicketDetails = async (id: number) => {
    try {
      const ticket = await ticketService.getTicket(id);
      setSelectedTicket(ticket);

      const similar = await ticketService.getSimilarTickets(id);
      setSimilarTickets(similar || []);
    } catch (err) {
      console.error("Failed to load ticket details", err);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ticketService.createTicket({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        category: newCategory,
      });
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDesc("");
    } catch (err) {
      console.error("Error creating ticket", err);
    }
  };

  const handleStatusChange = async (id: number, status: TicketStatus) => {
    try {
      await ticketService.updateTicketStatus(id, status);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !commentText.trim()) return;

    try {
      await ticketService.addComment(selectedTicket.id, commentText, isInternalComment);
      setCommentText("");
      setIsInternalComment(false);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    const openCount = tickets.filter((t) => t.status === "open").length;
    const inProgressCount = tickets.filter((t) => t.status === "in_progress").length;
    const breachedCount = tickets.filter((t) => t.sla_status === "breached").length;
    const urgentCount = tickets.filter(
      (t) => t.priority === "urgent" && t.status !== "resolved" && t.status !== "closed"
    ).length;
    return { openCount, inProgressCount, breachedCount, urgentCount };
  }, [tickets]);

  const getPriorityBadge = (priority: TicketPriority) => {
    const map = {
      urgent: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      high: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      medium: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      low: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded border uppercase font-mono ${map[priority]}`}>
        {priority}
      </span>
    );
  };

  const getStatusBadge = (status: TicketStatus) => {
    const map = {
      open: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      in_progress: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      resolved: "bg-teal-500/10 text-teal-400 border-teal-500/20",
      closed: "bg-slate-700/30 text-slate-400 border-slate-700",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded border font-medium capitalize ${map[status]}`}>
        {status.replace("_", " ")}
      </span>
    );
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col">
      {/* Responsive Top Bar */}
      <header className="w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 sm:px-8 py-3.5 flex justify-between items-center sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 leading-tight">OpsPulse Hub</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              <span>{user?.organization?.name}</span>
              <span className="text-slate-600">•</span>
              <span className="font-mono text-emerald-400">{user?.organization?.subdomain}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono transition ${
              isLiveConnected
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-amber-500/10 border-amber-500/30 text-amber-400"
            }`}
          >
            <Radio className={`w-3 h-3 ${isLiveConnected ? "animate-pulse text-emerald-400" : "text-amber-400"}`} />
            <span>{isLiveConnected ? "LIVE SYNC ACTIVE" : "CONNECTING..."}</span>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-slate-200">{user?.full_name}</p>
            <p className="text-xs text-slate-500 font-mono">{user?.role?.toUpperCase()}</p>
          </div>
          <button
            onClick={() => logout()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/50 border border-rose-800/60 text-rose-300 rounded-lg text-xs transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Operations Live Metrics Bar */}
      <div className="w-full px-4 sm:px-8 pt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Open Tickets</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{metrics.openCount}</p>
            </div>
            <Inbox className="w-6 h-6 text-emerald-500/40" />
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">In Progress</p>
              <p className="text-xl font-bold text-indigo-400 mt-1">{metrics.inProgressCount}</p>
            </div>
            <Clock className="w-6 h-6 text-indigo-500/40" />
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Urgent Incidents</p>
              <p className="text-xl font-bold text-amber-400 mt-1">{metrics.urgentCount}</p>
            </div>
            <Flame className="w-6 h-6 text-amber-500/40" />
          </div>
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">SLA Breaches</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{metrics.breachedCount}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-rose-500/40" />
          </div>
        </div>
      </div>

      {/* Full-Width Workspace */}
      <main className="flex-1 w-full p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Col: Feeds */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <span>Support Incidents</span>
              </h2>
              <p className="text-xs text-slate-400">Tenant-isolated incident queues and live SLA countdowns</p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-lg text-sm transition shadow-lg shadow-emerald-950"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 border border-slate-800 p-3 rounded-xl">
            <Filter className="w-4 h-4 text-slate-500 ml-1" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500"
            >
              <option value="">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          {/* Ticket Cards Feed */}
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-12 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-2">
                <Inbox className="w-8 h-8 text-slate-600" />
                <span>No tickets matching criteria in this tenant workspace.</span>
              </div>
            ) : (
              tickets.map((t) => (
                <div
                  key={t.id}
                  onClick={() => loadTicketDetails(t.id)}
                  className={`p-5 rounded-xl border transition cursor-pointer ${
                    selectedTicket?.id === t.id
                      ? "bg-slate-900 border-emerald-500/50 shadow-md shadow-emerald-950/20"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-200 text-sm hover:text-emerald-400 transition">
                      {t.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {getPriorityBadge(t.priority)}
                      {getStatusBadge(t.status)}
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.description}</p>
                  
                  {/* AI Summary Banner */}
                  {t.ai_summary && (
                    <div className="mb-3 p-2 bg-emerald-950/20 border border-emerald-800/30 rounded-lg flex items-start gap-2 text-xs text-emerald-300">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{t.ai_summary}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80 pt-3">
                    <span className="capitalize">Category: {t.category}</span>
                    <div className="flex items-center gap-2">
                      {t.sla_status === "breached" ? (
                        <span className="flex items-center gap-1 text-rose-400 font-medium">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          SLA Breached
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-400" />
                          SLA Due: {new Date(t.sla_due_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Col: Details & Discussion Drawer */}
        <div className="lg:col-span-5 xl:col-span-4">
          {selectedTicket ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 space-y-6 sticky top-20">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-slate-500 font-mono">TICKET #{selectedTicket.id}</span>
                  {getPriorityBadge(selectedTicket.priority)}
                </div>
                <h3 className="text-base font-bold text-slate-100">{selectedTicket.title}</h3>
                <p className="text-xs text-slate-400 mt-2">{selectedTicket.description}</p>
                
                {/* AI Summary Highlight */}
                {selectedTicket.ai_summary && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/40 rounded-lg flex items-start gap-2.5 text-xs text-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-emerald-400">AI Incident Summary: </span>
                      {selectedTicket.ai_summary}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs text-slate-400 mb-2 block font-medium">Update Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {(["open", "in_progress", "resolved", "closed"] as TicketStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedTicket.id, st)}
                      className={`text-xs py-1.5 px-3 rounded-lg border font-medium capitalize transition ${
                        selectedTicket.status === st
                          ? "bg-emerald-600 border-emerald-500 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {st.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Similar Tickets (Pgvector Nearest Neighbors) */}
              {similarTickets.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
                    <GitFork className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Similar Previous Incidents (Pgvector)</span>
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {similarTickets.map((st) => (
                      <div
                        key={st.id}
                        onClick={() => loadTicketDetails(st.id)}
                        className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-2.5 rounded-lg cursor-pointer transition text-xs"
                      >
                        <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                          <span className="font-mono text-cyan-400">#{st.id}</span>
                          <span className="capitalize">{st.status}</span>
                        </div>
                        <p className="text-slate-300 font-medium truncate">{st.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Log Trail */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Activity Trail</span>
                </h4>
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-xs">
                  {selectedTicket.audit_logs?.map((log) => (
                    <div key={log.id} className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-lg text-slate-400">
                      <span className="text-slate-200 font-semibold">{log.user?.first_name || "System"}:</span>{" "}
                      <span className="font-mono text-emerald-400 text-[11px]">{log.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Box & Feeds */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Discussions</span>
                </h4>
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1 mb-4 text-xs">
                  {selectedTicket.comments?.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3 rounded-lg border ${
                        c.internal
                          ? "bg-amber-950/20 border-amber-800/40 text-amber-200"
                          : "bg-slate-950 border-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center text-[10px] text-slate-500 mb-1">
                        <span className="font-medium text-slate-300">{c.user?.full_name}</span>
                        {c.internal && <span className="text-amber-400 font-bold">INTERNAL NOTE</span>}
                      </div>
                      <p>{c.body}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="space-y-2">
                  <textarea
                    rows={2}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a reply or update..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInternalComment}
                        onChange={(e) => setIsInternalComment(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0"
                      />
                      <span>Internal Note</span>
                    </label>
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Send className="w-3 h-3" />
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-8 text-center text-slate-500 text-sm">
              Select a ticket from the left queue to view activity trail, discussions, and manage status.
            </div>
          )}
        </div>
      </main>

      {/* Responsive Create Ticket Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-100">Create New Support Ticket</h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-500 hover:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">Ticket Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Database connection pool exhausted"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Provide incident context and impact..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as TicketPriority)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="low">Low (48h SLA)</option>
                    <option value="medium">Medium (24h SLA)</option>
                    <option value="high">High (12h SLA)</option>
                    <option value="urgent">Urgent (4h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="general">General</option>
                    <option value="technical">Technical</option>
                    <option value="billing">Billing</option>
                    <option value="feature_request">Feature Request</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg transition"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. Auth Screen
// ==========================================
function AuthDashboard() {
  const { user, loading, login, signup } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [subdomain, setSubdomain] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isLogin) {
        await login({ email, password });
      } else {
        await signup({
          user: { email, password, password_confirmation: passwordConfirmation, first_name: firstName, last_name: lastName },
          organization: { name: orgName, subdomain },
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.details?.join(", ") || "Authentication failed");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-slate-400">
        Loading session...
      </div>
    );
  }

  if (user) {
    return <TicketOperationsWorkspace />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 sm:p-6 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-emerald-400 mb-1">OpsPulse Hub</h1>
        <p className="text-xs text-slate-400 mb-6">{isLogin ? "Sign in to your account" : "Create your tenant organization"}</p>

        {error && (
          <div className="mb-4 bg-rose-950/60 border border-rose-800 text-rose-300 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400">Organization Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400">Subdomain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. acme"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </>
          )}

          <div>
            <label className="text-xs text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="text-xs text-slate-400">Confirm Password</label>
              <input
                type="password"
                required
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 font-semibold text-white rounded-lg text-sm transition"
          >
            {isLogin ? "Sign In" : "Register Organization"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isLogin ? "Need a new workspace? " : "Already registered? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-emerald-400 font-semibold hover:underline"
          >
            {isLogin ? "Create an account" : "Sign in here"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthDashboard />
    </AuthProvider>
  );
}