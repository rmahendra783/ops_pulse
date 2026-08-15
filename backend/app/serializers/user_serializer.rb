class UserSerializer
  include Alba::Resource

  root_key :user

  attributes :id, :email, :first_name, :last_name, :full_name, :role, :created_at

  one :organization, resource: OrganizationSerializer
end