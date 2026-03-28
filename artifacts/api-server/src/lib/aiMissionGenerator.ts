import OpenAI from "openai";
import type { CurriculumMission } from "./curriculum";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Zone subject context ─────────────────────────────────────────────────────

const ZONE_CONTEXT: Record<string, { en: string; bg: string; subjects: string[] }> = {
  "Math Island": {
    en: "mathematics — numbers, counting, arithmetic, shapes, and measurement",
    bg: "математика — числа, смятане, аритметика, форми и измервания",
    subjects: ["Mathematics", "Математика"],
  },
  "Reading Forest": {
    en: "reading, stories, comprehension, Bulgarian language, vocabulary, and writing",
    bg: "четене, истории, разбиране, български език, речник и писане",
    subjects: ["Bulgarian Language", "Български език", "Reading", "Четене"],
  },
  "Logic Mountain": {
    en: "logic, patterns, sequences, problem-solving, critical thinking, and puzzles",
    bg: "логика, закономерности, редици, решаване на задачи и пъзели",
    subjects: ["Logic", "Логика", "Thinking"],
  },
  "English City": {
    en: "English language — vocabulary, greetings, basic sentences, colors, numbers, and conversation",
    bg: "английски език — речник, поздрави, изречения, цветове и разговори",
    subjects: ["English Language", "Английски език", "English"],
  },
  "Science Planet": {
    en: "nature, animals, plants, seasons, weather, the human body, and basic science",
    bg: "природен свят, животни, растения, сезони, времето, човешкото тяло и наука",
    subjects: ["Science", "Nature", "Природен свят", "Наука"],
  },
};

// ─── Difficulty distribution by grade ────────────────────────────────────────

function getDifficultySet(grade: number): string {
  if (grade <= 1) return "4 easy, 1 medium";
  if (grade === 2) return "3 easy, 2 medium";
  if (grade === 3) return "2 easy, 2 medium, 1 hard";
  return "1 easy, 2 medium, 2 hard";
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildMissionSystemPrompt(): string {
  return `You are AYA, an educational AI creating learning missions for primary school children (ages 6–10).
Each mission must be specific, actionable, age-appropriate, and educationally meaningful.
Return only valid JSON — no markdown, no commentary, just the JSON object.`;
}

function buildMissionUserPrompt(
  zone: string,
  grade: number,
  country: string,
  completedTitles: string[],
): string {
  const isBG = country.toUpperCase().startsWith("BG");
  const langKey = isBG ? "bg" : "en";
  const zoneCtx = ZONE_CONTEXT[zone];
  const zoneDescription = zoneCtx?.[langKey] ?? zone;
  const difficultySet = getDifficultySet(grade);
  const gradeLabel = isBG ? `${grade} клас (Bulgarian МОН curriculum)` : `Grade ${grade}`;
  const lang = isBG ? "Bulgarian" : "English";

  const avoidInstruction =
    completedTitles.length > 0
      ? `\n\nIMPORTANT — Do NOT generate missions with these titles or very similar titles (they are already completed):\n${completedTitles.map((t) => `- "${t}"`).join("\n")}`
      : "";

  const culturalNote = isBG
    ? `\n\nCultural note: This is a Bulgarian child. Use Bulgarian examples, names, places, and curriculum context where fitting. Subject names should be in Bulgarian.`
    : "";

  return `Generate exactly 5 fresh, unique learning missions for a ${gradeLabel} student.

Zone: "${zone}" — Focus topic: ${zoneDescription}
Mission language: ${lang}
Difficulty distribution: ${difficultySet}${avoidInstruction}${culturalNote}

Each mission must:
- Be specific and concrete (not generic like "learn math")
- Be completable in 5–15 minutes
- Have a clear learning objective
- Feel like a fun adventure or challenge

Return a JSON object with a "missions" array of exactly 5 items:
{
  "missions": [
    {
      "title": "string — engaging mission title (max 6 words)",
      "description": "string — what the child will do (1–2 sentences, child-friendly, exciting tone)",
      "subject": "string — the subject name in ${lang}",
      "zone": "${zone}",
      "difficulty": "easy" | "medium" | "hard",
      "xpReward": number between 25 and 70,
      "starReward": 1 or 2
    }
  ]
}

Rules:
- Title must be unique and specific (e.g. "Count Forest Animals" not "Practice Math")
- Description must describe a concrete activity, not vague study
- xpReward: easy=25–40, medium=40–55, hard=55–70
- starReward: 1 for easy/medium, 2 for hard
- All text must be in ${lang}`;
}

// ─── Validator ────────────────────────────────────────────────────────────────

function validateAndSanitizeMissions(
  raw: unknown,
  zone: string,
): CurriculumMission[] {
  if (typeof raw !== "object" || raw === null) throw new Error("Not an object");
  const obj = raw as Record<string, unknown>;
  const arr = obj["missions"];
  if (!Array.isArray(arr) || arr.length === 0) throw new Error("No missions array");

  const validDifficulties = new Set<string>(["easy", "medium", "hard"]);

  return arr.slice(0, 5).map((item, i) => {
    const m = item as Record<string, unknown>;
    const title = String(m["title"] ?? `Mission ${i + 1}`).trim().slice(0, 100);
    const description = String(m["description"] ?? "Complete this mission.").trim().slice(0, 400);
    const subject = String(m["subject"] ?? "Learning").trim().slice(0, 80);
    const difficulty = validDifficulties.has(String(m["difficulty"]))
      ? (String(m["difficulty"]) as "easy" | "medium" | "hard")
      : "easy";
    const xpReward = Math.min(Math.max(Math.round(Number(m["xpReward"]) || 40), 20), 80);
    const starReward = Number(m["starReward"]) === 2 ? 2 : 1;
    return { title, description, subject, zone, difficulty, xpReward, starReward };
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function generateAIMissions(
  zone: string,
  grade: number,
  country: string,
  completedTitles: string[],
): Promise<CurriculumMission[]> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not set — cannot generate AI missions");
  }

  console.log(
    `[AI_MISSIONS] Generating: zone="${zone}" grade=${grade} country=${country} completed=${completedTitles.length}`,
  );

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: buildMissionSystemPrompt() },
      { role: "user", content: buildMissionUserPrompt(zone, grade, country, completedTitles) },
    ],
    max_tokens: 1500,
    temperature: 0.9,
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty AI response for missions");

  const parsed: unknown = JSON.parse(raw);
  const missions = validateAndSanitizeMissions(parsed, zone);

  console.log(
    `[AI_MISSIONS] Success: zone="${zone}" generated=${missions.length} titles=[${missions.map((m) => m.title).join(", ")}]`,
  );

  return missions;
}
