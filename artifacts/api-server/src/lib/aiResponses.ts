interface JuniorContext {
  grade?: number;
  country?: string;
  aiCharacter?: string;
  childName?: string;
  language?: string;
  lastMissionTopic?: string;
  lastInteractionTime?: Date;
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

export function getLang(language?: string): "bg" | "es" | "en" {
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

/**
 * Detect if the message is a casual greeting or friendly chat (vs educational content)
 */
function detectGreetingIntent(msg: string, lang: "bg" | "es" | "en"): boolean {
  const msgLower = msg.toLowerCase().trim();
  
  // Bulgarian greetings and casual chat
  if (lang === "bg") {
    const greetings = [
      "здравей", "здраво", "привет",
      "как си", "как е", "как си днес",
      "какво правиш", "какво правиш ти",
      "разкажи ми", "разкажи ми нещо", "всичко ли е добре",
      "добро утро", "добра вечер", "добър ден",
      "пък ти", "как дела", "как дела днес",
      "щом е да е", "стави ми загадка"
    ];
    return greetings.some(greeting => msgLower.includes(greeting));
  }
  
  // Spanish greetings and casual chat
  if (lang === "es") {
    const greetings = [
      "hola", "¿hola?", "hey",
      "¿cómo estás", "¿cómo e", "¿cómo está",
      "¿qué haces", "¿qué tal",
      "cuéntame", "cuéntame algo", "dime algo",
      "buenos días", "buenas tardes", "buenas noches",
      "¿todo bien", "¿qué tal el día", "¿cómo fue el día"
    ];
    return greetings.some(greeting => msgLower.includes(greeting));
  }
  
  // English greetings and casual chat
  const greetings = [
    "hi", "hello", "hey",
    "how are you", "how are you doing", "how is it going",
    "what are you doing", "what's up",
    "tell me", "tell me something", "tell me a story",
    "good morning", "good evening", "good afternoon",
    "how's it going", "how have you been", "everything okay"
  ];
  return greetings.some(greeting => msgLower.includes(greeting));
}

/**
 * Generate a friendly chat response for greetings and casual conversation
 * Uses memory to personalize greetings with child name and previous topics
 */
function getFriendlyChatResponse(context: JuniorContext): string {
  const charKey = context.aiCharacter ?? "panda";
  const charEmoji = CHARACTER_EMOJIS[charKey] ?? "🐼";
  const childName = context.childName ?? "friend";
  const lang = getLang(context.language);
  const lastTopic = context.lastMissionTopic;

  // Memory-aware greeting options
  if (lang === "bg") {
    const options = [
      // Basic greetings
      `${charEmoji} Здравей, ${childName}! Радвам се да те чуя! 😊 Как мога да ти помогна днес?`,
      `${charEmoji} Привет! Всичко ли е добре? Щом нещо те интересува, просто ми кажи! 🌟`,
      `${charEmoji} Здравей, ${childName}! Аз съм тук и готов да те помогна с което и да е — задачи, въпроси, все едно! ✨`,
      `${charEmoji} Здравo! Как дела днес? Кажи ми какво те занима! 🎉`,
    ];
    
    // If we have memory of last topic, add context-aware greeting
    if (lastTopic) {
      options.push(
        `${charEmoji} Здравей отново, ${childName}! Последно работихме с ${lastTopic}. Искаш ли да продължим или предпочиташ нещо ново? 🚀`,
        `${charEmoji} Здравей, ${childName}! Помниш ли ${lastTopic}? Можем да преговорим или да открием нещо ново! 🌟`
      );
    }
    
    return options[Math.floor(Math.random() * options.length)];
  }
  
  if (lang === "es") {
    const options = [
      // Basic greetings
      `${charEmoji} ¡Hola, ${childName}! ¡Me alegra verte! 😊 ¿Cómo puedo ayudarte hoy?`,
      `${charEmoji} ¡Hola! ¿Qué tal el día? Si hay algo que necesites, ¡dímelo! 🌟`,
      `${charEmoji} ¡Hola, ${childName}! Estoy aquí para ayudarte con tareas, preguntas, ¡lo que sea! ✨`,
      `${charEmoji} ¡Hola! ¿Cómo estás? ¡Cuéntame qué te interesa! 🎉`,
    ];
    
    // If we have memory of last topic, add context-aware greeting
    if (lastTopic) {
      options.push(
        `${charEmoji} ¡Hola, ${childName}! Último trabajamos con ${lastTopic}. ¿Quieres continuar o prefieres algo nuevo? 🚀`,
        `${charEmoji} ¡Hola, ${childName}! ¿Recuerdas ${lastTopic}? ¡Podemos repasar o explorar algo nuevo! 🌟`
      );
    }
    
    return options[Math.floor(Math.random() * options.length)];
  }
  
  // English
  const options = [
    // Basic greetings
    `${charEmoji} Hi, ${childName}! I'm so glad to see you! 😊 How can I help you today?`,
    `${charEmoji} Hello! How's your day going? If you need anything, just let me know! 🌟`,
    `${charEmoji} Hi, ${childName}! I'm here to help with homework, questions, anything! ✨`,
    `${charEmoji} Hello! How are you? Tell me what's on your mind! 🎉`,
  ];
  
  // If we have memory of last topic, add context-aware greeting
  if (lastTopic) {
    options.push(
      `${charEmoji} Welcome back, ${childName}! We worked on ${lastTopic} last time. Want to continue or try something new? 🚀`,
      `${charEmoji} Hi, ${childName}! Remember ${lastTopic}? We can review it or explore something new! 🌟`
    );
  }
  
  return options[Math.floor(Math.random() * options.length)];
}

function getMontessoriGuidingResponse(userMessage: string, context: JuniorContext): string {
  const charKey = context.aiCharacter ?? "panda";
  const charEmoji = CHARACTER_EMOJIS[charKey] ?? "🐼";
  const lang = getLang(context.language);
  
  // Use language-specific fallback if child name is missing
  const fallbackName = lang === "bg" ? "приятелю" : lang === "es" ? "amigo" : "friend";
  const childName = context.childName ?? fallbackName;
  
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
        `${charEmoji} ${childName}, какво интересен въпрос! Харесва ми как мислиш. ${gradeMathHint} Какво забелязваш първо? Нека открием отговора заедно. 🔢`,
        `${charEmoji} Чудесен опит, ${childName}! Аз съм ${charName} и обичам любознателните умове. ${gradeMathHint} Да помислим: какво се случва когато добавяме числата? 🍎`,
        `${charEmoji} ${childName}, математиката е пътешествие! ${charName} е до теб. Какво вече знаеш? Нека тръгнем от там. ✏️`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isReading) {
      return [
        `${charEmoji} ${childName}, какво хубаво любопитство! Четенето е пътешествие. Само по заглавието — за какво мислиш? Няма грешни идеи! 📚`,
        `${charEmoji} Интересен въпрос, ${childName}! ${charName} е развълнуван. Какво мислиш за историята? Твоите идеи са ценни! 🌟`,
        `${charEmoji} ${childName}, харесва ми как разкрай мислиш. Нека открием историята заедно, стъпка по стъпка. 📖`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isScience) {
      return [
        `${charEmoji} ${childName}, какво интересен вопрос! Науката е наблюдение и открития. Какво вече видя или знаеш? Твоите наблюдения са важни! 🔭`,
        `${charEmoji} Чудесен интерес, ${childName}! ${charName} е с теб. Какво ще стане по твое мнение? Нека открием отговора чрез разглеждане! 🌿`,
        `${childName}, помисли като учен — какво видя или чу? Научното мислене е просто наблюдение на света. 🦋`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isLogic) {
      return [
        `${charEmoji} ${childName}, какво хубаво логическо мислене! Нека играем открива каловерност. Какво виждаш най-първо? 🧩`,
        `${charEmoji} Обичам твоята любознателност, ${childName}! ${charName} е с теб. Какво ще се повтори на следващ етап? Нека открием заедно! 🔍`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isStuck) {
      return [
        `${charEmoji} ${childName}, чудесно! Значи си готов за ново учене — точно там расте ума. ${charName} е до теб. Кажи ми — кой малък след első знаеш? Нека тръгнем оттам! 💪`,
        `${charEmoji} Да попиташ за помощ е силно решение! ${charName} е горд с теб. Какво лесна частбих мог да ви научим първо? Нека тръгнем поравачко. 🌱`,
      ][Math.floor(Math.random() * 2)];
    }
    if (isEnglishPractice) {
      return [
        `${charEmoji} ${childName}, какво отважно решение! Английският е суперсила. Опитай с каквито и думи знаеш. Всеки опит те прави по-силен! 🗣️`,
        `${charEmoji} Харесва ми твоята любознателност, ${childName}! Знаеш ли някоя дума на английски? Нека тръгнем от там! 📝`,
      ][Math.floor(Math.random() * 2)];
    }
    const defaults = [
      `${charEmoji} ${childName}, какво чудесен въпрос! ${charName} обича любознателните умове. Какво мислиш ти? Твоите идеи са началото! 🌟`,
      `${charEmoji} Страхотно, че попита, ${childName}! ${charName} е развълнуван. Какво знаеш вече? Нека тръгнем от твоите знания! 🔍`,
      `${charEmoji} ${childName}, задаването на въпроси е знак за ученик, готов да учи! Какво вече видя или чу по тази тема? 🚀`,
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

/**
 * Detect if user wants to start a learning/teaching loop (v1: addition to 10)
 */
export function detectTeachingIntent(userMessage: string, lang: "bg" | "es" | "en"): boolean {
  const msg = userMessage.toLowerCase().trim();
  
  if (lang === "bg") {
    const triggers = [
      // Addition-specific
      "помогни ми със събиране", "събиране", "събирам", "научи ме събиране",
      "искам да уча събиране", "задай ми събиране", "упражнение събиране",
      "дай ми задача събиране", "тренирай ме събиране",
      // Broader math requests (voice-friendly)
      "помогни ми с математика", "помогни ми с математиката", "дай ми задача по математика",
      "дай ми математична задача", "искам задача по математика", "искам да уча математика",
      "дай ми упражнение", "математика", "математическа задача",
      "дай ми задача", "научи ме", "тренирай ме"
    ];
    return triggers.some(t => msg.includes(t));
  }
  
  if (lang === "es") {
    const triggers = [
      // Addition-specific
      "ayúdame con suma", "suma", "quiero practicar suma", "enséñame suma",
      "dame una tarea de suma", "practiquemos suma", "entrena me suma",
      // Broader math requests (voice-friendly)
      "ayúdame con matemática", "ayúdame con matemáticas", "dame una tarea de matemática",
      "dame una tarea de matemáticas", "quiero una tarea de matemática", "quiero aprender matemática",
      "dame un ejercicio", "matemática", "tarea de matemática",
      "dame una tarea", "enséñame", "entréneme"
    ];
    return triggers.some(t => msg.includes(t));
  }
  
  // English
  const triggers = [
    // Addition-specific
    "help with addition", "addition", "teach me addition", "practice addition",
    "give me an addition task", "let's practice addition", "addition practice",
    // Broader math requests (voice-friendly)
    "help with math", "help with mathematics", "give me a math task",
    "give me a math problem", "want to practice math", "want to learn math",
    "give me a problem", "math", "mathematics", "teach me", "train me",
    "give me a task"
  ];
  return triggers.some(t => msg.includes(t));
}

/**
 * Generate a simple addition task: a + b where a, b <= 10 and a+b <= 10
 */
export function generateAdditionTask(previousTasks: string[] = []): { a: number; b: number; task: string } {
  let a, b;
  let attempts = 0;
  
  do {
    a = Math.floor(Math.random() * 11);  // 0..10
    b = Math.floor(Math.random() * 11);  // 0..10
    attempts++;
  } while ((a + b > 10 || (a === 0 && b === 0)) && attempts < 20);  // Avoid 0+0, sum > 10
  
  const task = `${a} + ${b}`;
  
  // Prevent immediate repetition
  if (previousTasks.includes(task)) {
    return generateAdditionTask(previousTasks);
  }
  
  return { a, b, task };
}

/**
 * Evaluate if a given answer is correct for an addition problem
 */
export function evaluateAdditionAnswer(a: number, b: number, userAnswer: string): { correct: boolean; expected: number } {
  const expected = a + b;
  const cleaned = userAnswer.toLowerCase().trim().replace(/[^0-9]/g, "");
  const answered = parseInt(cleaned, 10);
  
  return {
    correct: !isNaN(answered) && answered === expected,
    expected
  };
}

/**
 * Generate feedback for an addition answer (correct or hint)
 */
export function getAdditionFeedback(
  a: number,
  b: number,
  userAnswer: string,
  childName: string,
  lang: "bg" | "es" | "en",
  isCorrect: boolean
): string {
  const charEmoji = "🐼";
  const expected = a + b;
  
  if (isCorrect) {
    // Correct answer feedback
    if (lang === "bg") {
      return [
        `${charEmoji} Браво, ${childName}! ${a} + ${b} = ${expected} ⭐\nИскаш ли още една задача?`,
        `${charEmoji} Точно! ${a} + ${b} = ${expected}! Прекрасна работа, ${childName}! 🌟\nПродължаваме ли?`,
        `${charEmoji} Чудесно! ${expected} е верния отговор! Ты си чудесен математик, ${childName}! 🎉\nОще ли една?`
      ][Math.floor(Math.random() * 3)];
    }
    
    if (lang === "es") {
      return [
        `${charEmoji} ¡Bravo, ${childName}! ${a} + ${b} = ${expected} ⭐\n¿Quieres otro?`,
        `${charEmoji} ¡Correcto! ${a} + ${b} = ${expected}. ¡Excelente trabajo, ${childName}! 🌟\n¿Continuamos?`,
        `${charEmoji} ¡Perfecto! ¡${expected} es la respuesta correcta! ¡Eres un matemático brillante, ${childName}! 🎉\n¿Una más?`
      ][Math.floor(Math.random() * 3)];
    }
    
    // English
    return [
      `${charEmoji} Excellent, ${childName}! ${a} + ${b} = ${expected} ⭐\nWant another one?`,
      `${charEmoji} That's right! ${a} + ${b} = ${expected}. Great work, ${childName}! 🌟\nShall we continue?`,
      `${charEmoji} Perfect! ${expected} is correct! You're such a wonderful mathematician, ${childName}! 🎉\nOne more?`
    ][Math.floor(Math.random() * 3)];
  }
  
  // Incorrect - give a hint, don't shame
  if (lang === "bg") {
    return [
      `${charEmoji} Добър опит! Нека помислим: ако имаме ${a} и добавим още ${b}, колко стават общо?`,
      `${charEmoji} Интересно мислене! Помисли отново: ${a} и ${b} заедно колко ще бъдат?`,
      `${charEmoji} Хубав опит, ${childName}! Брой: начни с ${a}, после добави ${b} повече. Колко общо?`
    ][Math.floor(Math.random() * 3)];
  }
  
  if (lang === "es") {
    return [
      `${charEmoji} ¡Buen intento! Pensemos: si tenemos ${a} y le sumamos ${b} más, ¿cuál es el total?`,
      `${charEmoji} ¡Interesante! Intenta de nuevo: ${a} y ${b} juntos, ¿cuántos son?`,
      `${charEmoji} ¡Buen esfuerzo, ${childName}! Cuenta: empieza con ${a}, luego suma ${b} más. ¿Cuántos en total?`
    ][Math.floor(Math.random() * 3)];
  }
  
  // English
  return [
    `${charEmoji} Good try! Let's think: if we have ${a} and add ${b} more, how many do we get altogether?`,
    `${charEmoji} Interesting thinking! Try again: ${a} and ${b} together, how many is that?`,
    `${charEmoji} Nice effort, ${childName}! Count: start with ${a}, then add ${b} more. How many in total?`
  ][Math.floor(Math.random() * 3)];
}

/**
 * Generate the initial prompt for starting an addition teaching loop
 */
export function getAdditionTaskPrompt(a: number, b: number, childName: string, lang: "bg" | "es" | "en"): string {
  const charEmoji = "🐼";
  
  if (lang === "bg") {
    return [
      `${charEmoji} Хайде да опитаме заедно, ${childName}:\n${a} + ${b} = ?`,
      `${charEmoji} Начало на математическо приключение, ${childName}!\nКолко е ${a} + ${b}?`,
      `${charEmoji} Готови ли сте за задачата, ${childName}?\n${a} + ${b} = ?`
    ][Math.floor(Math.random() * 3)];
  }
  
  if (lang === "es") {
    return [
      `${charEmoji} Vamos a intentar juntos, ${childName}:\n${a} + ${b} = ?`,
      `${charEmoji} ¡El comienzo de una aventura matemática, ${childName}!\n¿Cuánto es ${a} + ${b}?`,
      `${charEmoji} ¿Listos para la tarea, ${childName}?\n${a} + ${b} = ?`
    ][Math.floor(Math.random() * 3)];
  }
  
  // English
  return [
    `${charEmoji} Let's try together, ${childName}:\n${a} + ${b} = ?`,
    `${charEmoji} Here's an addition challenge, ${childName}:\nWhat is ${a} + ${b}?`,
    `${charEmoji} Ready for an addition task, ${childName}?\n${a} + ${b} = ?`
  ][Math.floor(Math.random() * 3)];
}

/**
 * Detect if user wants to switch to a different math operation
 */
export function detectMathOperationSwitch(userMessage: string, lang: "bg" | "es" | "en"): "addition" | "subtraction" | "multiplication" | "division" | null {
  const msg = userMessage.toLowerCase().trim();
  
  if (lang === "bg") {
    if (msg.includes("събиране") || msg.includes("събира")) return "addition";
    if (msg.includes("изваждане") || msg.includes("изважда")) return "subtraction";
    if (msg.includes("умножение") || msg.includes("умножи")) return "multiplication";
    if (msg.includes("деление") || msg.includes("дели")) return "division";
  }
  
  if (lang === "es") {
    if (msg.includes("suma") || msg.includes("adición")) return "addition";
    if (msg.includes("resta") || msg.includes("sustracción")) return "subtraction";
    if (msg.includes("multiplicación") || msg.includes("multiplicar")) return "multiplication";
    if (msg.includes("división") || msg.includes("dividir")) return "division";
  }
  
  // English
  if (msg.includes("addition") || msg.includes("add")) return "addition";
  if (msg.includes("subtraction") || msg.includes("subtract")) return "subtraction";
  if (msg.includes("multiplication") || msg.includes("multiply")) return "multiplication";
  if (msg.includes("division") || msg.includes("divide")) return "division";
  
  return null;
}

/**
 * Generate a math task for any operation
 */
export function generateMathTask(operation: "addition" | "subtraction" | "multiplication" | "division"): { a: number; b: number; task: string; operation: string } {
  let a, b;
  let attempts = 0;
  
  if (operation === "addition") {
    do {
      a = Math.floor(Math.random() * 11);
      b = Math.floor(Math.random() * 11);
      attempts++;
    } while ((a + b > 10 || (a === 0 && b === 0)) && attempts < 20);
    return { a, b, task: `${a} + ${b}`, operation: "addition" };
  }
  
  if (operation === "subtraction") {
    do {
      a = Math.floor(Math.random() * 11);
      b = Math.floor(Math.random() * 10);
      attempts++;
    } while ((a < b || (a === 0 && b === 0)) && attempts < 20);
    return { a, b, task: `${a} - ${b}`, operation: "subtraction" };
  }
  
  if (operation === "multiplication") {
    a = Math.floor(Math.random() * 10) + 1;
    b = Math.floor(Math.random() * 10) + 1;
    if (a * b > 50) {
      a = Math.floor(a / 2);
      b = Math.floor(b / 2);
    }
    return { a, b, task: `${a} × ${b}`, operation: "multiplication" };
  }
  
  // division
  b = Math.floor(Math.random() * 9) + 1;
  a = b * (Math.floor(Math.random() * 10) + 1);
  if (a > 50) a = b * (Math.floor(Math.random() * 5) + 1);
  return { a, b, task: `${a} ÷ ${b}`, operation: "division" };
}

/**
 * Evaluate answer for any math operation
 */
export function evaluateMathAnswer(a: number, b: number, operation: string, userAnswer: string): { correct: boolean; expected: number } {
  let expected = 0;
  
  if (operation === "addition") {
    expected = a + b;
  } else if (operation === "subtraction") {
    expected = a - b;
  } else if (operation === "multiplication") {
    expected = a * b;
  } else if (operation === "division") {
    expected = a / b;
  }
  
  const cleaned = userAnswer.toLowerCase().trim().replace(/[^0-9.]/g, "");
  let answered = parseFloat(cleaned);
  
  if (operation === "division") {
    expected = Math.round(expected * 100) / 100;
    answered = Math.round(answered * 100) / 100;
  } else {
    expected = Math.round(expected);
    answered = Math.round(answered);
  }
  
  return {
    correct: !isNaN(answered) && answered === expected,
    expected
  };
}

/**
 * Generate feedback for any math operation
 */
export function getMathFeedback(
  a: number,
  b: number,
  operation: string,
  userAnswer: string,
  childName: string,
  lang: "bg" | "es" | "en",
  isCorrect: boolean
): string {
  const charEmoji = "🐼";
  const { expected } = evaluateMathAnswer(a, b, operation, userAnswer);
  
  let operationSymbol = "+";
  if (operation === "subtraction") operationSymbol = "-";
  else if (operation === "multiplication") operationSymbol = "×";
  else if (operation === "division") operationSymbol = "÷";
  
  const equation = `${a} ${operationSymbol} ${b} = ${expected}`;
  
  if (isCorrect) {
    if (lang === "bg") {
      return [
        `${charEmoji} Браво, ${childName}! ${equation} ⭐\nИскаш ли още една задача?`,
        `${charEmoji} Точно! ${equation}! Прекрасна работа, ${childName}! 🌟\nПродължаваме ли?`,
        `${charEmoji} Чудесно! ${expected} е верния отговор! Ты си чудесен математик, ${childName}! 🎉\nОще ли една?`
      ][Math.floor(Math.random() * 3)];
    }
    if (lang === "es") {
      return [
        `${charEmoji} ¡Bravo, ${childName}! ${equation} ⭐\n¿Quieres otro?`,
        `${charEmoji} ¡Correcto! ${equation}! ¡Excelente trabajo, ${childName}! 🌟\n¿Continuamos?`,
        `${charEmoji} ¡Fantástico! ¡${expected} es la respuesta correcta! ¡Eres un excelente matemático, ${childName}! 🎉\n¿Otro más?`
      ][Math.floor(Math.random() * 3)];
    }
    return [
      `${charEmoji} Great, ${childName}! ${equation} ⭐\nWant another one?`,
      `${charEmoji} Correct! ${equation}! Excellent work, ${childName}! 🌟\nShall we continue?`,
      `${charEmoji} Wonderful! ${expected} is the right answer! You're a great mathematician, ${childName}! 🎉\nOne more?`
    ][Math.floor(Math.random() * 3)];
  }
  
  // Incorrect - provide hint
  if (lang === "bg") {
    return [
      `${charEmoji} Добър опит! Помисли още малко: ${a} и ${b} заедно какво ще бъдат?`,
      `${charEmoji} Интересно мислене! Опитай отново и помисли дали това е правилния отговор.`,
      `${charEmoji} Хубав опит! Помислете повторно за операцията: ${a} ${operationSymbol} ${b}.`
    ][Math.floor(Math.random() * 3)];
  }
  if (lang === "es") {
    return [
      `${charEmoji} ¡Buen intento! Piensa de nuevo: ${a} y ${b} juntos, ¿cuánto será?`,
      `${charEmoji} ¡Pensamiento interesante! Intenta de nuevo y piensa si esa es la respuesta correcta.`,
      `${charEmoji} ¡Buen intento! Piensa de nuevo en la operación: ${a} ${operationSymbol} ${b}.`
    ][Math.floor(Math.random() * 3)];
  }
  return [
    `${charEmoji} Good try! Think again: ${a} and ${b} together equals what?`,
    `${charEmoji} Interesting thinking! Try again and think if that's the correct answer.`,
    `${charEmoji} Nice try! Think again about the operation: ${a} ${operationSymbol} ${b}.`
  ][Math.floor(Math.random() * 3)];
}

/**
 * Generate the initial prompt for a math teaching task
 */
export function getMathTaskPrompt(a: number, b: number, operation: string, childName: string, lang: "bg" | "es" | "en"): string {
  const charEmoji = "🐼";
  let operationName = "addition";
  let operationSymbol = "+";
  
  if (operation === "subtraction") {
    operationName = "subtraction";
    operationSymbol = "-";
  } else if (operation === "multiplication") {
    operationName = "multiplication";
    operationSymbol = "×";
  } else if (operation === "division") {
    operationName = "division";
    operationSymbol = "÷";
  }
  
  const equation = `${a} ${operationSymbol} ${b}`;
  
  if (lang === "bg") {
    return [
      `${charEmoji} Хайде да опитаме заедно, ${childName}:\n${equation} = ?`,
      `${charEmoji} Математическо приключение, ${childName}!\nКолко е ${equation}?`,
      `${charEmoji} Готови ли сте, ${childName}?\n${equation} = ?`
    ][Math.floor(Math.random() * 3)];
  }
  
  if (lang === "es") {
    return [
      `${charEmoji} Vamos a intentar juntos, ${childName}:\n${equation} = ?`,
      `${charEmoji} ¡Una aventura matemática, ${childName}!\n¿Cuánto es ${equation}?`,
      `${charEmoji} ¿Listos, ${childName}?\n${equation} = ?`
    ][Math.floor(Math.random() * 3)];
  }
  
  return [
    `${charEmoji} Let's try together, ${childName}:\n${equation} = ?`,
    `${charEmoji} A math challenge, ${childName}!\nWhat is ${equation}?`,
    `${charEmoji} Ready, ${childName}?\n${equation} = ?`
  ][Math.floor(Math.random() * 3)];
}

export function getAIResponse(module: string, userMessage: string, context?: JuniorContext): string {
  if (module === "junior" && context) {
    // Check if this is a greeting/casual chat first
    const lang = getLang(context.language);
    if (detectGreetingIntent(userMessage, lang)) {
      return getFriendlyChatResponse(context);
    }
    // Otherwise, use Montessori tutoring mode
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
