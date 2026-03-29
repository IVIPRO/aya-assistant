import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Star, RotateCcw } from "lucide-react";
import { cn } from "@/components/layout";
import { AyaAvatar3D as AyaAvatar, type AyaEmotion } from "@/components/AyaAvatar3D";
import type { LangCode } from "@/lib/i18n";
import type { Subject, Topic } from "@/lib/curriculum";

/* ─── Types ─────────────────────────────────────────────────────── */

interface StoryPractice {
  problems: Array<{ question: string; answer: string }>;
}

export interface StoryLessonData {
  practice: StoryPractice;
}

type StoryPhase =
  | { kind: "intro" }
  | { kind: "scene"; idx: number }
  | { kind: "question"; idx: number; attempts: number }
  | { kind: "outcome"; idx: number; correct: boolean; attempts: number }
  | { kind: "end"; correct: number; total: number };

/* ─── Localization ───────────────────────────────────────────────── */

const STORY_L: Record<LangCode, {
  startStory: string;
  challenges: string;
  seeChallenge: string;
  yourAnswer: string;
  tryAgain: string;
  correctAnswer: string;
  continueBtn: string;
  tryAgainBtn: string;
  storyComplete: string;
  backToTopics: string;
  challengeLabel: string;
  of: string;
}> = {
  bg: {
    startStory: "Начало на историята",
    challenges: "предизвикателства",
    seeChallenge: "Виж предизвикателството",
    yourAnswer: "Твоят отговор...",
    tryAgain: "Опитай пак! Почти!",
    correctAnswer: "Верен отговор",
    continueBtn: "Продължи историята",
    tryAgainBtn: "Опитай отново",
    storyComplete: "История завършена!",
    backToTopics: "← Назад към темите",
    challengeLabel: "Предизвикателство",
    of: "от",
  },
  en: {
    startStory: "Begin the story",
    challenges: "challenges",
    seeChallenge: "See the challenge",
    yourAnswer: "Your answer...",
    tryAgain: "Almost — try again!",
    correctAnswer: "Correct answer",
    continueBtn: "Continue the story",
    tryAgainBtn: "Try again",
    storyComplete: "Story complete!",
    backToTopics: "← Back to topics",
    challengeLabel: "Challenge",
    of: "of",
  },
  es: {
    startStory: "Comenzar la historia",
    challenges: "desafíos",
    seeChallenge: "Ver el desafío",
    yourAnswer: "Tu respuesta...",
    tryAgain: "¡Casi! Inténtalo de nuevo.",
    correctAnswer: "Respuesta correcta",
    continueBtn: "Continuar la historia",
    tryAgainBtn: "Intentar de nuevo",
    storyComplete: "¡Historia completada!",
    backToTopics: "← Volver a los temas",
    challengeLabel: "Desafío",
    of: "de",
  },
  de: {
    startStory: "Geschichte beginnen",
    challenges: "Herausforderungen",
    seeChallenge: "Herausforderung ansehen",
    yourAnswer: "Deine Antwort...",
    tryAgain: "Fast — nochmal versuchen!",
    correctAnswer: "Richtige Antwort",
    continueBtn: "Geschichte fortsetzen",
    tryAgainBtn: "Nochmal versuchen",
    storyComplete: "Geschichte abgeschlossen!",
    backToTopics: "← Zurück zu den Themen",
    challengeLabel: "Herausforderung",
    of: "von",
  },
  fr: {
    startStory: "Commencer l'histoire",
    challenges: "défis",
    seeChallenge: "Voir le défi",
    yourAnswer: "Ta réponse...",
    tryAgain: "Presque — réessaye!",
    correctAnswer: "Bonne réponse",
    continueBtn: "Continuer l'histoire",
    tryAgainBtn: "Réessayer",
    storyComplete: "Histoire terminée!",
    backToTopics: "← Retour aux sujets",
    challengeLabel: "Défi",
    of: "sur",
  },
};

/* ─── Story templates ────────────────────────────────────────────── */

interface StoryTemplate {
  title: string;
  characters: string;
  setting: string;
  intro: string;
  bridges: string[];
  correct: string[];
  wrong: string[];
  end: (c: number, t: number) => string;
}

