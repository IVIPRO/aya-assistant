/**
 * TTS Route for AYA
 * Provides server-side text-to-speech using OpenAI API
 */

import { Router, type IRouter, type Request, type Response } from "express";
import { generateAyaTTS } from "../lib/openaiTts";

const router: IRouter = Router();

interface TtsRequest {
  text: string;
  mode?: "junior" | "student" | "family" | "psychology";
}

/**
 * POST /api/tts/aya
 * Converts text to speech using OpenAI TTS
 * Returns audio/mpeg buffer
 */
router.post("/aya", async (req: Request, res: Response) => {
  try {
    const { text, mode } = req.body as TtsRequest;

    // Validate request
    if (!text || typeof text !== "string") {
      res.status(400).json({ error: "Missing or invalid 'text' field" });
      return;
    }

    // Generate speech
    const audioBuffer = await generateAyaTTS(text, { mode });

    // Return audio file
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.length);
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.send(audioBuffer);
  } catch (error) {
    const status = (error as any)?.status;
    
    // Handle quota errors gracefully — return 429 and log diagnostic
    if (status === 429 || (error instanceof Error && error.message === "insufficient_quota")) {
      console.warn("[TTS_QUOTA] OpenAI quota exhausted. Client will fall back to browser speech.");
      res.status(429).json({ error: "TTS quota exceeded" });
      return;
    }
    
    // Handle other errors — return 500
    console.error("[TTS_ROUTE_ERROR]", error instanceof Error ? error.message : String(error));
    res.status(500).json({
      error: "Failed to generate speech",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
