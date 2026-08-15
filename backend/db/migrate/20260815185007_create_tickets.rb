class CreateTickets < ActiveRecord::Migration[8.0]
  def change
    create_table :tickets do |t|
      t.string :title, null: false
      t.text :description, null: false
      t.integer :status, null: false, default: 0   # 0: open, 1: in_progress, 2: resolved, 3: closed
      t.integer :priority, null: false, default: 1 # 0: low, 1: medium, 2: high, 3: urgent
      t.integer :category, null: false, default: 0 # 0: general, 1: technical, 2: billing, 3: feature_request
      t.datetime :sla_due_at

      t.references :organization, null: false, foreign_key: true
      t.references :created_by, null: false, foreign_key: { to_table: :users }
      t.references :assigned_to, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :tickets, [:organization_id, :status]
    add_index :tickets, [:organization_id, :priority]
  end
end