const TEMPLATES: Record<string, Partial<Record<LangCode, StoryTemplate>>> = {
  mathematics: {
    bg: {
      title: "Маги и Петьо на пазара",
      characters: "Маги и Петьо",
      setting: "Градският пазар",
      intro: "Маги и нейният приятел Петьо тръгнаха за пазара с дълъг списък. Трябваше да сметнат всичко точно, за да не им свършат парите. Единствено ти можеш да им помогнеш!",
      bridges: [
        "Маги спря пред щанда с плодове и трябваше да реши:",
        "Петьо извика: 'Помогни ми с тази сметка!'",
        "Продавачката погледна Маги и попита:",
        "На касата светна въпрос:",
        "Маги извади тетрадката и трябваше да изчисли:",
      ],
      correct: [
        "Точно така! Маги се усмихна широко.",
        "Браво! Петьо скочи от радост.",
        "Перфектно! Продавачката кимна одобрително.",
        "Вярно! Те продължиха уверено напред.",
        "Чудесно! Касиерката сложи тикет с усмивка.",
      ],
      wrong: [
        "Маги се замисли малко повече. Нека опитаме отново.",
        "Петьо почеса глава — опитай пак!",
        "Продавачката изчака търпеливо. Опитай още веднъж.",
        "Касиерката кимна насърчително — ти можеш!",
      ],
      end: (c, t) =>
        c === t
          ? `Маги и Петьо се прибраха щастливи с пълни торби! Решили сте ${c} от ${t} задачи — перфектен резултат! 🎉`
          : `Маги и Петьо благодариха за помощта! ${c} от ${t} задачи решени. Следващия път ще е дори по-добре! 💪`,
    },
    en: {
      title: "Maya and Leo's Space Mission",
      characters: "Maya & Leo",
      setting: "Outer Space",
      intro: "Maya and her robot friend Leo are on a daring space mission. To navigate through the asteroid field, they must solve math challenges at every star gate. Only you can help them!",
      bridges: [
        "The star gate flashes. Maya checks the control panel:",
        "Leo beeps urgently: 'I need your help with this!'",
        "A meteor shower begins. Quick — solve this to steer:",
        "Mission Control radios in: 'Calculate this to proceed:'",
        "The next star gate glows. The challenge reads:",
      ],
      correct: [
        "The gate opens! Great calculation!",
        "Leo celebrates with spinning lights!",
        "They dodge the meteor. Brilliant!",
        "Mission Control cheers: 'Roger that — perfect!'",
        "The star gate beams them forward. Excellent!",
      ],
      wrong: [
        "The gate stays closed. Let's recalculate!",
        "Leo beeps slowly. One more try!",
        "The ship wobbles — try again!",
        "Mission Control: 'Check your math and try again.'",
      ],
      end: (c, t) =>
        c === t
          ? `Maya and Leo complete their mission — ${c} of ${t} challenges solved perfectly! Space heroes! 🚀`
          : `Maya and Leo made it back! ${c} of ${t} challenges solved. Every mission makes you better! ⭐`,
    },
    es: {
      title: "Sofía y Mateo en el Jardín Mágico",
      characters: "Sofía y Mateo",
      setting: "El Jardín Mágico",
      intro: "Sofía y su amigo Mateo llegaron al Jardín Mágico. Las flores sólo florecen cuando se resuelven los desafíos matemáticos. ¡Ellos te necesitan!",
      bridges: [
        "Una flor dorada preguntó:",
        "Mateo señaló la fuente: '¿Puedes calcular esto?'",
        "El hada del jardín susurró:",
        "El guardián del jardín preguntó:",
        "Una nueva flor esperaba la respuesta:",
      ],
      correct: [
        "¡La flor floreció! ¡Brillante!",
        "¡Mateo aplaudió de alegría!",
        "¡El hada bailó de felicidad!",
        "¡El jardín brilló con tu respuesta!",
        "¡Otra flor mágica despertó!",
      ],
      wrong: [
        "La flor esperó pacientemente. ¡Inténtalo de nuevo!",
        "Mateo pensó... ¡Prueba otra vez!",
        "El hada guiñó un ojo. ¡Una oportunidad más!",
        "El guardián esperó. ¡Tú puedes!",
      ],
      end: (c, t) =>
        c === t
          ? `¡Sofía y Mateo salvaron el Jardín Mágico — ${c} de ${t} perfectos! ¡Campeones! 🌸`
          : `¡El jardín floreció gracias a ustedes! ${c} de ${t} desafíos superados. ¡Cada vez mejoran más! 🌺`,
    },
  },
  "bulgarian-language": {
    bg: {
      title: "Мечо и Горската библиотека",
      characters: "Мечо",
      setting: "Горска библиотека",
      intro: "В гъстата гора се криеше вълшебна библиотека, пазена от мъдрия Мечо. Тя пазеше тайните на думите и буквите. Само умни деца могат да влязат вътре...",
      bridges: [
        "Мечо взе голяма книга и попита:",
        "На страницата пишеше:",
        "Мечо постави лапата си до въпроса:",
        "От книгата изскочи задача:",
        "Следващата страница се отвори сама:",
      ],
      correct: [
        "Мечо кимна мъдро. 'Точно!'",
        "Книгата се отвори на следващата страница!",
        "Мечо се засмя доволно.",
        "'Знаех, че ще се справиш!' — каза Мечо.",
        "Библиотеката заблестя от радост!",
      ],
      wrong: [
        "Мечо тихо поклати глава. 'Помисли отново.'",
        "Страницата остана затворена. Опитай пак.",
        "Мечо изчака търпеливо. 'Можеш!'",
        "'Почти!' — каза Мечо. 'Опитай още веднъж.'",
      ],
      end: (c, t) =>
        c === t
          ? `Мечо ти даде ключа за цялата библиотека! ${c} от ${t} — перфектен резултат! 📚`
          : `Мечо те изпрати с усмивка! ${c} от ${t} верни. Библиотеката те чака отново! 🐻`,
    },
    en: {
      title: "Theo and the Forest Library",
      characters: "Theo the Owl",
      setting: "Forest Library",
      intro: "Deep in the Enchanted Forest stood a magical library, guarded by wise Theo the Owl. It held the secrets of words and letters. Only clever children may enter...",
      bridges: [
        "Theo opened a big book and asked:",
        "The page read:",
        "Theo placed his wing beside the question:",
        "A task jumped out from the book:",
        "The next page turned on its own:",
      ],
      correct: [
        "Theo nodded wisely. 'Exactly right!'",
        "The book opened to the next page!",
        "Theo hooted with delight!",
        "'I knew you could do it!' said Theo.",
        "The library glowed with happiness!",
      ],
      wrong: [
        "Theo shook his head gently. 'Think again.'",
        "The page stayed closed. Try once more.",
        "Theo waited patiently. 'You can do it!'",
        "'Almost!' said Theo. 'Try one more time.'",
      ],
      end: (c, t) =>
        c === t
          ? `Theo gave you the library key! ${c} of ${t} — a perfect score! 📚`
          : `Theo smiled as you left! ${c} of ${t} correct. The library awaits your return! 🦉`,
    },
  },
  "nature-science": {
    bg: {
      title: "Ема открива Вълшебната гора",
      characters: "Ема",
      setting: "Вълшебна гора",
      intro: "Ема облече раницата си и навлезе в Вълшебната гора. С бинокъл и тетрадка, тя беше готова да открива тайните на природата. Помогни й да намери отговорите!",
      bridges: [
        "Ема спря и забеляза нещо интересно. В тетрадката пишеше:",
        "Птица кацна до нея и сякаш попита:",
        "Ема извади тетрадката и прочете:",
        "По пътеката се появи табелка:",
        "Ема надникна с бинокъла и се зачуди:",
      ],
      correct: [
        "Ема записа отговора и се усмихна!",
        "Птицата изчурулика одобрително!",
        "Горичката зашумя от радост.",
        "'Точно!' — отекна из гората.",
        "Ема скочи — намери тайната!",
      ],
      wrong: [
        "Ема прелисти тетрадката. Нека опитаме отново.",
        "Птицата клюна тетрадката насърчително — опитай пак!",
        "'Хм,' помисли Ема. 'Трябва да опитам отново.'",
        "Горичката мълчеше. Нека помислим заедно.",
      ],
      end: (c, t) =>
        c === t
          ? `Ема попълни тетрадката си — ${c} от ${t} тайни открити! Истински натуралист! 🌿`
          : `Ема се прибра с нови знания! ${c} от ${t} открити. Гората те чака отново! 🦋`,
    },
    en: {
      title: "Emma's Nature Discovery",
      characters: "Emma",
      setting: "Enchanted Forest",
      intro: "Emma packed her backpack and entered the Enchanted Forest. With binoculars and a notebook, she was ready to discover nature's secrets. Help her find the answers!",
      bridges: [
        "Emma stopped and noticed something interesting:",
        "A butterfly landed nearby, as if asking:",
        "Emma opened her notebook and read:",
        "A signpost appeared on the path:",
        "Emma peered through her binoculars and wondered:",
      ],
      correct: [
        "Emma jotted it down — correct!",
        "The butterfly fluttered with joy!",
        "The forest hummed in agreement.",
        "'That's right!' echoed through the trees.",
        "Emma jumped — she found the secret!",
      ],
      wrong: [
        "Emma flipped through her notebook. Try again!",
        "The butterfly waited patiently. One more try!",
        "'Hmm,' Emma thought. 'Let me reconsider.'",
        "The forest fell quiet. Let's think together.",
      ],
      end: (c, t) =>
        c === t
          ? `Emma filled her notebook — ${c} of ${t} secrets discovered! A true naturalist! 🌿`
          : `Emma returned with new knowledge! ${c} of ${t} found. The forest awaits your return! 🦋`,
    },
  },
  "logic-thinking": {
    bg: {
      title: "Алекс в Загадъчния дворец",
      characters: "Алекс",
      setting: "Загадъчен дворец",
      intro: "Алекс откри портите на Загадъчния дворец — стени, покрити с логически пъзели. Само онзи, който мисли ясно, може да мине. Помогни на Алекс да стигне до края!",
      bridges: [
        "Пред Алекс се появи загадка:",
        "Врата с надпис попита:",
        "Ехото в двореца повтори:",
        "Стражът на дворца изпита Алекс:",
        "Следващата стая поиска отговор:",
      ],
      correct: [
        "Вратата се отвори! Алекс мина смело.",
        "Браво! Ехото отекна от радост.",
        "'Умен!' — отекна из двореца.",
        "Стражът отстъпи с уважение.",
        "Стаята засия — правилно!",
      ],
      wrong: [
        "Вратата остана затворена. Опитай пак!",
        "Алекс се замисли по-дълбоко. Нека опитаме отново.",
        "Ехото чакаше отговор. Пробвай още веднъж.",
        "Стражът поклати глава. Мисли малко повече!",
      ],
      end: (c, t) =>
        c === t
          ? `Алекс премина двореца — ${c} от ${t} загадки решени! Истински мислител! 🧩`
          : `Алекс излезе победител! ${c} от ${t} решени. Дворецът те чака за нова мисия! 🏛️`,
    },
    en: {
      title: "Alex's Mystery Palace",
      characters: "Alex",
      setting: "Mystery Palace",
      intro: "Alex discovered the doors of the Mystery Palace — walls covered in riddles and logic puzzles. Only those who think clearly can pass through. Help Alex reach the end!",
      bridges: [
        "A puzzle appeared before Alex:",
        "A door with a sign asked:",
        "The echo of the palace repeated:",
        "The palace guardian tested Alex:",
        "The next chamber required an answer:",
      ],
      correct: [
        "The door opened! Alex stepped forward boldly.",
        "Brilliant! The echo rang with joy.",
        "'Smart!' echoed through the palace.",
        "The guardian stepped aside respectfully.",
        "The chamber glowed — correct!",
      ],
      wrong: [
        "The door stayed shut. Try again!",
        "Alex thought harder. Let's try once more.",
        "The echo waited for an answer. Try again!",
        "The guardian shook their head. Think deeper!",
      ],
      end: (c, t) =>
        c === t
          ? `Alex conquered the palace — ${c} of ${t} riddles solved! A true thinker! 🧩`
          : `Alex emerged victorious! ${c} of ${t} riddles solved. The palace awaits your next mission! 🏛️`,
    },
  },
  "english-language": {
    bg: {
      title: "Тео в Английски Град",
      characters: "Тео",
      setting: "Английски Град",
      intro: "Тео кацна с балона си в Английски Град. Жителите говореха само на английски. За да се ориентира, Тео трябваше да отговаря правилно. Помогни му!",
      bridges: [
        "Жителят на Английски Град попита Тео:",
        "Надпис на сградата питаше:",
        "Приятел от Английски Град се обади:",
        "Пазачът на портата изпита Тео:",
        "Следваща табела зачака отговор:",
      ],
      correct: [
        "Жителят се усмихна широко. 'Браво!'",
        "Надписът светна в зелено. Отлично!",
        "'Добре дошъл!' — каза приятелят.",
        "Портата се отвори. Правилно!",
        "Тео вървеше уверено напред!",
      ],
      wrong: [
        "Жителят изчака търпеливо. Опитай пак!",
        "Надписът мигна в жълто. Помисли отново.",
        "Приятелят кимна насърчително. Още веднъж!",
        "Пазачът изчака търпеливо. Нека опитаме отново.",
      ],
      end: (c, t) =>
        c === t
          ? `Тео опозна Английски Град — ${c} от ${t}! Истински езиков герой! 🌍`
          : `Тео благодари за помощта! ${c} от ${t} верни. Английски Град те чака отново! ✈️`,
    },
    en: {
      title: "Theo's English City Adventure",
      characters: "Theo",
      setting: "English City",
      intro: "Theo arrived in English City by hot air balloon. The residents only speak English. To find his way, Theo must answer every question correctly. Help him!",
      bridges: [
        "A resident of English City asked Theo:",
        "A sign on the building said:",
        "A friend from English City called out:",
        "The gate guardian tested Theo:",
        "The next signpost waited for an answer:",
      ],
      correct: [
        "The resident smiled. 'Bravo!'",
        "The sign lit up green. Excellent!",
        "'Welcome!' said the friend.",
        "The gate opened. Correct!",
        "Theo walked forward confidently!",
      ],
      wrong: [
        "The resident waited patiently. Try again!",
        "The sign flickered yellow. Think again.",
        "The friend nodded encouragingly. One more time!",
        "The guardian waited patiently. Let's try again.",
      ],
      end: (c, t) =>
        c === t
          ? `Theo fully explored English City — ${c} of ${t}! A true language hero! 🌍`
          : `Theo thanked everyone for their patience! ${c} of ${t} correct. English City awaits your return! ✈️`,
    },
  },
};

