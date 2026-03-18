export function getAIResponse(module: string, userMessage: string): string {
  const responses: Record<string, string[]> = {
    junior: [
      "Great job asking that question! 🌟 Let's explore it together! In Montessori learning, we discover things by doing. Can you try drawing what you think the answer might be?",
      "Wow, you're so curious! 🎉 That's what makes a great learner! Let me help you find out. Every question you ask makes you smarter!",
      "Amazing thinking! 🚀 You're earning XP for being such a great learner! Let's break this into small, fun steps...",
      "I love your curiosity! ⭐ In our learning adventure today, let's discover this together. First, tell me what you already know about it!",
      "You did it! 🏆 That's exactly right! You just earned 10 XP and a star! Keep going — you're on a learning mission!",
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
  const randomIndex = Math.floor(Math.random() * moduleResponses.length);
  return moduleResponses[randomIndex];
}
