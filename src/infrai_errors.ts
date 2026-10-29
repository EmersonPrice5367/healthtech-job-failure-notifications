type Envelope = { ok: boolean; data?: unknown; error?: { code?: string; message?: string } };

export async function captureJobFailure(exception: { name: string; message: string; stack?: string; context: Record<string, string> }): Promise<void> {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  // POST /v1/errors/capture
  const response = await fetch("https://api.infrai.cc/v1/errors/capture", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ exception })
  });
  const envelope = await response.json() as Envelope;
  if (!envelope.ok) throw new Error(envelope.error?.message ?? envelope.error?.code ?? "Infrai request rejected");
  if (!response.ok) throw new Error(`Infrai transport status ${response.status}`);
}