function getDefaultTemplate(lang: LangCode): StoryTemplate {
  const defs: Record<LangCode, StoryTemplate> = {
    bg: {
      title: "AYA Приключение",
      characters: "Мими",
      setting: "Вълшебна страна",
      intro: "Мими пристигна в Вълшебната страна с дълъг списък от предизвикателства. Единствено умни деца могат да й помогнат. Помогни на Мими!",
      bridges: ["Мими срещна ново предизвикателство:", "Следващата задача чакаше:", "Мими попита:", "Пред нея се появи въпрос:"],
      correct: ["Браво! Мими продължи напред.", "Точно! Вълшебната страна засия.", "Перфектно! Мими скочи от радост.", "Чудесно!"],
      wrong: ["Мими се замисли. Опитай пак.", "Вълшебната страна чакаше. Опитай отново.", "Почти! Пробвай още веднъж.", "Нека помислим заедно."],
      end: (c, t) => c === t ? `Мими завърши приключението — ${c} от ${t}! 🌟` : `Мими благодари за помощта! ${c} от ${t} верни. ⭐`,
    },
    en: {
      title: "AYA Adventure",
      characters: "Mimi",
      setting: "Magic Land",
      intro: "Mimi arrived in Magic Land, ready for new challenges. Only clever children can help her. Help Mimi!",
      bridges: ["Mimi faced a new challenge:", "The next task waited:", "Mimi asked:", "A question appeared before her:"],
      correct: ["Bravo! Mimi moved forward.", "Correct! Magic Land shone bright.", "Perfect! Mimi jumped for joy.", "Excellent!"],
      wrong: ["Mimi thought harder. Try again.", "Magic Land waited. Try once more.", "Almost! Try one more time.", "Let's think together."],
      end: (c, t) => c === t ? `Mimi completed the adventure — ${c} of ${t}! 🌟` : `Mimi thanks you! ${c} of ${t} correct. ⭐`,
    },
    es: {
      title: "Aventura AYA",
      characters: "Mimi",
      setting: "Tierra Mágica",
      intro: "Mimi llegó a la Tierra Mágica lista para nuevos desafíos. ¡Sólo los niños inteligentes pueden ayudarla!",
      bridges: ["Mimi enfrentó un nuevo desafío:", "La siguiente tarea esperaba:", "Mimi preguntó:", "Una pregunta apareció:"],
      correct: ["¡Bravo! Mimi avanzó.", "¡Correcto!", "¡Perfecto! ¡Mimi saltó de alegría!", "¡Excelente!"],
      wrong: ["¡Inténtalo de nuevo!", "¡Prueba otra vez!", "¡Casi! ¡Una oportunidad más!", "Pensemos juntos."],
      end: (c, t) => c === t ? `¡Aventura completada — ${c} de ${t}! 🌟` : `¡${c} de ${t} correctos! ¡Cada vez mejoras más! ⭐`,
    },
    de: {
      title: "AYA Abenteuer",
      characters: "Mimi",
      setting: "Zauberland",
      intro: "Mimi kam ins Zauberland, bereit für neue Herausforderungen. Hilf Mimi!",
      bridges: ["Mimi begegnete einer neuen Herausforderung:", "Die nächste Aufgabe wartete:", "Mimi fragte:", "Eine Frage erschien:"],
      correct: ["Bravo! Mimi ging weiter.", "Richtig!", "Perfekt! Mimi jubelte.", "Ausgezeichnet!"],
      wrong: ["Versuch es nochmal!", "Probiere es erneut!", "Fast! Noch ein Versuch.", "Denken wir gemeinsam."],
      end: (c, t) => c === t ? `Abenteuer abgeschlossen — ${c} von ${t}! 🌟` : `${c} von ${t} richtig! ⭐`,
    },
    fr: {
      title: "Aventure AYA",
      characters: "Mimi",
      setting: "Pays Magique",
      intro: "Mimi est arrivée au Pays Magique, prête pour de nouveaux défis. Aide Mimi!",
      bridges: ["Mimi a rencontré un nouveau défi:", "La prochaine tâche attendait:", "Mimi a demandé:", "Une question est apparue:"],
      correct: ["Bravo! Mimi a avancé.", "Correct!", "Parfait! Mimi a sauté de joie!", "Excellent!"],
      wrong: ["Réessaie!", "Essaie encore!", "Presque! Encore une chance.", "Réfléchissons ensemble."],
      end: (c, t) => c === t ? `Aventure terminée — ${c} sur ${t}! 🌟` : `${c} sur ${t} corrects! ⭐`,
    },
  };
  return defs[lang] ?? defs.en;
}

