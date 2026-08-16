class SlaBreachCheckerJob < ApplicationJob
  queue_as :default

  def perform
    Ticket.pending_resolution.find_each do |ticket|
      ActsAsTenant.with_tenant(ticket.organization) do
        ticket.evaluate_sla!
      end
    end
  end
end