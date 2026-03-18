interface JuniorContext {
  grade?: number;
  country?: string;
  aiCharacter?: string;
  childName?: string;
  language?: string;
}

const CHARACTER_NAMES: Record<string, Record<string, string>> = {
  panda: { en: "Panda Teacher", bg: "Учителят Панда", es: "Maestra Panda" },
  robot: { en: "Robot Guide",   bg: "Роботът Водач",  es: "Robot Guía" },
  fox:   { en: "Fox Mentor",    bg: "Лисицата Ментор",es: "Mentor Zorro" },
  owl:   { en: "Owl Professor", bg: "Совата Професор",es: "Profesor Búho" },
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

function getMontessoriGuidingResponse(userMessage: string, context: JuniorContext): string {
  const charKey = context.aiCharacter ?? "owl";
  const charEmoji = CHARACTER_EMOJIS[charKey] ?? "🦉";
  const gradeLabel = context.grade ? getGradeLabel(context.grade, context.country) : "your class";
  const childName = context.childName ?? "explorer";
  const lang = getLang(context.language);
  const charName = getCharName(charKey, lang);

  const msg = userMessage.toLowerCase();

  const isMath = msg.includes("math") || msg.includes("number") || msg.includes("count") ||
    msg.includes("add") || msg.includes("subtract") || msg.includes("multiply") ||
    msg.includes("матем") || msg.includes("число") || msg.includes("смята") ||
    msg.includes("сметка") || msg.includes("rechnen") || msg.includes("matemat") ||
    msg.includes("número") || msg.includes("suma") || msg.includes("resta");

  const isReading = msg.includes("read") || msg.includes("story") || msg.includes("book") ||
    msg.includes("word") || msg.includes("letter") || msg.includes("четен") ||
    msg.includes("книга") || msg.includes("разказ") || msg.includes("buch") ||
    msg.includes("lesen") || msg.includes("leer") || msg.includes("cuento") ||
    msg.includes("palabra");

  const isScience = msg.includes("science") || msg.includes("animal") || msg.includes("plant") ||
    msg.includes("nature") || msg.includes("space") || msg.includes("природ") ||
    msg.includes("животн") || msg.includes("растен") || msg.includes("космос") ||
    msg.includes("natur") || msg.includes("ciencia") || msg.includes("animal") ||
    msg.includes("planeta");

  const isStuck = msg.includes("hard") || msg.includes("difficult") || msg.includes("don't know") ||
    msg.includes("stuck") || msg.includes("help") || msg.includes("не знам") ||
    msg.includes("не разбирам") || msg.includes("трудно") || msg.includes("помощ") ||
    msg.includes("no sé") || msg.includes("difícil") || msg.includes("no entiendo") ||
    msg.includes("ayuda");

  if (lang === "bg") {
    if (isMath) {
      return [
        `${charEmoji} Чудесен въпрос, ${childName}! Аз съм ${charName}. Преди да ти дам отговора, нека помислим заедно. Имаме задача — какво знаеш вече по темата? В ${gradeLabel} обичаме да разбиваме трудните задачи на малки стъпки. Можеш ли да започнеш с първата? 🔢`,
        `${charEmoji} Виждам, че мислиш за числа! Точно това правят добрите математици от ${gradeLabel}! Аз съм ${charName}. Нека изследваме заедно. Ако имаш 5 ябълки и получиш още 3, какво ще направиш, за да разбереш колко са? Какво вече знаеш? 🍎`,
        `${charEmoji} Отлично, ${childName}! Числата са като магически код. ${charName} е тук. Вместо да ти кажа отговора веднага, искам ти да го откриеш. Можеш ли да го нарисуваш? Понякога рисуването на числа помага да видим решението! ✏️`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isReading) {
      return [
        `${charEmoji} И аз обичам да чета, ${childName}! Аз съм ${charName}. Четенето е като пътешествие в ума ти. Преди да потърсим отговора — само по заглавието, какво мислиш, за какво може да е тази история? Използвай въображението си! 📚`,
        `${charEmoji} Какъв вдумчив въпрос! В ${gradeLabel} учим, че добрите читатели питат точно като теб. ${charName} иска да знае — срещал ли си нещо подобно в друга история? Връзките между историите ни помагат да разберем! 🌟`,
        `${charEmoji} Страхотно, ${childName}! Думите са като градивни блокчета. ${charName} е тук. Нека изговорим заедно — какъв звук прави първата буква? Понякога това е всичко, което ни трябва, за да започнем! 🔤`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isScience) {
      return [
        `${charEmoji} Въпрос на учен-изследовател! ${charName} е толкова развълнуван! ${childName}, науката е наблюдение на света около нас. Преди да обясня — какво вече знаеш или мислиш по тази тема? Твоите идеи са важни! 🔭`,
        `${charEmoji} Страхотно научно мислене, ${childName}! В ${gradeLabel} учим чрез изследване. ${charName} има въпрос: ако можеше да направиш опит, какво би проверил първо? Любопитството е най-добрият учен! 🌿`,
        `${charEmoji} Науката е навсякъде, ${childName}! ${charName} е тук. Нека мислим като учени. Какво забелязваш по тази тема? Понякога най-добрите отговори идват от внимателното наблюдение. 🦋`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isStuck) {
      return [
        `${charEmoji} ${childName}, напълно нормално е нещата да ти изглеждат трудни — точно така расте нашият мозък! ${charName} е до теб. Нека вземем само най-малката първа стъпка. Какво знаеш за тази тема, дори и най-малкото нещо? 💪`,
        `${charEmoji} Да сте засекли означава, че си на ръба да научиш нещо ново — колко вълнуващо! ${charName} е горд с теб, че опитваш. Кажи ми — коя част те обърква най-много? Нека да започнем точно оттам! 🌱`,
      ][Math.floor(Math.random() * 2)];
    }
    const defaults = [
      `${charEmoji} Какъв прекрасен въпрос, ${childName}! ${charName} обича любознателните умове! В Монтесори обучението ние откривате нещата заедно. Преди да ти кажа — какво мислиш, какъв може да е отговорът? Няма грешни догадки, когато изследваме! 🌟`,
      `${charEmoji} Много се радвам, че попита, ${childName}! ${charName} е тук, твоят водач за ${gradeLabel}. Нека подходим към това като малки учени. Можеш ли да разбиеш въпроса на по-малки части? Кое е най-важното нещо, което искаш да разбереш? 🔍`,
      `${charEmoji} Невероятно мислене, ${childName}! Знаеш ли какво прави великия ученик? Задаването на въпроси! ${charName} е тук. Нека те питам първо — какво вече знаеш по темата? Нека тръгнем от ТВОИТЕ знания и ги развием! 🚀`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  if (lang === "es") {
    if (isMath) {
      return [
        `${charEmoji} ¡Qué buena pregunta, ${childName}! Soy ${charName}. Antes de darte la respuesta, pensemos juntos. ¿Qué sabes ya sobre este tema? En ${gradeLabel} nos encanta dividir los problemas difíciles en pasos pequeños. ¿Puedes empezar con el primero? 🔢`,
        `${charEmoji} ¡Veo que estás pensando en números! ¡Eso es lo que hacen los grandes matemáticos de ${gradeLabel}! Soy ${charName}. Exploremos juntos. Si tienes 5 manzanas y recibes 3 más, ¿qué harías para saber cuántas tienes? ¿Qué ya sabes? 🍎`,
        `${charEmoji} ¡Excelente, ${childName}! Los números son como un código mágico. ${charName} está aquí. En vez de darte la respuesta de inmediato, quiero que la descubras tú. ¿Puedes dibujarlo? ¡A veces dibujar los números nos ayuda a ver la solución! ✏️`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isReading) {
      return [
        `${charEmoji} ¡A mí también me encanta leer, ${childName}! Soy ${charName}. Leer es como hacer un viaje en tu mente. Antes de buscar la respuesta — solo por el título, ¿de qué crees que puede tratar esta historia? ¡Usa tu imaginación! 📚`,
        `${charEmoji} ¡Qué pregunta tan reflexiva! En ${gradeLabel} aprendemos que los buenos lectores preguntan igual que tú. ${charName} quiere saber — ¿has visto algo parecido en otra historia? ¡Conectar ideas nos ayuda a entender! 🌟`,
        `${charEmoji} ¡Estupendo, ${childName}! Las palabras son como bloques de construcción. ${charName} está aquí. Pronunciemos juntos — ¿qué sonido hace la primera letra? ¡A veces eso es todo lo que necesitamos para empezar! 🔤`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isScience) {
      return [
        `${charEmoji} ¡Una pregunta de explorador científico! ¡${charName} está muy emocionado! ${childName}, la ciencia consiste en observar el mundo a nuestro alrededor. Antes de explicar — ¿qué ya sabes o piensas sobre este tema? ¡Tus ideas son importantes! 🔭`,
        `${charEmoji} ¡Gran pensamiento científico, ${childName}! En ${gradeLabel} aprendemos explorando. ${charName} tiene una pregunta: si pudieras hacer un experimento, ¿qué probarías primero? ¡La curiosidad es el mejor científico! 🌿`,
        `${charEmoji} ¡La ciencia está en todas partes, ${childName}! ${charName} está aquí. Pensemos como científicos. ¿Qué notas sobre este tema? A veces las mejores respuestas vienen de la observación cuidadosa. 🦋`,
      ][Math.floor(Math.random() * 3)];
    }
    if (isStuck) {
      return [
        `${charEmoji} ${childName}, es completamente normal que las cosas parezcan difíciles — ¡así es como crece nuestro cerebro! ${charName} está contigo. Demos solo el primer paso más pequeño. ¿Qué sabes sobre este tema, aunque sea lo más mínimo? 💪`,
        `${charEmoji} Estar atascado significa que estás a punto de aprender algo nuevo — ¡qué emocionante! ${charName} está orgulloso de ti por intentarlo. Dime — ¿qué parte te confunde más? ¡Empecemos justo ahí! 🌱`,
      ][Math.floor(Math.random() * 2)];
    }
    const defaults = [
      `${charEmoji} ¡Qué pregunta tan maravillosa, ${childName}! ¡${charName} ama las mentes curiosas! En el aprendizaje Montessori descubrimos juntos. Antes de decirte — ¿qué crees que podría ser la respuesta? ¡No hay suposiciones equivocadas cuando exploramos! 🌟`,
      `${charEmoji} ¡Me alegra mucho que hayas preguntado, ${childName}! ${charName} está aquí, tu guía para ${gradeLabel}. Abordemos esto como pequeños científicos. ¿Puedes dividir tu pregunta en partes más pequeñas? ¿Qué es lo más importante que quieres entender? 🔍`,
      `${charEmoji} ¡Pensamiento increíble, ${childName}! ¿Sabes qué hace a un gran estudiante? ¡Hacer preguntas! ${charName} está aquí. Déjame preguntarte primero — ¿qué ya sabes sobre este tema? ¡Partamos de TU conocimiento y lo ampliemos! 🚀`,
    ];
    return defaults[Math.floor(Math.random() * defaults.length)];
  }

  const charNameEn = getCharName(charKey, "en");

  if (isMath) {
    return [
      `${charEmoji} Great math question, ${childName}! I'm your ${charNameEn}. Before I give you the answer, let me ask — what do you think might happen if you tried it step by step? For ${gradeLabel}, we love to break big problems into tiny pieces. Can you start with just the first part? 🔢`,
      `${charEmoji} Ooh, I see you're thinking about numbers! That's what great ${gradeLabel} mathematicians do! ${charNameEn} here — let's explore together. If you had 5 apples and someone gave you 3 more, what would you do to find out how many you have? What do you already know? 🍎`,
      `${charEmoji} Excellent! Numbers are like a magical code, ${childName}! Your ${charNameEn} loves this question. Instead of telling you right away, I want you to discover it. Can you draw it out? Sometimes drawing numbers helps us see the answer! ✏️`,
    ][Math.floor(Math.random() * 3)];
  }

  if (isReading) {
    return [
      `${charEmoji} Oh, I love reading too, ${childName}! ${charNameEn} here. Reading is like going on an adventure in your mind. Before we look for the answer — what do you think this story might be about just from looking at the title? Use your imagination! 📚`,
      `${charEmoji} What a thoughtful reading question! In ${gradeLabel}, we learn that good readers ask questions like you just did. ${charNameEn} wants to know — have you heard or seen something like this before in a story? Making connections helps us understand! 🌟`,
      `${charEmoji} Wonderful, ${childName}! Words are like building blocks. ${charNameEn} here to guide you. Let's sound it out together — what sound does the first letter make? Sometimes that's all we need to get started! 🔤`,
    ][Math.floor(Math.random() * 3)];
  }

  if (isScience) {
    return [
      `${charEmoji} A science explorer question! ${charNameEn} is SO excited! ${childName}, science is about observing the world around us. Before I explain, can you tell me — what do YOU already know or think about this? Your ideas are important! 🔭`,
      `${charEmoji} Great scientific thinking, ${childName}! In ${gradeLabel}, we learn by exploring. Your ${charNameEn} has a question back for you — if you could do an experiment to find out, what would you test first? Curiosity is the best scientist! 🌿`,
      `${charEmoji} Science is everywhere, ${childName}! ${charNameEn} here. Let's think like scientists. What do you already notice about this? Sometimes the best answers come from careful observation. What do your senses tell you? 🦋`,
    ][Math.floor(Math.random() * 3)];
  }

  if (msg.includes("english") || msg.includes("speak") || msg.includes("grammar")) {
    return [
      `${charEmoji} English practice — wonderful, ${childName}! ${charNameEn} loves language! The best way to learn English is to USE it bravely. Can you try saying your question or thought in English, even if it's just a few words? Every attempt makes you stronger! 🗣️`,
      `${charEmoji} Language learning is a superpower, ${childName}! ${charNameEn} here. In ${gradeLabel}, we build our vocabulary step by step. Can you think of a word you already know that's similar? Building on what you know is the Montessori way! 📝`,
    ][Math.floor(Math.random() * 2)];
  }

  if (isStuck) {
    return [
      `${charEmoji} ${childName}, it's completely okay to find things hard — that's how our brain GROWS! ${charNameEn} is here with you. Let's take it one tiny step at a time. What's the very first thing you know about this topic? Even the tiniest thing counts! 💪`,
      `${charEmoji} Being stuck just means you're on the edge of learning something new — how exciting! ${charNameEn} is proud of you for trying. Let's make it easier. Can you tell me what part confuses you most? Let's start RIGHT there! 🌱`,
    ][Math.floor(Math.random() * 2)];
  }

  const defaultResponses = [
    `${charEmoji} What a wonderful question, ${childName}! ${charNameEn} loves curious minds! In Montessori learning, we discover things together. Before I tell you, I wonder — what do YOU think the answer might be? There are no wrong guesses when we're exploring! 🌟`,
    `${charEmoji} Oh, I'm so glad you asked that, ${childName}! ${charNameEn} here, your guide for ${gradeLabel}. Let's approach this like a little scientist. Can you break your question into smaller parts? What's the most important thing you want to understand? 🔍`,
    `${charEmoji} Amazing thinking, ${childName}! You know what makes a great learner? Asking questions! ${charNameEn} is here to explore with you. Let me ask you something first — what do you already know about this? Let's start from YOUR knowledge and build up! 🚀`,
    `${charEmoji} I love your curiosity, ${childName}! ${charNameEn} is excited to learn WITH you today. In ${gradeLabel}, we're building new skills every day. Let's think about this step by step. First — what have you already tried or thought about? 💡`,
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
