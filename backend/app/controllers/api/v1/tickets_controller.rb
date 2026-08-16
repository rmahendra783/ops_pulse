module Api
  module V1
    class TicketsController < BaseController
      before_action :set_ticket, only: %i[show update destroy assign similar]

      # GET /api/v1/tickets
      def index
        tickets = Ticket.includes(:created_by, :assigned_to)
                        .order(created_at: :desc)

        # Scoped filters
        tickets = tickets.where(status: params[:status]) if params[:status].present?
        tickets = tickets.where(priority: params[:priority]) if params[:priority].present?
        tickets = tickets.where(assigned_to_id: params[:assigned_to_id]) if params[:assigned_to_id].present?

        render json: {
          tickets: TicketSerializer.new(tickets).to_h
        }, status: :ok
      end

      # GET /api/v1/tickets/:id
      def show
        render json: {
          ticket: TicketSerializer.new(@ticket).to_h
        }, status: :ok
      end

      # GET /api/v1/tickets/:id/similar
      def similar
        similar_tickets = @ticket.similar_tickets(5)
        render json: {
          similar_tickets: TicketSerializer.new(similar_tickets).to_h
        }, status: :ok
      end

      # POST /api/v1/tickets
      def create
        ticket = current_user.created_tickets.build(ticket_params)

        if ticket.save
          ticket.audit_logs.create!(
            user: current_user,
            action: "ticket_created",
            metadata: { title: ticket.title, priority: ticket.priority }
          )

          render json: {
            message: "Ticket created successfully.",
            ticket: TicketSerializer.new(ticket).to_h
          }, status: :created
        else
          render json: { errors: ticket.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PATCH/PUT /api/v1/tickets/:id
      def update
        old_status = @ticket.status
        if @ticket.update(ticket_params)
          if old_status != @ticket.status
            @ticket.audit_logs.create!(
              user: current_user,
              action: "status_changed",
              metadata: { from: old_status, to: @ticket.status }
            )
          end

          render json: {
            message: "Ticket updated successfully.",
            ticket: TicketSerializer.new(@ticket).to_h
          }, status: :ok
        else
          render json: { errors: @ticket.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/tickets/:id
      def destroy
        @ticket.destroy
        render json: { message: "Ticket deleted successfully." }, status: :ok
      end

      # POST /api/v1/tickets/:id/assign
      def assign
        assignee = User.find_by(id: params[:assigned_to_id])
        if @ticket.update(assigned_to: assignee)
          @ticket.audit_logs.create!(
            user: current_user,
            action: "assignment_changed",
            metadata: { assigned_to: assignee&.full_name || "Unassigned" }
          )

          render json: {
            message: "Ticket assigned successfully.",
            ticket: TicketSerializer.new(@ticket).to_h
          }, status: :ok
        else
          render json: { errors: @ticket.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_ticket
        @ticket = Ticket.find(params[:id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Ticket not found." }, status: :not_found
      end

      def ticket_params
        params.require(:ticket).permit(:title, :description, :status, :priority, :category, :assigned_to_id)
      end
    end
  end
end