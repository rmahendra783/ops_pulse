class OllamaService
  OLLAMA_HOST = ENV.fetch("OLLAMA_HOST", "http://localhost:11434")

  def self.generate_embedding(text)
    conn = Faraday.new(url: OLLAMA_HOST)
    response = conn.post("/api/embeddings") do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = {
        model: "nomic-embed-text:latest",
        prompt: text
      }.to_json
    end

    if response.success?
      JSON.parse(response.body)["embedding"]
    else
      Rails.logger.error("Ollama Embedding Error: #{response.body}")
      nil
    end
  rescue StandardError => e
    Rails.logger.error("Ollama Connection Failed: #{e.message}")
    nil
  end

  def self.classify_and_summarize(title, description)
    conn = Faraday.new(url: OLLAMA_HOST) do |f|
      f.options.timeout = 60
    end

    prompt = <<~PROMPT
      Analyze this support ticket:
      Title: #{title}
      Description: #{description}

      Respond strictly in JSON format with two keys:
      {
        "suggested_priority": "urgent" or "high" or "medium" or "low",
        "summary": "one concise sentence incident summary"
      }
    PROMPT

    response = conn.post("/api/generate") do |req|
      req.headers["Content-Type"] = "application/json"
      req.body = {
        model: "llama3.2:1b",
        prompt: prompt,
        stream: false,
        format: "json"
      }.to_json
    end

    if response.success?
      raw_json = JSON.parse(response.body)["response"]
      JSON.parse(raw_json)
    else
      nil
    end
  rescue StandardError => e
    Rails.logger.error("Ollama Classification Failed: #{e.message}")
    nil
  end
end