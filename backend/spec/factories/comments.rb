FactoryBot.define do
  factory :comment do
    body { "MyText" }
    internal { false }
    ticket { nil }
    user { nil }
  end
end
