module Api
  module V1
    class CommentsController < BaseController
      before_action :set_ticket

      # POST /api/v1/tickets/:ticket_id/comments
      def create
        comment = @ticket.comments.build(comment_params.merge(user: current_user))

        if comment.save
          @ticket.audit_logs.create!(
            user: current_user,
            action: "comment_added",
            metadata: { internal: comment.internal }
          )

          render json: {
            message: "Comment added successfully.",
            comment: CommentSerializer.new(comment).to_h
          }, status: :created
        else
          render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def set_ticket
        @ticket = Ticket.find(params[:ticket_id])
      rescue ActiveRecord::RecordNotFound
        render json: { error: "Ticket not found." }, status: :not_found
      end

      def comment_params
        params.require(:comment).permit(:body, :internal)
      end
    end
  end
end