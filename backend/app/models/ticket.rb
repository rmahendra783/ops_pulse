class Ticket < ApplicationRecord
  acts_as_tenant :organization

  belongs_to :created_by, class_name: "User"
  belongs_to :assigned_to, class_name: "User", optional: true
  has_many :comments, dependent: :destroy
  has_many :audit_logs, dependent: :destroy

  enum :status, { open: 0, in_progress: 1, resolved: 2, closed: 3 }
  enum :priority, { low: 0, medium: 1, high: 2, urgent: 3 }
  enum :category, { general: 0, technical: 1, billing: 2, feature_request: 3 }

  validates :title, :description, presence: true
  validates :status, :priority, :category, presence: true

  before_create :calculate_sla_deadline

  private

  def calculate_sla_deadline
    sla_hours = case priority
                when "urgent" then 4.hours
                when "high" then 12.hours
                when "medium" then 24.hours
                else 48.hours
                end
    self.sla_due_at ||= Time.current + sla_hours
  end
end