export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { apiKey, ...body } = req.body;

  if (!apiKey) return res.status(400).json({ error: "Missing API key" });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  res.status(response.status).json(data);
}
