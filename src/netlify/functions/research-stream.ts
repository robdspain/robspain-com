import { ConvexClient } from "convex/browser";
import { GoogleGenerativeAI } from "@google/generative-ai";

const CONVEX_URL = process.env.CONVEX_URL || "https://lovely-manatee-270.convex.cloud";
const convex = new ConvexClient(CONVEX_URL);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

const streamResponse = (body) => {
  const stream = new ReadableStream({
    start(controller) {
      body.split("\n").forEach(chunk => {
        controller.enqueue(new TextEncoder().encode(chunk + "\n"));
      });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
};

export default async (req: Request) => {
  try {
    const { query, limit = 8 } = await req.json();

    const searchResults = await convex.action("researchCorpus:search", {
      query,
      limit,
    });

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const context = searchResults.sources
      .map((r, i) => `[Source ${i + 1}]: ${r.text}`)
      .join("\n\n");
    const prompt = `You are a world-class behavior analyst and research assistant. Your task is to answer the user's query based *only* on the provided research snippets. Synthesize the information from the sources into a concise, clear answer. Cite the sources using the format [Source X] at the end of each relevant sentence. Do not use outside knowledge.

Query: "${query}"

Research Snippets:
${context}`;

    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // First, send the sources
        controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'sources', sources: searchResults.sources }) + '\n\n'));

        // Then, stream the AI answer
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(encoder.encode('data: ' + JSON.stringify({ type: 'answer', text: chunkText }) + '\n\n'));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err) {
    console.error(err);
    const errorBody = 'data: ' + JSON.stringify({ type: 'error', text: err.message }) + '\n\n';
    return new Response(
      'data: ' + JSON.stringify({ type: 'error', text: "An error occurred on the server." }) + '\n\n', {
      status: 500,
      headers: { "Content-Type": "text/event-stream" },
    });
  }
};

export const config = {
  path: "/api/research-stream",
};
