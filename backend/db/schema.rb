# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_08_16_074908) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "pg_catalog.plpgsql"
  enable_extension "vector"

  create_table "audit_logs", force: :cascade do |t|
    t.string "action", null: false
    t.datetime "created_at", null: false
    t.jsonb "metadata", default: {}, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["ticket_id"], name: "index_audit_logs_on_ticket_id"
    t.index ["user_id"], name: "index_audit_logs_on_user_id"
  end

  create_table "comments", force: :cascade do |t|
    t.text "body", null: false
    t.datetime "created_at", null: false
    t.boolean "internal", default: false, null: false
    t.bigint "ticket_id", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id", null: false
    t.index ["ticket_id"], name: "index_comments_on_ticket_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "name", null: false
    t.string "subdomain", null: false
    t.datetime "updated_at", null: false
    t.index ["subdomain"], name: "index_organizations_on_subdomain", unique: true
  end

  create_table "tickets", force: :cascade do |t|
    t.text "ai_summary"
    t.bigint "assigned_to_id"
    t.datetime "breached_at"
    t.integer "category", default: 0, null: false
    t.datetime "created_at", null: false
    t.bigint "created_by_id", null: false
    t.text "description", null: false
    t.vector "embedding", limit: 768
    t.bigint "organization_id", null: false
    t.integer "priority", default: 1, null: false
    t.datetime "sla_due_at"
    t.integer "sla_status", default: 0, null: false
    t.integer "status", default: 0, null: false
    t.string "title", null: false
    t.datetime "updated_at", null: false
    t.index ["assigned_to_id"], name: "index_tickets_on_assigned_to_id"
    t.index ["created_by_id"], name: "index_tickets_on_created_by_id"
    t.index ["embedding"], name: "index_tickets_on_embedding", opclass: :vector_cosine_ops, using: :hnsw
    t.index ["organization_id", "priority"], name: "index_tickets_on_organization_id_and_priority"
    t.index ["organization_id", "sla_status"], name: "index_tickets_on_organization_id_and_sla_status"
    t.index ["organization_id", "status"], name: "index_tickets_on_organization_id_and_status"
    t.index ["organization_id"], name: "index_tickets_on_organization_id"
  end

  create_table "users", force: :cascade do |t|
    t.datetime "created_at", null: false
    t.string "email", default: "", null: false
    t.string "encrypted_password", default: "", null: false
    t.string "first_name", default: "", null: false
    t.string "jti", null: false
    t.string "last_name", default: "", null: false
    t.bigint "organization_id", null: false
    t.datetime "remember_created_at"
    t.datetime "reset_password_sent_at"
    t.string "reset_password_token"
    t.integer "role", default: 0, null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
    t.index ["jti"], name: "index_users_on_jti", unique: true
    t.index ["organization_id"], name: "index_users_on_organization_id"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
  end

  add_foreign_key "audit_logs", "tickets"
  add_foreign_key "audit_logs", "users"
  add_foreign_key "comments", "tickets"
  add_foreign_key "comments", "users"
  add_foreign_key "tickets", "organizations"
  add_foreign_key "tickets", "users", column: "assigned_to_id"
  add_foreign_key "tickets", "users", column: "created_by_id"
  add_foreign_key "users", "organizations"
end
