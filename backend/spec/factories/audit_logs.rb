FactoryBot.define do
  factory :audit_log do
    action { "MyString" }
    metadata { "" }
    ticket { nil }
    user { nil }
  end
end
