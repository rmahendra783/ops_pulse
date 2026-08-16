class AiClassifyTicketJob < ApplicationJob
  queue_as :default

  def perform(ticket_id)
    ticket = Ticket.find_by(id: ticket_id)
    return unless ticket

    ActsAsTenant.with_tenant(ticket.organization) do
      # 1. Generate local vector embedding
      text = "#{ticket.title}\n#{ticket.description}"
      vector = OllamaService.generate_embedding(text)

      # 2. AI summary from llama3.2:1b
      ai_data = OllamaService.classify_and_summarize(ticket.title, ticket.description)

      updates = {}
      updates[:embedding] = vector if vector.present?
      updates[:ai_summary] = ai_data["summary"] if ai_data && ai_data["summary"].present?

      if updates.present?
        ticket.update_columns(updates)
        ticket.audit_logs.create!(
          user: ticket.created_by,
          action: "ai_classified",
          metadata: {
            summary: updates[:ai_summary],
            has_vector: vector.present?
          }
        )
      end
    end
  end
end