function getTemplate(subjectId: string, lang: LangCode): StoryTemplate {
  const exact = TEMPLATES[subjectId];
  if (exact) {
    return exact[lang] ?? exact.en ?? getDefaultTemplate(lang);
  }
  const prefixKey = Object.keys(TEMPLATES).find(k => subjectId.startsWith(k));
  if (prefixKey) {
    const t = TEMPLATES[prefixKey];
    return (t[lang] ?? t.en) ?? getDefaultTemplate(lang);
  }
  return getDefaultTemplate(lang);
}

function cycled<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

function checkAnswer(given: string, expected: string): boolean {
  return given.trim().toLowerCase() === expected.trim().toLowerCase();
}

function phaseEmotion(p: StoryPhase): AyaEmotion {
  switch (p.kind) {
    case "intro":    return "happy";
    case "scene":    return "thinking";
    case "question": return p.attempts > 0 ? "encourage" : "neutral";
    case "outcome":  return p.correct ? "celebrate" : "encourage";
    case "end":      return "celebrate";
  }
}

/* ─── Progress dots ─────────────────────────────────────────────── */

function ProgressDots({ total, current, correctSoFar }: { total: number; current: number; correctSoFar: number }) {
  return (
    <div className="flex gap-1.5 justify-center mb-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i < current
              ? "w-6 bg-amber-400"
              : i === current
              ? "w-6 bg-amber-300 animate-pulse"
              : "w-5 bg-gray-200"
          )}
        />
      ))}
      <span className="text-[10px] text-muted-foreground ml-1 self-center">{correctSoFar}/{total}</span>
    </div>
  );
}

