class AuditLogSerializer
  include Alba::Resource

  root_key :audit_log

  attributes :id, :action, :metadata, :created_at
  one :user, resource: UserSerializer
end