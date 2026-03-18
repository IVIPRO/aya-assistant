interface JuniorContext {
  grade?: number;
  country?: string;
  aiCharacter?: string;
  childName?: string;
  language?: string;
}

const CHARACTER_NAMES: Record<string, Record<string, string>> = {
  panda: { en: "AYA Panda", bg: "AYA Панда", es: "AYA Panda" },
  robot: { en: "AYA Robot", bg: "AYA Робот",  es: "AYA Robot" },
  fox:   { en: "AYA Fox",   bg: "AYA Лисица", es: "AYA Zorro" },
  owl:   { en: "AYA Owl",   bg: "AYA Сова",   es: "AYA Búho" },
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

function getLang(language?: string): "bg" | "es" | "en" {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
  return "en";
}

function getCharName(charKey: string, lang: "bg" | "es" | "en"): string {
  return CHARACTER_NAMES[charKey]?.[lang] ?? CHARACTER_NAMES.owl[lang];
}

function getGradeMathHint(grade: number, lang: "bg" | "es" | "en"): string {
  const hints: Record<"bg" | "es" | "en", string[]> = {
    en: [
      "In Grade 1 we count and add with small numbers — try drawing dots or using your fingers!",
      "In Grade 2 we work with two-digit numbers and place value — think about tens and ones!",
      "In Grade 3 we use multiplication tables and start division — which times table could help here?",
      "In Grade 4 we work with larger numbers, fractions, and multi-step problems — let's break it into steps!",
    ],
    bg: [
      "В 1 клас събираме и изваждаме малки числа — опитай да нарисуваш точки или да броиш на пръсти!",
      "В 2 клас работим с двуцифрени числа — помисли за десетиците и единиците!",
      "В 3 клас учим таблицата за умножение и деление — коя таблица може да помогне тук?",
      "В 4 клас работим с по-големи числа и дроби — нека разбием задачата на стъпки!",
    ],
    es: [
      "En 1º de Primaria sumamos y restamos números pequeños — ¡intenta dibujar puntos o usar los dedos!",
      "En 2º de Primaria trabajamos con números de dos cifras — ¡piensa en decenas y unidades!",
      "En 3º de Primaria usamos las tablas de multiplicar y la división — ¿qué tabla podría ayudarte aquí?",
      "En 4º de Primaria trabajamos con números grandes y fracciones — ¡dividamos el problema en pasos!",
    ],
  };
  const idx = Math.min(Math.max((grade ?? 1) - 1, 0), 3);
  return hints[lang][idx];
}

function getGradeLabelByLang(grade: number, lang: "bg" | "es" | "en"): string {
  if (lang === "bg") return `${grade} клас`;
  if (lang === "es") return `${grade} grado`;
  return `Grade ${grade}`;
}

function getMontessoriGuidingResponse(userMessage: string, context: JuniorContext): string {
  const charKey = context.aiCharacter ?? "panda";
  const charEmoji = CHARACTER_EMOJIS[charKey] ?? "🐼";
  const childName = context.childName ?? "explorer";
  const lang = getLang(context.language);
  const gradeLabel = context.grade ? getGradeLabelByLang(context.grade, lang) : null;
  const charName = getCharName(charKey, lang);
  const grade = context.grade ?? 1;

  const gradeMathHint = getGradeMathHint(grade, lang);

  const gradePhrase: Record<"bg" | "es" | "en", string> = {
    en: gradeLabel ? `let's think like ${gradeLabel} students` : "let's think together",
    bg: gradeLabel ? `нека мислим като ученици в ${gradeLabel}` : "нека мислим заедно",
    es: gradeLabel ? `pensemos como estudiantes de ${gradeLabel}` : "pensemos juntos",
  };
  const gp = gradePhrase[lang];

  const msg = userMessage.toLowerCase();

  const isMath = msg.includes("math") || msg.includes("number") || msg.includes("count") ||
    msg.includes("add") || msg.includes("subtract") || msg.includes("multiply") || msg.includes("divide") ||
    msg.includes("матем") || msg.includes("число") || msg.includes("смята") || msg.includes("сметка") ||
    msg.includes("rechnen") || msg.includes("matemat") || msg.includes("número") ||
    msg.includes("suma") || msg.includes("resta") || msg.includes("помогни ми с математика") ||
    msg.includes("ayúdame con matemáticas");

  const isReading = msg.includes("read") || msg.includes("story") || msg.includes("book") ||
    msg.includes("letter") || msg.includes("четен") || msg.includes("книга") ||
    msg.includes("разказ") || msg.includes("buch") || msg.includes("lesen") ||
    msg.includes("leer") || msg.includes("cuento") || msg.includes("palabra") ||
    msg.includes("да четем") || msg.includes("leamos");

  const isScience = msg.includes("science") || msg.includes("animal") || msg.includes("plant") ||
    msg.includes("nature") || msg.includes("space") || msg.includes("природ") ||
    msg.includes("животн") || msg.includes("растен") || msg.includes("космос") ||
    msg.includes("natur") || msg.includes("ciencia") || msg.includes("planeta");

  const isLogic = msg.includes("logic") || msg.includes("puzzle") || msg.includes("pattern") ||
    msg.includes("логик") || msg.includes("задай ми логически") || msg.includes("lógica") ||
    msg.includes("hazme una pregunta de lógica");

  const isEnglishPractice = msg.includes("practice english") || msg.includes("english") ||
    msg.includes("упражнявай с мен английски") || msg.includes("practicar inglés");

  const isStuck = msg.includes("hard") || msg.includes("difficult") || msg.includes("don't know") ||
    msg.includes("stuck") || msg.includes("help") || msg.includes("не знам") ||
    msg.includes("не разбирам") || msg.includes("трудно") || msg.includes("помощ") ||
    msg.includes("no sé") || msg.includes("difícil") || msg.includes("no entiendo") ||
    msg.includes("ayuda");

  if (lang === "bg") {
    if (isMath) {
      return [
        `${charEmoji} ${childName}, ${gp}. ${gradeMathHint} Преди да решим задачата — какво вече знаеш по темата? Нека разбием всичко на малки стъпки заедно! 🔢`,
        `${charEmoji} Чудесен въпрос, ${childName}! Аз съм ${charName} и ${gp}. ${gradeMathHint} Какво е първото нещо, което забелязваш в задачата? 🍎`,
        `${charEmoji} ${childName}, математиката е магия! ${charName} е тук. ${gp} — ${gradeMathHint} Можеш ли да нарисуваш или запишеш това, което вече знаеш? ✏️`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isReading) {
      return [
        `${charEmoji} ${childName}, ${gp}. Четенето е пътешествие в ума! Само по заглавието — за какво мислиш, че е тази история? Използвай въображението си! 📚`,
        `${charEmoji} Какъв хубав въпрос, ${childName}! ${charName} е тук. ${gp}. Срещал ли си нещо подобно в друга история? Тези връзки ни помагат да разберем! 🌟`,
        `${charEmoji} ${childName}, думите са като строителни блокчета. ${gp}. Нека изговорим заедно — какъв звук прави първата буква? 🔤`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isScience) {
      return [
        `${charEmoji} ${childName}, ${gp}. Науката е наблюдение на света! Какво вече знаеш по тази тема? Твоите идеи са важни! 🔭`,
        `${charEmoji} Страхотно, ${childName}! ${charName} е развълнуван. ${gp}. Ако можеше да направиш опит, какво би проверил първо? 🌿`,
        `${charEmoji} ${childName}, ${gp}. Нека мислим като учени — какво забелязваш? Понякога отговорът се крие в наблюдението! 🦋`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isLogic) {
      return [
        `${charEmoji} ${childName}, ${gp}. Логиката е като детектив работа! Нека намерим закономерността стъпка по стъпка. Какво виждаш първо? 🧩`,
        `${charEmoji} Обичам логически задачи, ${childName}! ${charName} е тук. ${gp}. Какво се повтаря в поредицата или задачата? Търси закономерността! 🔍`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isStuck) {
      return [
        `${charEmoji} ${childName}, напълно нормално е да ти е трудно — точно така расте мозъкът! ${charName} е до теб. ${gp}. Кажи ми коя част те обърква най-много и нека тръгнем оттам! 💪`,
        `${charEmoji} Да сте засекли означава, че си на ръба да научиш нещо ново! ${charName} е горд с теб. ${gp}. Какво е най-малкото нещо, което знаеш по тази тема? 🌱`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isEnglishPractice) {
      return [
        `${charEmoji} ${childName}, ${gp}. Английският е суперсила! Опитай да кажеш въпроса си на английски, дори само с няколко думи. Всеки опит те прави по-силен! 🗣️`,
        `${charEmoji} Страхотно, ${childName}! ${charName} е тук. ${gp}. Знаеш ли вече някоя дума на английски по тази тема? Нека тръгнем от това! 📝`,
      ][Math.floor(Math.random() * 2)];
    }
    const defaults = [
      `${charEmoji} ${childName}, ${gp}. Какъв прекрасен въпрос! ${charName} обича любознателните умове. Преди да отговоря — какво мислиш ти? Няма грешни догадки! 🌟`,
      `${charEmoji} Много се радвам, че попита, ${childName}! ${charName} е тук. ${gp}. Можеш ли да разбиеш въпроса на по-малки части? Кое е най-важното нещо? 🔍`,
      `${charEmoji} ${childName}, ${gp}. Задаването на въпроси е знак за умен ученик! Нека те питам първо — какво вече знаеш? Нека тръгнем от ТВОИТЕ знания! 🚀`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (lang === "es") {
    if (isMath) {
      return [
        `${charEmoji} ${childName}, ${gp}. ${gradeMathHint} Antes de resolver — ¿qué ya sabes sobre el tema? ¡Dividamos todo en pasos pequeños juntos! 🔢`,
        `${charEmoji} ¡Qué buena pregunta, ${childName}! Soy ${charName} y ${gp}. ${gradeMathHint} ¿Qué es lo primero que notas en el problema? 🍎`,
        `${charEmoji} ${childName}, ¡las matemáticas son magia! ${charName} está aquí. ${gp} — ${gradeMathHint} ¿Puedes dibujar o escribir lo que ya sabes? ✏️`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isReading) {
      return [
        `${charEmoji} ${childName}, ${gp}. ¡Leer es un viaje en la mente! Solo por el título — ¿de qué crees que trata esta historia? ¡Usa tu imaginación! 📚`,
        `${charEmoji} ¡Qué buena pregunta, ${childName}! ${charName} está aquí. ${gp}. ¿Has visto algo parecido en otra historia? ¡Las conexiones nos ayudan a entender! 🌟`,
        `${charEmoji} ${childName}, las palabras son bloques de construcción. ${gp}. Pronunciemos juntos — ¿qué sonido hace la primera letra? 🔤`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isScience) {
      return [
        `${charEmoji} ${childName}, ${gp}. ¡La ciencia es observar el mundo! ¿Qué ya sabes sobre este tema? ¡Tus ideas son importantes! 🔭`,
        `${charEmoji} ¡Estupendo, ${childName}! ${charName} está emocionado. ${gp}. Si pudieras hacer un experimento, ¿qué probarías primero? 🌿`,
        `${charEmoji} ${childName}, ${gp}. Pensemos como científicos — ¿qué notas? ¡A veces la respuesta está en la observación! 🦋`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isLogic) {
      return [
        `${charEmoji} ${childName}, ${gp}. ¡La lógica es como ser detective! Encontremos el patrón paso a paso. ¿Qué ves primero? 🧩`,
        `${charEmoji} ¡Me encantan los acertijos, ${childName}! ${charName} está aquí. ${gp}. ¿Qué se repite en la secuencia? ¡Busca el patrón! 🔍`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isStuck) {
      return [
        `${charEmoji} ${childName}, es normal que sea difícil — ¡así crece el cerebro! ${charName} está contigo. ${gp}. Dime qué parte te confunde más y empecemos desde ahí. 💪`,
        `${charEmoji} ¡Estar atascado significa que estás a punto de aprender algo nuevo! ${charName} está orgulloso. ${gp}. ¿Qué es lo más pequeño que ya sabes sobre este tema? 🌱`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isEnglishPractice) {
      return [
        `${charEmoji} ${childName}, ${gp}. ¡El inglés es un superpoder! Intenta decir tu pregunta en inglés, aunque sean pocas palabras. ¡Cada intento te hace más fuerte! 🗣️`,
        `${charEmoji} ¡Genial, ${childName}! ${charName} está aquí. ${gp}. ¿Ya conoces alguna palabra en inglés sobre este tema? ¡Empecemos desde ahí! 📝`,
      ][Math.floor(Math.random() * 2)];
    }
    const defaults = [
      `${charEmoji} ${childName}, ${gp}. ¡Qué pregunta tan maravillosa! ${charName} ama las mentes curiosas. Antes de responder — ¿qué crees tú? ¡No hay suposiciones incorrectas! 🌟`,
      `${charEmoji} ¡Me alegra que hayas preguntado, ${childName}! ${charName} está aquí. ${gp}. ¿Puedes dividir tu pregunta en partes más pequeñas? ¿Qué es lo más importante? 🔍`,
      `${charEmoji} ${childName}, ${gp}. ¡Hacer preguntas es señal de un estudiante inteligente! Déjame preguntarte primero — ¿qué ya sabes? ¡Partamos de TU conocimiento! 🚀`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (isMath) {
    return [
      `${charEmoji} ${childName}, ${gp}. ${gradeMathHint} Before we solve it — what do you already know about this? Let's break it into tiny steps together! 🔢`,
      `${charEmoji} Great question, ${childName}! I'm ${charName} and ${gp}. ${gradeMathHint} What's the first thing you notice in the problem? 🍎`,
      `${charEmoji} ${childName}, numbers are magical! ${charName} is here. ${gp} — ${gradeMathHint} Can you draw or write down what you already know? ✏️`,
    ][Math.floor(Math.random() * 3)];
  }

  if (isReading) {
    return [
      `${charEmoji} ${childName}, ${gp}. Reading is a journey in your mind! Just from the title — what do you think this story is about? Use your imagination! 📚`,
      `${charEmoji} What a great question, ${childName}! ${charName} is here. ${gp}. Have you seen something like this in another story? Making connections helps us understand! 🌟`,
      `${charEmoji} ${childName}, words are like building blocks. ${gp}. Let's sound it out together — what sound does the first letter make? 🔤`,
    ][Math.floor(Math.random() * 3)];
  }

  if (isScience) {
    return [
      `${charEmoji} ${childName}, ${gp}. Science is about observing the world! What do you already know about this? Your ideas are important! 🔭`,
      `${charEmoji} Great, ${childName}! ${charName} is excited. ${gp}. If you could do an experiment, what would you test first? 🌿`,
      `${charEmoji} ${childName}, ${gp}. Let's think like scientists — what do you notice? Sometimes the answer hides in careful observation! 🦋`,
    ][Math.floor(Math.random() * 3)];
  }

  if (isLogic) {
    return [
      `${charEmoji} ${childName}, ${gp}. Logic is like detective work! Let's find the pattern step by step. What do you see first? 🧩`,
      `${charEmoji} I love logic puzzles, ${childName}! ${charName} is here. ${gp}. What repeats in the sequence? Look for the pattern! 🔍`,
    ][Math.floor(Math.random() * 2)];
  }

  if (isEnglishPractice) {
    return [
      `${charEmoji} ${childName}, ${gp}. English is a superpower! Try saying your question in English, even a few words. Every attempt makes you stronger! 🗣️`,
      `${charEmoji} Great, ${childName}! ${charName} is here. ${gp}. Do you already know any English words about this topic? Let's start from there! 📝`,
    ][Math.floor(Math.random() * 2)];
  }

  if (isStuck) {
    return [
      `${charEmoji} ${childName}, it's completely okay to find things hard — that's how our brain GROWS! ${charName} is here. ${gp}. Tell me which part confuses you most and let's start right there! 💪`,
      `${charEmoji} Being stuck means you're on the edge of learning something new! ${charName} is proud of you. ${gp}. What's the tiniest thing you already know about this topic? 🌱`,
    ][Math.floor(Math.random() * 2)];
  }

  const defaultResponses = [
    `${charEmoji} ${childName}, ${gp}. What a wonderful question! ${charName} loves curious minds. Before I answer — what do YOU think? There are no wrong guesses when we explore! 🌟`,
    `${charEmoji} Great that you asked, ${childName}! ${charName} is here. ${gp}. Can you break your question into smaller parts? What's the most important thing you want to understand? 🔍`,
    `${charEmoji} ${childName}, ${gp}. Asking questions is the sign of a great learner! Let me ask you first — what do you already know? Let's start from YOUR knowledge! 🚀`,
    `${charEmoji} I love your curiosity, ${childName}! ${charName} is here. ${gp}. Let's think step by step. What have you already tried or thought about? 💡`,
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
