
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMinecraftScript = async (prompt: string): Promise<string> => {
  const systemInstruction = `
    You are an expert Minecraft Bedrock Addon Developer. 
    Your goal is to write high-quality JavaScript code using the '@minecraft/server' and '@minecraft/server-ui' APIs.
    Only return the code itself, no explanations, no markdown backticks.
    
    Context:
    - Minecraft Bedrock Scripting API.
    - Modules available: @minecraft/server, @minecraft/server-ui, @minecraft/server-admin, @minecraft/server-gametest.
    - Always use 'world', 'system', 'Player', 'ItemStack', etc., correctly from the imports.
    - Example import: import { world, system } from "@minecraft/server";
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Prompt: ${prompt}`,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text.replace(/```javascript/g, '').replace(/```/g, '').trim();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "// Error generating code. Please try again.";
  }
};