/* ─── Story engine component ─────────────────────────────────────── */

export interface StoryEngineProps {
  data: StoryLessonData;
  topic: Topic;
  subject: Subject;
  lang: LangCode;
  grade: number;
  onComplete: (practiceCorrect: number, quizCorrect: number, practiceTotal: number, quizTotal: number) => void;
  onBack: () => void;
}

export function StoryLessonEngine({ data, topic, subject, lang, onComplete, onBack }: StoryEngineProps) {
  const tpl = getTemplate(subject.id, lang);
  const problems = data.practice.problems;
  const l = STORY_L[lang] ?? STORY_L.en;

  const [phase, setPhase] = useState<StoryPhase>({ kind: "intro" });
  const [answerInput, setAnswerInput] = useState("");

  const correctRef = useRef(0);
  const completedRef = useRef(false);

  const bridgeTexts = useRef(problems.map((_, i) => cycled(tpl.bridges, i)));
  const correctTexts = useRef(problems.map((_, i) => cycled(tpl.correct, i)));
  const wrongTexts = useRef(problems.map((_, i) => cycled(tpl.wrong, i)));

  const finish = useCallback((correct: number) => {
    if (!completedRef.current) {
      completedRef.current = true;
      onComplete(correct, 0, problems.length, 0);
    }
  }, [onComplete, problems.length]);

  const goScene = (idx: number) => {
    setAnswerInput("");
    setPhase({ kind: "scene", idx });
  };

  const goQuestion = (idx: number, attempts = 0) => {
    setAnswerInput("");
    setPhase({ kind: "question", idx, attempts });
  };

  const submitAnswer = (idx: number, attempts: number) => {
    if (!answerInput.trim()) return;
    const correct = checkAnswer(answerInput, problems[idx].answer);
    if (correct) correctRef.current += 1;
    setPhase({ kind: "outcome", idx, correct, attempts });
    setAnswerInput("");
  };

  const advance = (idx: number, wasCorrect: boolean, attempts: number) => {
    if (!wasCorrect && attempts === 0) {
      goQuestion(idx, 1);
      return;
    }
    const next = idx + 1;
    if (next < problems.length) {
      goScene(next);
    } else {
      const finalCorrect = correctRef.current;
      finish(finalCorrect);
      setPhase({ kind: "end", correct: finalCorrect, total: problems.length });
    }
  };

  const emotion = phaseEmotion(phase);
  const currentIdx = phase.kind === "scene" || phase.kind === "question" || phase.kind === "outcome"
    ? phase.idx
    : phase.kind === "end"
    ? problems.length
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex justify-center">
        <AyaAvatar emotion={emotion} visible speaking />
      </div>

      <AnimatePresence mode="wait">

        {/* ── INTRO ── */}
        {phase.kind === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <div className="text-center">
              <span className="text-3xl block">📖</span>
              <h2 className="font-bold text-base mt-1">{tpl.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tpl.characters} · {tpl.setting}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-sm leading-relaxed text-center">
              {tpl.intro}
            </div>

            <p className="text-center text-xs text-muted-foreground">
              {problems.length} {l.challenges}
            </p>

            <button
              onClick={() => goScene(0)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
            >
              <span>📖</span> {l.startStory} <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── SCENE (bridge before question) ── */}
        {phase.kind === "scene" && (
          <motion.div
            key={`scene-${phase.idx}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <ProgressDots total={problems.length} current={phase.idx} correctSoFar={correctRef.current} />

            <div className="text-center text-xs text-muted-foreground font-medium">
              {l.challengeLabel} {phase.idx + 1} {l.of} {problems.length}
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-sm leading-relaxed italic text-center">
              {bridgeTexts.current[phase.idx]}
            </div>

            <button
              onClick={() => goQuestion(phase.idx)}
              className="w-full bg-gradient-to-r from-amber-400 to-orange-400 text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-md"
            >
              {l.seeChallenge} <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── QUESTION (student answers) ── */}
        {phase.kind === "question" && (
          <motion.div
            key={`q-${phase.idx}-${phase.attempts}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-4"
          >
            <ProgressDots total={problems.length} current={phase.idx} correctSoFar={correctRef.current} />

            {phase.attempts > 0 && (
              <div className="text-center text-xs text-amber-600 font-semibold bg-amber-50 rounded-xl py-2 border border-amber-100">
                {l.tryAgain}
              </div>
            )}

            <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 text-sm leading-relaxed font-medium shadow-sm">
              {problems[phase.idx].question}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={answerInput}
                onChange={e => setAnswerInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submitAnswer(phase.idx, phase.attempts)}
                placeholder={l.yourAnswer}
                className="flex-1 rounded-xl border-2 border-amber-200 bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-amber-400 transition-colors"
                autoFocus
              />
              <button
                onClick={() => submitAnswer(phase.idx, phase.attempts)}
                disabled={!answerInput.trim()}
                className="bg-amber-400 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-amber-500 transition-colors shadow-sm"
              >
                ✓
              </button>
            </div>
          </motion.div>
        )}

        {/* ── OUTCOME (correct / wrong) ── */}
        {phase.kind === "outcome" && (
          <motion.div
            key={`out-${phase.idx}-${phase.attempts}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="space-y-4"
          >
            <ProgressDots total={problems.length} current={phase.idx} correctSoFar={correctRef.current} />

            <div className={cn(
              "rounded-2xl p-5 text-sm leading-relaxed border-2 text-center space-y-2",
              phase.correct
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-amber-50 border-amber-200 text-amber-800"
            )}>
              <span className="text-4xl block">{phase.correct ? "🎉" : phase.attempts === 0 ? "💪" : "🤗"}</span>
              <p className="font-medium">
                {phase.correct
                  ? correctTexts.current[phase.idx]
                  : wrongTexts.current[phase.idx]}
              </p>
              {!phase.correct && phase.attempts > 0 && (
                <p className="text-xs text-muted-foreground pt-1">
                  {l.correctAnswer}: <strong>{problems[phase.idx].answer}</strong>
                </p>
              )}
            </div>

            <button
              onClick={() => advance(phase.idx, phase.correct, phase.attempts)}
              className={cn(
                "w-full font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity text-white shadow-md",
                phase.correct
                  ? "bg-gradient-to-r from-green-400 to-emerald-400"
                  : phase.attempts === 0
                  ? "bg-gradient-to-r from-amber-400 to-orange-400"
                  : "bg-gradient-to-r from-indigo-400 to-violet-400"
              )}
            >
              {phase.correct || phase.attempts > 0
                ? <><span>{l.continueBtn}</span> <ChevronRight className="w-4 h-4" /></>
                : <><RotateCcw className="w-4 h-4" /> <span>{l.tryAgainBtn}</span></>
              }
            </button>
          </motion.div>
        )}

        {/* ── END (story conclusion) ── */}
        {phase.kind === "end" && (
          <motion.div
            key="end"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="text-center space-y-2">
              <span className="text-5xl block">🏆</span>
              <h2 className="font-bold text-lg">{l.storyComplete}</h2>
              <div className="flex items-center justify-center gap-2 text-3xl font-bold">
                <Star className="w-7 h-7 text-amber-400 fill-amber-400" />
                <span>
                  {phase.correct}
                  <span className="text-muted-foreground text-lg"> / {phase.total}</span>
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 text-sm leading-relaxed text-center">
              {tpl.end(phase.correct, phase.total)}
            </div>

            <button
              onClick={onBack}
              className="w-full bg-white border-2 border-amber-200 text-amber-700 font-bold py-3 rounded-2xl hover:bg-amber-50 transition-colors"
            >
              {l.backToTopics}
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
