import Anthropic from "@anthropic-ai/sdk";

// CLAUDE_API_KEY (not ANTHROPIC_API_KEY) so Netlify's AI-Gateway injection can't shadow it.
const apiKey = process.env.CLAUDE_API_KEY;
if (!apiKey) throw new Error("Server missing CLAUDE_API_KEY");

export const client = new Anthropic({
  apiKey,
  baseURL: "https://api.anthropic.com", // load-bearing on Netlify (defeats gateway proxy)
});

export const MODEL = "claude-opus-4-8"; // depth
export const FAST = "claude-haiku-4-5"; // low latency

// Force a single tool call and return its validated input object.
export async function forcedToolJSON<T>(opts: {
  model?: string;
  system?: string;
  messages: Anthropic.MessageParam[];
  toolName: string;
  toolDescription: string;
  schema: Anthropic.Tool.InputSchema;
  maxTokens?: number;
}): Promise<T> {
  const res = await client.messages.create({
    model: opts.model ?? FAST,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: opts.messages,
    tools: [{ name: opts.toolName, description: opts.toolDescription, input_schema: opts.schema }],
    tool_choice: { type: "tool", name: opts.toolName },
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("No tool_use in response");
  return block.input as T;
}

// NDJSON keepalive: write "\n" heartbeats while awaiting Claude, then a final
// {"result": ...} line. Use for slow (opus) calls that can exceed Netlify's idle timeout.
export function ndjsonStream(work: () => Promise<unknown>): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const beat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode("\n"));
        } catch {
          /* closed */
        }
      }, 3000);
      try {
        const result = await work();
        controller.enqueue(encoder.encode(JSON.stringify({ result }) + "\n"));
      } catch (err) {
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }) + "\n")
        );
      } finally {
        clearInterval(beat);
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "content-type": "application/x-ndjson; charset=utf-8", "cache-control": "no-store" },
  });
}
