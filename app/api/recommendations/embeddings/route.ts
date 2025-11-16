import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { items } from "../../../../types/Items";

const ai = new GoogleGenAI({
  apiKey: process.env.GENAI_API_KEY, // server-side only
  
  
});
 const tagTexts = items.map((org: { tags: any[]; }) => org.tags.join(" "));
    console.log("tagTexts:", tagTexts);

export async function GET() {
  try {

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
    console.log("API key exists:", !!process.env.GENAI_API_KEY);
    console.log("Items:", items);

    return NextResponse.json({ error: "Failed to generate embeddings" }, { status: 500 });
  }
}
