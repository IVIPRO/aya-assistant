interface JuniorContext {
  grade?: number;
  country?: string;
  aiCharacter?: string;
  childName?: string;
}

const CHARACTER_NAMES: Record<string, string> = {
  panda: "Panda Teacher",
  robot: "Robot Guide",
  fox: "Fox Mentor",
  owl: "Owl Professor",
};

const CHARACTER_EMOJIS: Record<string, string> = {
  panda: "🐼",
  robot: "🤖",
  fox: "🦊",
  owl: "🦉",
};

function getGradeLabel(grade: number, country?: string): string {
  const c = (country ?? "").toUpperCase().slice(0, 2);
  if (c === "DE") return `Klasse ${grade}`;
  if (c === "ES") return `${grade}º de Primaria`;
  if (c === "BG") return `${grade} клас`;
  if (c === "GB") return `Year ${grade + 1}`;
  return `Grade ${grade}`;
}

function getMontessoriGuidingResponse(userMessage: string, context: JuniorContext): string {
  const charKey = context.aiCharacter ?? "owl";
  const charName = CHARACTER_NAMES[charKey] ?? "Owl Professor";
  const charEmoji = CHARACTER_EMOJIS[charKey] ?? "🦉";
  const gradeLabel = context.grade ? getGradeLabel(context.grade, context.country) : "your class";
  const childName = context.childName ? `${context.childName}` : "explorer";

  const msg = userMessage.toLowerCase();

  if (msg.includes("math") || msg.includes("number") || msg.includes("count") || msg.includes("add") || msg.includes("subtract") || msg.includes("multiply") || msg.includes("матем") || msg.includes("число") || msg.includes("rechnen")) {
    return [
      `${charEmoji} Great math question, ${childName}! I'm your ${charName}. Before I give you the answer, let me ask — what do you think might happen if you tried it step by step? For ${gradeLabel}, we love to break big problems into tiny pieces. Can you start with just the first part? 🔢`,
      `${charEmoji} Ooh, I see you're thinking about numbers! That's what great ${gradeLabel} mathematicians do! ${charName} here — let's explore together. If you had 5 apples and someone gave you 3 more, what would you do to find out how many you have? What do you already know? 🍎`,
      `${charEmoji} Excellent! Numbers are like a magical code, ${childName}! Your ${charName} loves this question. Instead of telling you right away, I want you to discover it. Can you draw it out? Sometimes drawing numbers helps us see the answer! ✏️`,
    ][Math.floor(Math.random() * 3)];
  }

  if (msg.includes("read") || msg.includes("story") || msg.includes("book") || msg.includes("word") || msg.includes("letter") || msg.includes("четен") || msg.includes("buch") || msg.includes("lesen")) {
    return [
      `${charEmoji} Oh, I love reading too, ${childName}! ${charName} here. Reading is like going on an adventure in your mind. Before we look for the answer — what do you think this story might be about just from looking at the title? Use your imagination! 📚`,
      `${charEmoji} What a thoughtful reading question! In ${gradeLabel}, we learn that good readers ask questions like you just did. ${charName} wants to know — have you heard or seen something like this before in a story? Making connections helps us understand! 🌟`,
      `${charEmoji} Wonderful, ${childName}! Words are like building blocks. ${charName} here to guide you. Let's sound it out together — what sound does the first letter make? Sometimes that's all we need to get started! 🔤`,
    ][Math.floor(Math.random() * 3)];
  }

  if (msg.includes("science") || msg.includes("animal") || msg.includes("plant") || msg.includes("nature") || msg.includes("space") || msg.includes("природ") || msg.includes("natur") || msg.includes("ciencia")) {
    return [
      `${charEmoji} A science explorer question! ${charName} is SO excited! ${childName}, science is about observing the world around us. Before I explain, can you tell me — what do YOU already know or think about this? Your ideas are important! 🔭`,
      `${charEmoji} Great scientific thinking, ${childName}! In ${gradeLabel}, we learn by exploring. Your ${charName} has a question back for you — if you could do an experiment to find out, what would you test first? Curiosity is the best scientist! 🌿`,
      `${charEmoji} Science is everywhere, ${childName}! ${charName} here. Let's think like scientists. What do you already notice about this? Sometimes the best answers come from careful observation. What do your senses tell you? 🦋`,
    ][Math.floor(Math.random() * 3)];
  }

  if (msg.includes("english") || msg.includes("speak") || msg.includes("say") || msg.includes("word") || msg.includes("grammar")) {
    return [
      `${charEmoji} English practice — wonderful, ${childName}! ${charName} loves language! The best way to learn English is to USE it bravely. Can you try saying your question or thought in English, even if it's just a few words? Every attempt makes you stronger! 🗣️`,
      `${charEmoji} Language learning is a superpower, ${childName}! ${charName} here. In ${gradeLabel}, we build our vocabulary step by step. Can you think of a word you already know that's similar? Building on what you know is the Montessori way! 📝`,
    ][Math.floor(Math.random() * 2)];
  }

  if (msg.includes("hard") || msg.includes("difficult") || msg.includes("don't know") || msg.includes("stuck") || msg.includes("help")) {
    return [
      `${charEmoji} ${childName}, it's completely okay to find things hard — that's how our brain GROWS! ${charName} is here with you. Let's take it one tiny step at a time. What's the very first thing you know about this topic? Even the tiniest thing counts! 💪`,
      `${charEmoji} Being stuck just means you're on the edge of learning something new — how exciting! ${charName} is proud of you for trying. Let's make it easier. Can you tell me what part confuses you most? Let's start RIGHT there! 🌱`,
    ][Math.floor(Math.random() * 2)];
  }

  const defaultResponses = [
    `${charEmoji} What a wonderful question, ${childName}! ${charName} loves curious minds! In Montessori learning, we discover things together. Before I tell you, I wonder — what do YOU think the answer might be? There are no wrong guesses when we're exploring! 🌟`,
    `${charEmoji} Oh, I'm so glad you asked that, ${childName}! ${charName} here, your guide for ${gradeLabel}. Let's approach this like a little scientist. Can you break your question into smaller parts? What's the most important thing you want to understand? 🔍`,
    `${charEmoji} Amazing thinking, ${childName}! You know what makes a great learner? Asking questions! ${charName} is here to explore with you. Let me ask you something first — what do you already know about this? Let's start from YOUR knowledge and build up! 🚀`,
    `${charEmoji} I love your curiosity, ${childName}! ${charName} is excited to learn WITH you today. In ${gradeLabel}, we're building new skills every day. Let's think about this step by step. First — what have you already tried or thought about? 💡`,
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

export function getAIResponse(module: string, userMessage: string, context?: JuniorContext): string {
  if (module === "junior" && context) {
    return getMontessoriGuidingResponse(userMessage, context);
  }

  const responses: Record<string, string[]> = {
    junior: [
      "Great job asking that question! 🌟 Let's explore it together! Can you try drawing what you think the answer might be?",
      "Wow, you're so curious! 🎉 That's what makes a great learner! Every question you ask makes you smarter!",
      "Amazing thinking! 🚀 Let's break this into small, fun steps...",
      "I love your curiosity! ⭐ Tell me what you already know about it first!",
    ],
    student: [
      "Great question! Let me explain this step by step. First, let's understand the core concept, then we'll work through some examples together.",
      "This is a common topic many students find challenging. Here's how I'd approach it: Start by identifying the key terms, then break the problem into smaller parts.",
      "Let me help you understand this better. The key here is to recognize the pattern. Think about what you already know about this subject.",
      "Excellent! You're on the right track. To fully grasp this concept, let's review the fundamentals first, then apply them to your specific question.",
      "I can see you're working hard on this. Here's a helpful tip: try to connect this new concept to something you already understand well.",
    ],
    family: [
      "That's a great idea for the family! I've made a note of that. Would you like me to add it to your family task list or calendar?",
      "Family coordination can be challenging! Here's a suggestion: try assigning specific days for different household tasks so everyone knows their responsibilities.",
      "I remember you mentioned this topic before. Based on your family's preferences, here's what I'd suggest...",
      "Great planning! Keeping the family organized helps everyone feel less stressed. Would you like me to set a reminder for this?",
      "I can help coordinate that! Let me check your family calendar and find the best time that works for everyone.",
    ],
    psychology: [
      "I hear you, and it's completely okay to feel that way. Your feelings are valid and important. Take a deep breath — you're not alone in this.",
      "Thank you for sharing that with me. It takes courage to talk about how we feel. What you're experiencing is very understandable given the situation.",
      "I'm here to listen. Sometimes just putting our feelings into words can help us understand them better. How long have you been feeling this way?",
      "That sounds really tough, and I appreciate you trusting me with this. Let's think together about some gentle steps that might help you feel better.",
      "You're showing great self-awareness by recognizing these feelings. Remember that it's okay to ask for support — that's a sign of strength, not weakness.",
    ],
  };

  const moduleResponses = responses[module] || responses.family;
  return moduleResponses[Math.floor(Math.random() * moduleResponses.length)];
}
