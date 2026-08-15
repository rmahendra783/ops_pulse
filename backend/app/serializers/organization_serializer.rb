class OrganizationSerializer
  include Alba::Resource

  root_key :organization

  attributes :id, :name, :subdomain, :created_at
end