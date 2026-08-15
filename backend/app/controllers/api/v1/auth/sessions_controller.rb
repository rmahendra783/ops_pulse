module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        respond_to :json

        def create
          user = User.find_by(email: sign_in_params[:email])

          if user&.valid_password?(sign_in_params[:password])
            # Explicitly sign in with warden for JWT dispatch
            request.env["warden"].set_user(user, scope: :user, store: false)
            
            render json: {
              message: "Logged in successfully.",
              data: UserSerializer.new(user).to_h
            }, status: :ok
          else
            render json: {
              error: "Invalid email or password."
            }, status: :unauthorized
          end
        end

        def destroy
          if request.headers["Authorization"].present?
            begin
              token = request.headers["Authorization"].split(" ").last
              jwt_payload = JWT.decode(token, Devise::JWT.config.secret).first
              current_user = User.find_by(id: jwt_payload["sub"])

              if current_user
                # Regenerate JTI to invalidate current JWT token immediately
                current_user.update_column(:jti, SecureRandom.uuid)
                render json: { message: "Logged out successfully." }, status: :ok
              else
                render json: { message: "Active session not found." }, status: :unauthorized
              end
            rescue JWT::DecodeError
              render json: { message: "Invalid authorization token." }, status: :unauthorized
            end
          else
            render json: { message: "Authorization token missing." }, status: :unauthorized
          end
        end

        private

        def sign_in_params
          params.require(:user).permit(:email, :password)
        end
      end
    end
  end
end