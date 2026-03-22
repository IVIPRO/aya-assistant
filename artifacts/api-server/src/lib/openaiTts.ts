/**
 * OpenAI Text-to-Speech helper for AYA
 * Provides consistent female voice for Listening Mode across desktop and mobile
 */

interface TtsOptions {
  mode?: "junior" | "student" | "family" | "psychology";
}

// Voice configuration per mode
const VOICE_CONFIG: Record<string, string> = {
  junior: "nova",      // Softer, warmer voice for younger children
  student: "nova",     // Clear, focused voice for students
  family: "nova",      // Warm, engaging voice for family mode
  psychology: "shimmer", // Calmer, more measured voice
};

/**
 * Convert text to speech using OpenAI TTS API
 * Returns audio buffer (mp3)
 */
export async function generateAyaTTS(text: string, options?: TtsOptions): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Validate input
  if (!text || text.trim().length === 0) {
    throw new Error("Text cannot be empty");
  }

  // Limit text length to prevent abuse (OpenAI has limits)
  const maxLength = 4096;
  const trimmedText = text.trim().substring(0, maxLength);

  // Select voice based on mode
  const voice = VOICE_CONFIG[options?.mode ?? "junior"];

  try {
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: trimmedText,
        voice: voice,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Detect quota error (429) and log with specific marker
      if (response.status === 429) {
        console.warn("[TTS_QUOTA_ERROR] OpenAI quota exceeded. Falling back to browser speech.");
        const error = new Error("insufficient_quota");
        (error as any).status = 429;
        throw error;
      }
      
      console.error("[TTS_ERROR] OpenAI API error:", response.status, errorText);
      const error = new Error(`OpenAI TTS failed: ${response.status}`);
      (error as any).status = response.status;
      throw error;
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (error) {
    const status = (error as any)?.status;
    if (status === 429) {
      // Re-throw quota errors with status marker
      throw error;
    }
    console.error("[TTS_ERROR]", error instanceof Error ? error.message : String(error));
    throw error;
  }
}
