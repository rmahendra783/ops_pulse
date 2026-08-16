class AddSlaStatusToTickets < ActiveRecord::Migration[8.0]
  def change
    add_column :tickets, :sla_status, :integer, default: 0, null: false # 0: on_track, 1: warning, 2: breached
    add_column :tickets, :breached_at, :datetime

    add_index :tickets, [:organization_id, :sla_status]
  end
end