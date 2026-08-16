class TicketSerializer
  include Alba::Resource

  root_key :ticket

  attributes :id, :title, :description, :status, :priority, :category, :sla_status, :sla_due_at, :breached_at, :ai_summary, :created_at, :updated_at

  one :created_by, resource: UserSerializer
  one :assigned_to, resource: UserSerializer
  many :comments, resource: CommentSerializer
  many :audit_logs, resource: AuditLogSerializer
end