import express, { Request, Response } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.use(express.json({ limit: "25mb" }));

const OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434/api/chat";
const LLAMA_MODEL = process.env.LLAMA_MODEL || "llama3.2:3b";

async function callOllamaChat(
  userPrompt: string,
  systemPrompt?: string
): Promise<{ content: string; modelUsed: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);
    const r = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: LLAMA_MODEL,
        messages: [
          {
            role: "system",
            content:
              systemPrompt ||
              "Eres LLaMA local de NEXUS. Interpretas e informas; no adquieres autoridad. Separa HECHOS, INFERENCIAS, SUPUESTOS, FALTANTES y PRUEBAS REQUERIDAS. Nunca inventes evidencia ni declares éxito sin prueba."
          },
          { role: "user", content: userPrompt }
        ],
        stream: false
      })
    });
    clearTimeout(timer);
    if (!r.ok) return null;
    const data: any = await r.json();
    const content = data?.message?.content;
    if (!content || typeof content !== "string") return null;
    return { content, modelUsed: LLAMA_MODEL };
  } catch {
    return null;
  }
}

/** Deterministic local fallback when Ollama is unavailable — does not invent model evidence. */
function executeLlamaFallback(prompt: string) {
  const start = performance.now();
  const snippet = prompt.slice(0, 200) + (prompt.length > 200 ? "…" : "");
  const content =
    `[NEXUS — respaldo determinista local]\n\n` +
    `Ollama no respondió. Este texto es un respaldo local, no evidencia de un modelo LLM.\n\n` +
    `**HECHOS**\n- Prompt recibido (${prompt.length} caracteres): "${snippet}"\n` +
    `- Intérprete primario (Ollama) no disponible en este momento.\n\n` +
    `**SUPUESTOS**\n- Ninguno verificado por un modelo.\n\n` +
    `**FALTANTES**\n- Respuesta de LLaMA/Ollama.\n- Evidencia empírica del usuario si se afirma un resultado.\n\n` +
    `**PRUEBAS REQUERIDAS**\n- Arrancar Ollama (\`OLLAMA_URL\` / \`LLAMA_MODEL\`) o continuar sin IA.\n` +
    `- No declarar éxito ni READY sólo por este mensaje.\n\n` +
    `Principio: LLaMA interpreta → NEXUS arbitra → evidencia demuestra → el usuario decide.`;

  return {
    content,
    modelUsed: "deterministic-local-fallback",
    fallbackTriggered: true,
    executionTimeMs: parseFloat((performance.now() - start).toFixed(2))
  };
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ ok: true, service: "nexus", version: "V1-operativa" });
});

app.get("/api/status", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    interpreter: {
      primary: "LLaMA/Ollama local",
      ollamaUrl: OLLAMA_URL,
      model: LLAMA_MODEL,
      deterministicFallback: true,
      gemini: false
    }
  });
});

app.post("/api/llama/chat", async (req: Request, res: Response) => {
  try {
    const prompt = String(req.body?.prompt || req.body?.message || "").trim();
    if (!prompt) return res.status(400).json({ error: "prompt requerido" });

    const ollama = await callOllamaChat(prompt);
    if (ollama) {
      return res.json({
        reply: ollama.content,
        modelUsed: ollama.modelUsed,
        fallbackTriggered: false
      });
    }

    const fallback = executeLlamaFallback(prompt);
    return res.json({
      reply: fallback.content,
      modelUsed: fallback.modelUsed,
      fallbackTriggered: true,
      executionTimeMs: fallback.executionTimeMs
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message || "llama chat failed" });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NEXUS server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
