Rails.application.routes.draw do
  # Health check for load balancers
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      get "health", to: "health#show"

      # Devise-JWT Authentication Routes
      devise_for :users, path: "auth", path_names: {
        sign_in: "login",
        sign_out: "logout",
        registration: "signup"
      },
      controllers: {
        sessions: "api/v1/auth/sessions",
        registrations: "api/v1/auth/registrations"
      }

      # Current User Profile
      get "me", to: "users#me"

      # Ticket Management & Nested Comments
      resources :tickets do
        member do
          post :assign
          get :similar
        end
        resources :comments, only: [:create]
      end
    end
  end
end