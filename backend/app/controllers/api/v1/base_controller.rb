module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_user_from_token!
      set_current_tenant_through_filter
      before_action :set_tenant

      attr_reader :current_user

      private

      def authenticate_user_from_token!
        header = request.headers["Authorization"]
        # Strip all leading "Bearer " prefixes safely
        token = header.to_s.gsub(/^Bearer\s+/i, "").strip if header.present?

        if token.present?
          begin
            secret = ENV.fetch("DEVISE_JWT_SECRET_KEY") { Rails.application.credentials.devise_jwt_secret_key || Rails.application.secret_key_base }
            decoded = JWT.decode(token, secret, true, { algorithm: "HS256" }).first
            @current_user = User.find_by(id: decoded["sub"], jti: decoded["jti"])

            unless @current_user
              render json: { error: "Session expired or invalid token." }, status: :unauthorized
            end
          rescue JWT::DecodeError => e
            render json: { error: "Invalid token format: #{e.message}" }, status: :unauthorized
          end
        else
          render json: { error: "Authorization token missing." }, status: :unauthorized
        end
      end

      def set_tenant
        set_current_tenant(@current_user.organization) if @current_user
      end
    end
  end
end