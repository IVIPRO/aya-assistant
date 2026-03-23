/**
 * OpenAI Text-to-Speech helper for AYA
 * Provides consistent voice for Listening Mode across desktop and mobile.
 * Uses the Replit AI integration proxy (AI_INTEGRATIONS_OPENAI_BASE_URL).
 */

import OpenAI from "openai";

interface TtsOptions {
  mode?: "junior" | "student" | "family" | "psychology";
}

// Voice configuration per mode
const VOICE_CONFIG: Record<string, string> = {
  junior:     "nova",    // Softer, warmer voice for younger children
  student:    "nova",    // Clear, focused voice for students
  family:     "nova",    // Warm, engaging voice for family mode
  psychology: "shimmer", // Calmer, more measured voice
};

function getOpenAIClient(): OpenAI {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "sk-placeholder";
  if (!baseURL) throw new Error("AI_INTEGRATIONS_OPENAI_BASE_URL is not set");
  return new OpenAI({ baseURL, apiKey });
}

/**
 * Convert text to speech using OpenAI TTS API.
 * Returns audio buffer (mp3).
 */
export async function generateAyaTTS(text: string, options?: TtsOptions): Promise<Buffer> {
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  const trimmedText = text.trim().substring(0, 4096);
  const voice = VOICE_CONFIG[options?.mode ?? "junior"];

  try {
    const openai = getOpenAIClient();

    const speechResponse = await openai.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice: voice as "alloy" | "nova" | "shimmer" | "echo" | "fable" | "onyx",
      input: trimmedText,
      response_format: "mp3",
    });

    const arrayBuffer = await speechResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    const status = (error as any)?.status;

    if (status === 429) {
      console.warn("[TTS_QUOTA_ERROR] OpenAI quota exceeded. Falling back to browser speech.");
      const quotaError = new Error("insufficient_quota");
      (quotaError as any).status = 429;
      throw quotaError;
    }

    console.error("[TTS_ERROR]", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
