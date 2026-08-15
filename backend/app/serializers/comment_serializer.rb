class CommentSerializer
  include Alba::Resource

  root_key :comment

  attributes :id, :body, :internal, :created_at
  one :user, resource: UserSerializer
end