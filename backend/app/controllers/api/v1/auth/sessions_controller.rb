module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        respond_to :json

        def create
          user = User.find_by(email: sign_in_params[:email])

          if user&.valid_password?(sign_in_params[:password])
            # Explicitly sign in with warden for Devise dispatch
            request.env["warden"].set_user(user, scope: :user, store: false)

            # Generate and sign JWT token
            secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base }
            payload = {
              sub: user.id.to_s,
              jti: user.jti,
              scp: "user",
              exp: 1.day.from_now.to_i
            }
            token = JWT.encode(payload, secret, "HS256")
            response.set_header("Authorization", "Bearer #{token}")

            render json: {
              message: "Logged in successfully.",
              token: token,
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
              token = request.headers["Authorization"].to_s.gsub(/^Bearer\s+/i, "").strip
              secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base }
              jwt_payload = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
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