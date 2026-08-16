class EnablePgvectorAndAddEmbeddingToTickets < ActiveRecord::Migration[8.0]
  def change
    enable_extension "vector" unless extension_enabled?("vector")

    # 768 dimension matches nomic-embed-text
    add_column :tickets, :embedding, :vector, limit: 768
    add_column :tickets, :ai_summary, :text

    add_index :tickets, :embedding, using: :hnsw, opclass: :vector_cosine_ops
  end
end