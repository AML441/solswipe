import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { items } from "../../../testing/page";

const ai = new GoogleGenAI({
  apiKey: process.env.GENAI_API_KEY, // server-side only
});

export async function GET() {
  try {
    const tagTexts = items.map((org) => org.tags.join(" "));
    console.log("tagTexts:", tagTexts);

    const response = await ai.models.embedContent({
      model: "gemini-embedding-001",
      contents: tagTexts,
      config: { taskType: "SEMANTIC_SIMILARITY" },
    });

    console.log("GenAI response:", response);

    const embeddings = response.embeddings?.map((e) => e.values) ?? [];
    return NextResponse.json({ embeddings });
  } catch (err) {
    console.error("Embeddings API error:", err);
    console.log("API KEY: ", ai);
    return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
  }
}
