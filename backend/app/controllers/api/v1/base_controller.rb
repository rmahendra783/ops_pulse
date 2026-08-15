module Api
  module V1
    class BaseController < ActionController::API
      before_action :authenticate_user!
      set_current_tenant_through_filter
      before_action :set_tenant

      private

      def set_tenant
        set_current_tenant(current_user.organization) if current_user
      end
    end
  end
end