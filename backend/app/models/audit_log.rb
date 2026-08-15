class AuditLog < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  validates :action, presence: true
end