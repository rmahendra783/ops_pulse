FactoryBot.define do
  factory :ticket do
    title { "MyString" }
    description { "MyText" }
    status { 1 }
    priority { 1 }
    category { 1 }
    sla_due_at { "2026-08-16 00:20:07" }
    organization { nil }
    assigned_to { nil }
    created_by { nil }
  end
end
