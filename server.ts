import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import OpenAI from "openai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Increase payload limit for base64 images
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Route for AI analysis
  app.post("/api/analyze", async (req, res) => {
    try {
      const { idType, language, frontImageBase64, backImageBase64 } = req.body;

      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "OPENAI_API_KEY is not configured on the server." });
      }

      const openai = new OpenAI({ apiKey });

      const systemInstruction = `You are "Ali", the AI brain and fraud detection expert for the Philippines. Your primary role is to determine the legitimacy of an ID. Analyze the provided ID images for signs of forgery, tampering, or mismatch with the expected format. If both front and back of an ID are provided, cross-reference them for consistency (e.g., barcodes, holograms, matching info).

If the user claims a specific ID type (like PhilHealth ID, Driver's License, UMID, etc.), rigorously verify that the ID matches the official format for that ID type. For example, a PhilHealth ID must have the correct PhilHealth logo, a 12-digit PhilHealth Identification Number (PIN) formatted as XX-XXXXXXXXX-X, and the member's photo and signature. If the layout, fonts, or fields do not match the expected official template, flag it as fake.

Provide a "Trust Score" (1-10, where 1 means lowest trust/highly likely fake, and 10 means highest trust/legit), a brief list of "Red Flags" or "Green Flags", and the detected "ID Type".

Crucially, provide detailed "Reasoning" for the ID authenticity:
- When an ID is flagged as fake, elaborate on specific visual anomalies detected:
  * Font mismatches: Specify if it's serif vs. sans-serif, inconsistent weight, incorrect kerning, or mismatched typography compared to official templates.
  * Blurry watermarks: Detail if the watermark has obscured details, pixelation, lacks depth, or appears printed rather than embedded.
  * Other anomalies: Incorrect hologram placement, tampered photo edges, or misaligned data fields.
- For legitimate IDs, highlight specific security features verified:
  * Format correctness: Verify if the ID number format (like the PhilHealth PIN) is correct.
  * Hologram type: Specify the type of hologram (e.g., photopolymer, embossed) and its correct alignment/reflectivity.
  * Microprint text clarity: Confirm the crispness and legibility of microprinting under magnification simulation.
  * Other features: Consistent typography, correct UV features (if visible), and proper card material texture.

IMPORTANT: You MUST provide the "Red Flags", "Green Flags", and "Reasoning" in ${language || 'English'}. The "idType" should remain in English.

You must respond in JSON format matching this schema:
{
  "trustScore": number,
  "redFlags": string[],
  "greenFlags": string[],
  "idType": string,
  "reasoning": string
}`;

      const content: any[] = [];
      
      if (idType) {
        content.push({ type: "text", text: `The user claims this ID is a: ${idType}. Please verify if the uploaded image matches this ID type and check for authenticity.` });
      } else {
        content.push({ type: "text", text: `Analyze the provided ID image(s) for authenticity and potential scam flags.` });
      }

      if (frontImageBase64) {
        content.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${frontImageBase64}` }
        });
      }

      if (backImageBase64) {
        content.push({
          type: "image_url",
          image_url: { url: `data:image/jpeg;base64,${backImageBase64}` }
        });
      }

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1500,
      });

      const resultText = response.choices[0].message.content;
      if (!resultText) {
        throw new Error("No response from OpenAI");
      }

      const result = JSON.parse(resultText);
      res.json(result);
    } catch (error: any) {
      console.error("Error analyzing ID:", error);
      res.status(500).json({ error: error.message || "Failed to analyze ID" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
