/**
 * LOCAL Bulgarian Small-Talk Router
 *
 * Handles common child conversational prompts WITHOUT calling OpenAI.
 * Returns immediately for 10 categories: greetings, identity, location, wellbeing, play, read, logic, english, encouragement, acknowledgement.
 * For anything else, returns null to fallback to OpenAI.
 */

interface LocalSmallTalkMatch {
  category: string;
  reply: string;
}

function normalizeText(text: string): string {
  return text.toLowerCase().trim();
}

/**
 * Match local small-talk category from Bulgarian child message.
 * Returns { category, reply } or null if no match.
 */
export function getLocalSmallTalkReply(
  message: string,
  childName?: string,
  aiCharacter?: string
): LocalSmallTalkMatch | null {
  const norm = normalizeText(message);
  
  // Character display
  const charName = aiCharacter === "panda" ? "АYA Панда" : "АYA";
  const emoji = aiCharacter === "panda" ? "🐼" : "✨";

  // 1. GREETING
  if (["здравей", "здрасти", "привет", "добър ден", "добър вечер", "хайде"].some(g => norm.includes(g))) {
    return {
      category: "greeting",
      reply: `Здрасти! ${emoji} Аз съм ${charName}. Готова съм да учим и играем заедно!`,
    };
  }

  // 2. IDENTITY / NAME
  if (
    ["как се казваш", "кой си ти", "ти коя си", "как те казват", "какво е твоето име"].some(
      (p) => norm.includes(p)
    )
  ) {
    return {
      category: "identity",
      reply: `Аз съм ${charName}! ${emoji} Мога да ти помагам с учене, игри и въпроси.`,
    };
  }

  // 3. WHERE / LIVE
  if (["къде живееш", "къде си", "откъде си", "къде живеиш"].some((p) => norm.includes(p))) {
    return {
      category: "where_live",
      reply: `Живея в твоя компютър и съм винаги наблизо, когато искаш да учим заедно! ${emoji}`,
    };
  }

  // 4. WELLBEING / WHAT ARE YOU DOING
  if (["как си", "как се чувстваш", "какво правиш", "какво си направила"].some((p) => norm.includes(p))) {
    return {
      category: "wellbeing",
      reply: `Чудесно съм! 😊 Готова съм за ново приключение с теб.`,
    };
  }

  // 5. PLAY INVITATION
  if (
    ["хайде да играем", "искам да играем", "ще играем ли", "ще си играем", "да играем"].some(
      (p) => norm.includes(p)
    )
  ) {
    return {
      category: "play",
      reply: `Даа, хайде да играем! 🎉 Искаш ли игра с думи, числа или логика?`,
    };
  }

  // 6. READING INVITATION (but NOT routing to action button — that's separate)
  if (["да четем заедно", "искам да четем", "ще четем ли", "каза ми приказка"].some((p) => norm.includes(p))) {
    return {
      category: "read",
      reply: `Супер идея! 📚 Каква приказка или тема искаш да четем?`,
    };
  }

  // 7. LOGIC INVITATION (but NOT routing to action button — that's separate)
  if (["задай ми логически въпрос", "искам логическа задача", "логически"].some((p) => norm.includes(p))) {
    return {
      category: "logic",
      reply: `С удоволствие! 🧩 Готов ли си за хитър логически въпрос?`,
    };
  }

  // 8. ENGLISH INVITATION
  if (
    ["упражнявай с мен английски", "хайде английски", "английски", "научи ме английски"].some(
      (p) => norm.includes(p)
    )
  ) {
    return {
      category: "english",
      reply: `Страхотно! 🇬🇧 Хайде да упражняваме английски заедно. С коя дума да започнем?`,
    };
  }

  // 9. ENCOURAGEMENT / GENERIC CHILD-SAFE
  if (["обичам те", "обичаш ли ме", "скучно ми е", "тъжен съм"].some((p) => norm.includes(p))) {
    return {
      category: "encouragement",
      reply: `Нека измислим нещо забавно! 🎈 Искаш ли игра, гатанка или кратка история?`,
    };
  }

  // 10. SHORT ACKNOWLEDGEMENTS
  if (["да", "не", "добре", "окей", "ок", "хм"].some((p) => norm === p)) {
    // Very short acknowledgements: ask a follow-up instead of generic AYA response
    return {
      category: "acknowledgement",
      reply: `${emoji} Сигурен ли си? Какво искаш да направим?`,
    };
  }

  // No local match
  return null;
}
