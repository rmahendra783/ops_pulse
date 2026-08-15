module Api
  module V1
    class UsersController < BaseController
      def me
        render json: {
          user: UserSerializer.new(current_user).to_h
        }, status: :ok
      end
    end
  end
end