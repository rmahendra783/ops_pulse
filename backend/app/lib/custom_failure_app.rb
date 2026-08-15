class CustomFailureApp < Devise::FailureApp
  def respond
    if request.format == :json || request.headers["Accept"] =~ /json/ || request.content_type =~ /json/
      json_error_response
    else
      super
    end
  end

  def json_error_response
    self.status = :unauthorized
    self.content_type = "application/json"
    self.response_body = {
      error: "Invalid email or password."
    }.to_json
  end
end