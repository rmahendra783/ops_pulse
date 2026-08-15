class DeviseCreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      ## Database authenticatable
      t.string :email,              null: false, default: ""
      t.string :encrypted_password, null: false, default: ""

      ## Profile & RBAC
      t.string :first_name,         null: false, default: ""
      t.string :last_name,          null: false, default: ""
      t.integer :role,              null: false, default: 0 # 0: agent, 1: admin, 2: customer

      ## Multi-tenancy & JWT Revocation
      t.references :organization,   null: false, foreign_key: true
      t.string :jti,                null: false

      ## Recoverable
      t.string   :reset_password_token
      t.datetime :reset_password_sent_at

      ## Rememberable
      t.datetime :remember_created_at

      t.timestamps null: false
    end

    add_index :users, :email,                unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :jti,                  unique: true
  end
end