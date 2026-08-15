class User < ApplicationRecord
  include Devise::JWT::RevocationStrategies::JTIMatcher

  devise :database_authenticatable, :registerable,
         :recoverable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: self

  # Explicit association
  belongs_to :organization
  acts_as_tenant :organization

  has_many :created_tickets, class_name: "Ticket", foreign_key: :created_by_id, dependent: :nullify
  has_many :assigned_tickets, class_name: "Ticket", foreign_key: :assigned_to_id, dependent: :nullify
  has_many :comments, dependent: :destroy

  enum :role, { agent: 0, admin: 1, customer: 2 }

  validates :first_name, :last_name, presence: true
  validates :role, presence: true

  before_validation :set_jti, on: :create

  def full_name
    "#{first_name} #{last_name}".strip
  end

  private

  def set_jti
    self.jti ||= SecureRandom.uuid
  end
end