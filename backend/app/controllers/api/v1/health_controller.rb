module Api
  module V1
    class HealthController < ActionController::API
      def show
        render json: {
          status: "healthy",
          service: "OpsPulse API",
          timestamp: Time.current.iso8601
        }, status: :ok
      end
    end
  end
end