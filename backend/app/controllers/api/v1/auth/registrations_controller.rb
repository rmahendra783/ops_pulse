module Api
  module V1
    module Auth
      class RegistrationsController < Devise::RegistrationsController
        respond_to :json

        def create
          ActiveRecord::Base.transaction do
            # 1. Find or create Organization
            organization = Organization.find_or_create_by!(
              subdomain: org_params[:subdomain].to_s.strip.downcase
            ) do |org|
              org.name = org_params[:name]
            end

            # 2. Build and save user under this organization
            build_resource(sign_up_params.merge(organization: organization, role: :admin))
            resource.save!

            # 3. Return JSON response without invoking cookie session store
            render json: {
              message: "Signed up successfully.",
              data: UserSerializer.new(resource).to_h
            }, status: :created
          end
        rescue ActiveRecord::RecordInvalid => e
          render json: {
            error: "Registration failed",
            details: e.record.errors.full_messages
          }, status: :unprocessable_entity
        end

        private

        def sign_up_params
          params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name)
        end

        def org_params
          params.require(:organization).permit(:name, :subdomain)
        end
      end
    end
  end
end