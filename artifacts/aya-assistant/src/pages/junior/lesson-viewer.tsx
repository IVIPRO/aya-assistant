import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Eye, CheckCircle2, XCircle,
  ChevronRight, RotateCcw, Loader2, Trophy, Star, Sparkles,
  Volume2, VolumeX,
} from "lucide-react";
import { useAyaLessonVoice, type EmotionMode } from "@/hooks/use-aya-lesson-voice";
import { cn } from "@/components/layout";
import { getListChildrenQueryKey, updateDailyPlanTask } from "@workspace/api-client-react";
import type { LangCode } from "@/lib/i18n";
import type { Subject, Topic } from "@/lib/curriculum";
import { XpToast, type XpReward } from "@/components/xp-toast";
import { AyaAvatarImage as AyaAvatar, type AyaEmotion } from "@/components/AyaAvatarImage";
import { getCuriosityCard, getCuriosityFact, CURIOSITY_BRIDGES, type CuriosityCard as CuriosityCardData } from "@/lib/curiosityEngine";
import { StoryLessonEngine } from "./story-engine";

/* ─── Adaptive profile ──────────────────────────────────────────── */

type TopicContext = "weak" | "strong" | "normal";

interface AdaptiveProfile {
  weakTopics: Array<{ subjectId: string; topicId: string; successRate: number; label: string }>;
  strongTopics: Array<{ subjectId: string; topicId: string; successRate: number }>;
  currentTopicStats: {
    attempts: number; successRate: number; retryCount: number; quizPassed: boolean;
    context: TopicContext;
  } | null;
  overallAccuracy: number | null;
  recommendedMode: "normal" | "review" | "boost";
}

/* ─── Data types ────────────────────────────────────────────────── */

interface LessonContent {
  lesson: {
    title: string;
    explanation: string;
    examples: Array<{ problem: string; solution: string; hint: string }>;
    tip: string;
  };
  practice: {
    instructions: string;
    problems: Array<{ question: string; answer: string }>;
  };
  quiz: {
    instructions: string;
    questions: Array<{ question: string; options: string[]; correctIndex: number }>;
  };
}

/* ─── Engine Phase state machine ────────────────────────────────── */

/* ─── Exercise Pool item (inline type matching API) ─────────────── */

interface PoolExercise {
  id: number;
  question: string;
  correctAnswer: string;
  options: string[] | null;
  hint: string | null;
  explanation: string | null;
  exerciseType: "multiple-choice" | "open-ended";
  difficulty: "easy" | "medium" | "hard";
}

type Phase =
  | { kind: "greeting" }
  | { kind: "explanation" }
  | { kind: "example"; idx: number; revealed: boolean }
  | { kind: "practice"; idx: number; attempts: number; feedback: "none" | "correct" | "wrong" }
  | { kind: "hinting"; practiceIdx: number; attempts: number }
  | { kind: "celebrate"; nextPracticeIdx: number }
  | { kind: "quiz-intro" }
  | { kind: "quiz"; idx: number; selected: number | null; correct: boolean | null }
  | { kind: "completion"; practiceCorrect: number; quizCorrect: number; total: { practice: number; quiz: number } }
  | { kind: "infinite-practice"; exercises: PoolExercise[]; idx: number; correct: number; selected: number | null; inputVal: string; feedback: "none" | "correct" | "wrong"; revealed: boolean };

function phaseEmotion(p: Phase): AyaEmotion {
  switch (p.kind) {
    case "greeting":    return "happy";
    case "explanation": return "neutral";
    case "example":     return p.revealed ? "encourage" : "thinking";
    case "practice":    return p.feedback === "correct" ? "happy" : p.feedback === "wrong" ? "encourage" : "neutral";
    case "hinting":     return "thinking";
    case "celebrate":   return "celebrate";
    case "quiz-intro":  return "happy";
    case "quiz":        return p.selected === null ? "thinking" : p.correct ? "happy" : "encourage";
    case "completion":  return "celebrate";
    case "infinite-practice": return p.feedback === "correct" ? "happy" : p.feedback === "wrong" ? "encourage" : "thinking";
  }
}

/** Maps lesson phase → voice emotion mode for TTS delivery style */
function phaseToVoiceEmotion(p: Phase): EmotionMode {
  switch (p.kind) {
    case "greeting":          return "intro";
    case "explanation":       return "intro";
    case "example":           return "explain";
    case "practice":          return "explain";
    case "hinting":           return "hint";
    case "celebrate":         return "celebration";
    case "quiz-intro":        return "explain";
    case "quiz":              return "explain";
    case "completion":        return "completion";
    case "infinite-practice": return "explain";
  }
}

/* ─── Localized strings ─────────────────────────────────────────── */

const L: Record<LangCode, {
  back: string;
  loading: string;
  ready: string;
  understood: string;
  seeAnswer: string;
  nextExample: string;
  check: string;
  retry: string;
  nextProblem: string;
  startQuiz: string;
  nextQuestion: string;
  backToLessons: string;
  placeholder: string;
  hint: string;
  question: (c: number, t: number) => string;
  step: (c: number, t: number) => string;
  score: (c: number, t: number) => string;
  showAnswer: string;
  keepPracticing: string;
  infPracticeTitle: string;
  infCorrect: string;
  infWrong: string;
  infScore: (c: number) => string;
  infLoading: string;
  infReveal: string;
  infNext: string;
}> = {
  bg: {
    back: "← Назад", loading: "Зареждам урока...",
    ready: "Готов съм!", understood: "Разбрах!",
    seeAnswer: "Виж решението", nextExample: "Следващ пример →",
    check: "Провери", retry: "Опитай пак", nextProblem: "Следваща задача →",
    startQuiz: "Да, готов съм!", nextQuestion: "Следващ →",
    backToLessons: "Назад към уроците", placeholder: "Напиши отговора си…",
    hint: "Подсказка", question: (c, t) => `Въпрос ${c} от ${t}`,
    step: (c, t) => `Стъпка ${c} от ${t}`, score: (c, t) => `${c} от ${t} верни`,
    showAnswer: "Покажи верния отговор",
    keepPracticing: "🔥 Безкрайна практика", infPracticeTitle: "Бонус задачи",
    infCorrect: "✅ Правилно!", infWrong: "❌ Не съвсем…",
    infScore: (c) => `Верни отговори: ${c}`, infLoading: "Зареждам задачи…",
    infReveal: "Покажи отговора", infNext: "Следваща задача →",
  },
  en: {
    back: "← Back", loading: "Loading lesson...",
    ready: "I'm ready!", understood: "Got it!",
    seeAnswer: "See answer", nextExample: "Next example →",
    check: "Check", retry: "Try again", nextProblem: "Next problem →",
    startQuiz: "Yes, let's go!", nextQuestion: "Next →",
    backToLessons: "Back to lessons", placeholder: "Type your answer…",
    hint: "Hint", question: (c, t) => `Question ${c} of ${t}`,
    step: (c, t) => `Step ${c} of ${t}`, score: (c, t) => `${c} of ${t} correct`,
    showAnswer: "Show correct answer",
    keepPracticing: "🔥 Infinite Practice", infPracticeTitle: "Bonus Exercises",
    infCorrect: "✅ Correct!", infWrong: "❌ Not quite…",
    infScore: (c) => `Correct answers: ${c}`, infLoading: "Loading exercises…",
    infReveal: "Show answer", infNext: "Next exercise →",
  },
  es: {
    back: "← Atrás", loading: "Cargando lección...",
    ready: "¡Estoy listo!", understood: "¡Entendido!",
    seeAnswer: "Ver respuesta", nextExample: "Siguiente ejemplo →",
    check: "Comprobar", retry: "Intentar de nuevo", nextProblem: "Siguiente problema →",
    startQuiz: "¡Sí, vamos!", nextQuestion: "Siguiente →",
    backToLessons: "Volver a las lecciones", placeholder: "Escribe tu respuesta…",
    hint: "Pista", question: (c, t) => `Pregunta ${c} de ${t}`,
    step: (c, t) => `Paso ${c} de ${t}`, score: (c, t) => `${c} de ${t} correctas`,
    showAnswer: "Mostrar respuesta",
    keepPracticing: "🔥 Práctica infinita", infPracticeTitle: "Ejercicios bonus",
    infCorrect: "✅ ¡Correcto!", infWrong: "❌ No del todo…",
    infScore: (c) => `Respuestas correctas: ${c}`, infLoading: "Cargando ejercicios…",
    infReveal: "Mostrar respuesta", infNext: "Siguiente ejercicio →",
  },
  de: {
    back: "← Zurück", loading: "Lade Lektion...",
    ready: "Ich bin bereit!", understood: "Verstanden!",
    seeAnswer: "Antwort anzeigen", nextExample: "Nächstes Beispiel →",
    check: "Überprüfen", retry: "Nochmal", nextProblem: "Nächste Aufgabe →",
    startQuiz: "Ja, los geht's!", nextQuestion: "Weiter →",
    backToLessons: "Zurück zu den Lektionen", placeholder: "Gib deine Antwort ein…",
    hint: "Hinweis", question: (c, t) => `Frage ${c} von ${t}`,
    step: (c, t) => `Schritt ${c} von ${t}`, score: (c, t) => `${c} von ${t} richtig`,
    showAnswer: "Richtige Antwort zeigen",
    keepPracticing: "🔥 Unendlich üben", infPracticeTitle: "Bonus-Aufgaben",
    infCorrect: "✅ Richtig!", infWrong: "❌ Nicht ganz…",
    infScore: (c) => `Richtige Antworten: ${c}`, infLoading: "Aufgaben werden geladen…",
    infReveal: "Antwort anzeigen", infNext: "Nächste Aufgabe →",
  },
  fr: {
    back: "← Retour", loading: "Chargement de la leçon...",
    ready: "Je suis prêt!", understood: "Compris!",
    seeAnswer: "Voir la réponse", nextExample: "Exemple suivant →",
    check: "Vérifier", retry: "Réessayer", nextProblem: "Problème suivant →",
    startQuiz: "Oui, allons-y!", nextQuestion: "Suivant →",
    backToLessons: "Retour aux leçons", placeholder: "Tape ta réponse…",
    hint: "Indice", question: (c, t) => `Question ${c} sur ${t}`,
    step: (c, t) => `Étape ${c} sur ${t}`, score: (c, t) => `${c} sur ${t} correctes`,
    showAnswer: "Afficher la bonne réponse",
    keepPracticing: "🔥 Pratique infinie", infPracticeTitle: "Exercices bonus",
    infCorrect: "✅ Correct!", infWrong: "❌ Pas tout à fait…",
    infScore: (c) => `Bonnes réponses: ${c}`, infLoading: "Chargement des exercices…",
    infReveal: "Afficher la réponse", infNext: "Exercice suivant →",
  },
};

/* ─── AYA Dialogues ─────────────────────────────────────────────── */

const D: Record<LangCode, {
  greeting: string[];
  topicIntro: (topic: string) => string[];
  explanationLead: string[];
  exampleLead: string[];
  exampleReveal: string[];
  practiceLead: string[];
  practiceCorrect: string[];
  practiceWrong: string[];
  practiceWrong2: string[];
  hinting: string[];
  retryAfterHint: string[];
  celebrate: string[];
  celebrateLead: string[];
  quizIntro: string[];
  quizCorrect: string[];
  quizWrong: string[];
  praiseRecovery: string[];
  completionHigh: (topic: string) => string;
  completionMid: (topic: string) => string;
  completionLow: (topic: string) => string;
  continueLesson: string;
  askAya: string;
}> = {
  bg: {
    greeting: ["Здравей! Готов ли си за нов урок? 🎉", "Хей! Днес ще научим нещо интересно!", "Здравей! Радвам се да те видя отново!"],
    topicIntro: (t) => [`Днес ще учим: „${t}". Хайде да започнем!`, `Темата ни е „${t}". Ще е интересно!`, `Ще разберем заедно „${t}"!`],
    explanationLead: ["Нека ти обясня как работи това:", "Ето как работи:", "Слушай — ще ти обясня:"],
    exampleLead: ["Нека разгледаме пример заедно:", "Ето един пример:", "Виж как се прави:"],
    exampleReveal: ["Ето решението! Забеляза ли начина?", "Готово! Разбра ли?", "Така се прави! Лесно, нали?"],
    practiceLead: ["Сега ти опитай! Вярвам в теб. 💪", "Твой ред! Покажи какво знаеш.", "Покажи какво умееш!"],
    practiceCorrect: ["Браво! Правилно! 🌟", "Отлично! Ти го направи!", "Перфектно! Продължавай така!", "Супер! Знаех, че можеш!"],
    practiceWrong: ["Почти! Помисли малко повече.", "Не съвсем — хайде да опитаме пак.", "Близо си! Погледни отново условието."],
    practiceWrong2: ["Нека ти дам подсказка.", "Не се притеснявай — ще ти помогна!", "Заедно ще го намерим!"],
    hinting: ["Нека помислим заедно — ето подсказка:", "Ще го разделим на малки стъпки.", "Ще ти покажа лесен начин."],
    retryAfterHint: ["Сега е твой ред! Опитай пак.", "Хайде — след подсказката ще успееш!", "Опитай отново. Ти можеш!"],
    celebrate: ["Две поредни верни! Справяш се чудесно! 🌟🌟", "Страхотно! Продължавай така! 🎉", "Чудесно! Вървиш много добре! ⭐"],
    celebrateLead: ["Продължаваме напред!", "Следваща задача!", "Браво — напред!"],
    quizIntro: ["Готов ли си за малък тест? 📝", "Хайде да видим какво научи!", "Нека проверим знанията ти — смело!"],
    quizCorrect: ["Браво!", "Правилно! 🌟", "Отлично!", "Верно!"],
    quizWrong: ["Не съвсем — продължаваме напред!", "Близо! Ето верния отговор:", "Следващия път ще е по-лесно."],
    praiseRecovery: ["Браво! Намери го! 💛", "Добре! Виждам, че разбра.", "Намери го! Продължавай така."],
    completionHigh: (t) => `🏆 Невероятно! Усвои „${t}" перфектно! Гордея се с теб!`,
    completionMid: (t) => `⭐ Браво! Научи „${t}". Практикувай още малко и ще го владееш напълно!`,
    completionLow: (t) => `💪 Добро начало с „${t}"! Прегледай урока и опитай пак — заедно ще успеем!`,
    continueLesson: "Следващ урок →",
    askAya: "Попитай АЯ",
  },
  en: {
    greeting: ["Hello! Ready for a new lesson? 🎉", "Hey! We're going to learn something cool today!", "Hi! I'm so glad to see you!"],
    topicIntro: (t) => [`Today we'll learn: "${t}". Let's go!`, `Our topic is "${t}". It'll be fun!`, `We'll figure out "${t}" together!`],
    explanationLead: ["Let me explain how this works:", "Here's how it is:", "Listen carefully — I'll explain:"],
    exampleLead: ["Let's look at an example together:", "Here's an example:", "See how it looks in practice:"],
    exampleReveal: ["Here's the solution! Did you see how I found it?", "Done! Do you understand the logic?", "That's how it's done! Easy, right?"],
    practiceLead: ["Now you try! I believe in you. 💪", "Your turn! Show me what you know.", "Practice time! Let me see how you do."],
    practiceCorrect: ["Great! Correct! 🌟", "Excellent! You did it!", "Perfect! Keep it up!", "Super! I knew you could!"],
    practiceWrong: ["Almost! Think a little more.", "Not quite — let's try again.", "You're close! Look at the problem again."],
    practiceWrong2: ["Let me give you a hint...", "Don't worry — here's some help:", "We'll find it together!"],
    hinting: ["Let's think together — here's a hint:", "We'll break it into small steps.", "Let me show you how it's done first."],
    retryAfterHint: ["Now it's your turn! Try again.", "Go for it — the hint will help!", "Let's try again together."],
    celebrate: ["Amazing! Two correct answers in a row! 🌟🌟", "You're doing great! Keep going! 🎉", "Wonderful! You're doing it perfectly! ⭐"],
    celebrateLead: ["Let's keep going!", "Next problem!", "Great — onward!"],
    quizIntro: ["Ready for a mini quiz? 📝", "Let's see what you learned!", "Let's check your knowledge — don't worry!"],
    quizCorrect: ["Great!", "Correct! 🌟", "Excellent!", "Right!"],
    quizWrong: ["Not quite — but no worries!", "Close! Here's the right answer:", "Next time will be easier."],
    praiseRecovery: ["You got it! 💛", "Well done — I saw you figure it out.", "There you go! Keep going."],
    completionHigh: (t) => `🏆 Amazing! You mastered "${t}" perfectly! I'm so proud of you!`,
    completionMid: (t) => `⭐ Well done! You learned "${t}". Practice a little more for full mastery!`,
    completionLow: (t) => `💪 Good start with "${t}"! Review the lesson and try again — we'll get there!`,
    continueLesson: "Next lesson →",
    askAya: "Ask AYA",
  },
  es: {
    greeting: ["¡Hola! ¿Lista para una nueva lección? 🎉", "¡Hola! ¡Aprenderemos algo genial hoy!", "¡Hola! ¡Me alegra verte!"],
    topicIntro: (t) => [`Hoy aprenderemos: "${t}". ¡Vamos!`, `Nuestro tema es "${t}". ¡Será divertido!`, `¡Descubriremos "${t}" juntos!`],
    explanationLead: ["Déjame explicarte cómo funciona:", "Así es como está:", "Escucha — te explicaré:"],
    exampleLead: ["Veamos un ejemplo juntos:", "Aquí hay un ejemplo:", "Mira cómo se ve en práctica:"],
    exampleReveal: ["¡Aquí está la solución! ¿Viste cómo la encontré?", "¡Listo! ¿Entiendes la lógica?", "¡Así se hace! Fácil, ¿verdad?"],
    practiceLead: ["¡Ahora tú intenta! Creo en ti. 💪", "¡Tu turno! Muéstrame lo que sabes.", "¡Hora de practicar!"],
    practiceCorrect: ["¡Bien! ¡Correcto! 🌟", "¡Excelente! ¡Lo lograste!", "¡Perfecto! ¡Sigue así!", "¡Genial!"],
    practiceWrong: ["¡Casi! Piensa un poco más.", "No del todo — intentemos de nuevo.", "¡Estás cerca! Mira el problema otra vez."],
    practiceWrong2: ["Déjame darte una pista...", "No te preocupes — aquí va ayuda:", "¡Lo encontraremos juntos!"],
    hinting: ["Pensemos juntos — aquí va una pista:", "Lo dividiremos en pequeños pasos.", "Primero te muestro cómo se hace."],
    retryAfterHint: ["¡Ahora es tu turno! Inténtalo de nuevo.", "¡Vamos — la pista te ayudará!", "Intentémoslo juntos otra vez."],
    celebrate: ["¡Increíble! ¡Dos respuestas correctas seguidas! 🌟🌟", "¡Lo estás haciendo genial! ¡Sigue! 🎉", "¡Maravilloso! ¡Lo haces perfectamente! ⭐"],
    celebrateLead: ["¡Seguimos adelante!", "¡Siguiente problema!", "¡Bien — continuemos!"],
    quizIntro: ["¿Lista para un mini quiz? 📝", "¡Veamos qué aprendiste!", "¡Comprobemos tu conocimiento — sin miedo!"],
    quizCorrect: ["¡Bien!", "¡Correcto! 🌟", "¡Excelente!", "¡Acertaste!"],
    quizWrong: ["No del todo — ¡pero no te preocupes!", "¡Cerca! Aquí está la respuesta correcta:", "La próxima vez será más fácil."],
    praiseRecovery: ["¡Lo lograste! 💛", "¡Bien! Vi que lo entendiste.", "¡Ahí está! Sigue adelante."],
    completionHigh: (t) => `🏆 ¡Increíble! ¡Dominaste "${t}" perfectamente!`,
    completionMid: (t) => `⭐ ¡Bien hecho! Aprendiste "${t}". ¡Practica un poco más!`,
    completionLow: (t) => `💪 ¡Buen comienzo con "${t}"! Repasa y vuelve a intentarlo.`,
    continueLesson: "Siguiente lección →",
    askAya: "Preguntar a AYA",
  },
  de: {
    greeting: ["Hallo! Bereit für eine neue Lektion? 🎉", "Hey! Wir lernen heute etwas Tolles!", "Hallo! Schön, dich zu sehen!"],
    topicIntro: (t) => [`Heute lernen wir: „${t}". Los geht's!`, `Unser Thema ist „${t}". Es wird spannend!`, `Wir entdecken „${t}" gemeinsam!`],
    explanationLead: ["Lass mich erklären, wie das funktioniert:", "So ist es:", "Hör zu — ich erkläre:"],
    exampleLead: ["Schauen wir uns ein Beispiel an:", "Hier ist ein Beispiel:", "Sieh, wie es in der Praxis aussieht:"],
    exampleReveal: ["Hier ist die Lösung! Hast du gesehen, wie ich sie gefunden habe?", "Fertig! Verstehst du die Logik?", "So macht man es! Einfach, oder?"],
    practiceLead: ["Jetzt bist du dran! Ich glaube an dich. 💪", "Dein Turn! Zeig, was du kannst.", "Übungszeit!"],
    practiceCorrect: ["Super! Richtig! 🌟", "Ausgezeichnet! Du hast es geschafft!", "Perfekt!", "Toll!"],
    practiceWrong: ["Fast! Denk noch etwas nach.", "Nicht ganz — versuchen wir es nochmal.", "Du bist nah dran! Schau nochmal."],
    practiceWrong2: ["Lass mich dir einen Hinweis geben...", "Keine Sorge — hier ist Hilfe:", "Wir finden es zusammen!"],
    hinting: ["Lass uns zusammen denken — hier ist ein Hinweis:", "Wir teilen es in kleine Schritte.", "Lass mich dir zuerst zeigen, wie es geht."],
    retryAfterHint: ["Jetzt bist du dran! Versuche es nochmal.", "Los — der Hinweis wird helfen!", "Versuchen wir es noch einmal zusammen."],
    celebrate: ["Unglaublich! Zwei richtige Antworten hintereinander! 🌟🌟", "Du machst das großartig! Weiter so! 🎉", "Wunderbar! Du machst es perfekt! ⭐"],
    celebrateLead: ["Weiter geht's!", "Nächste Aufgabe!", "Toll — vorwärts!"],
    quizIntro: ["Bereit für ein Mini-Quiz? 📝", "Mal sehen, was du gelernt hast!", "Lass uns dein Wissen testen!"],
    quizCorrect: ["Super!", "Richtig! 🌟", "Ausgezeichnet!", "Korrekt!"],
    quizWrong: ["Nicht ganz — aber kein Problem!", "Nah dran! Hier ist die richtige Antwort:", "Beim nächsten Mal wird's leichter."],
    praiseRecovery: ["Geschafft! 💛", "Gut — ich sehe, du hast es verstanden.", "Da ist es! Weiter so."],
    completionHigh: (t) => `🏆 Fantastisch! Du hast „${t}" perfekt gemeistert!`,
    completionMid: (t) => `⭐ Gut gemacht! Du hast „${t}" gelernt. Üb noch ein bisschen!`,
    completionLow: (t) => `💪 Guter Anfang mit „${t}"! Wiederhol die Lektion und versuch es nochmal.`,
    continueLesson: "Nächste Lektion →",
    askAya: "AYA fragen",
  },
  fr: {
    greeting: ["Bonjour! Prêt pour une nouvelle leçon? 🎉", "Salut! On va apprendre quelque chose de super!", "Bonjour! Content de te voir!"],
    topicIntro: (t) => [`Aujourd'hui on apprend: "${t}". C'est parti!`, `Notre sujet est "${t}". Ce sera amusant!`, `On découvrira "${t}" ensemble!`],
    explanationLead: ["Laisse-moi t'expliquer comment ça marche:", "Voilà comment c'est:", "Écoute — je vais t'expliquer:"],
    exampleLead: ["Regardons un exemple ensemble:", "Voici un exemple:", "Vois comment ça se passe en pratique:"],
    exampleReveal: ["Voilà la solution! Tu as vu comment je l'ai trouvée?", "Voilà! Tu comprends la logique?", "C'est comme ça! Facile, non?"],
    practiceLead: ["Maintenant à toi! Je crois en toi. 💪", "Ton tour! Montre ce que tu sais.", "C'est l'heure de pratiquer!"],
    practiceCorrect: ["Super! Correct! 🌟", "Excellent! Tu l'as fait!", "Parfait!", "Génial!"],
    practiceWrong: ["Presque! Réfléchis encore un peu.", "Pas tout à fait — réessayons.", "Tu es proche! Regarde encore."],
    practiceWrong2: ["Laisse-moi te donner un indice...", "Ne t'inquiète pas — voici de l'aide:", "On le trouvera ensemble!"],
    hinting: ["Réfléchissons ensemble — voici un indice:", "On va le diviser en petites étapes.", "Laisse-moi d'abord te montrer comment faire."],
    retryAfterHint: ["Maintenant c'est ton tour! Réessaie.", "Allez — l'indice va t'aider!", "Réessayons ensemble."],
    celebrate: ["Incroyable! Deux bonnes réponses d'affilée! 🌟🌟", "Tu fais ça super bien! Continue! 🎉", "Merveilleux! Tu le fais parfaitement! ⭐"],
    celebrateLead: ["On continue!", "Problème suivant!", "Super — en avant!"],
    quizIntro: ["Prêt pour un mini quiz? 📝", "Voyons ce que tu as appris!", "Testons tes connaissances!"],
    quizCorrect: ["Super!", "Correct! 🌟", "Excellent!", "Juste!"],
    quizWrong: ["Pas tout à fait — mais pas de souci!", "Proche! Voici la bonne réponse:", "La prochaine fois sera plus facile."],
    praiseRecovery: ["Tu l'as eu! 💛", "Bien — je vois que tu as compris.", "Voilà! Continue comme ça."],
    completionHigh: (t) => `🏆 Incroyable! Tu as maîtrisé "${t}" parfaitement!`,
    completionMid: (t) => `⭐ Bien joué! Tu as appris "${t}". Pratique encore un peu!`,
    completionLow: (t) => `💪 Bon début avec "${t}"! Relis la leçon et réessaie.`,
    continueLesson: "Leçon suivante →",
    askAya: "Demander à AYA",
  },
};

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Adaptive Context Dialogue ─────────────────────────────────── */

const CONTEXT_D: Record<LangCode, Record<TopicContext, {
  greeting: string[];
  practiceSupport: string;
  hintPrefix: string;
  skipExplanationBtn: string;
  reExplainMsg: string;
  quizSupport: string;
}>> = {
  bg: {
    weak: {
      greeting: [
        "Вече работихме по тази тема. Нека я затвърдим заедно — стъпка по стъпка! 💪",
        "Тази тема беше предизвикателна. Но сега с практика ще стане по-лесно! 🌟",
        "Заедно ще преодолеем тези трудности! Аз съм тук да помогна.",
      ],
      practiceSupport: "Не се притеснявай — тази тема е трудна. Помислим заедно!",
      hintPrefix: "💡 Подсказка:",
      skipExplanationBtn: "Виж обяснението →",
      reExplainMsg: "Нека се върнем към основата — ще разгледаме обяснението заедно! 🔍",
      quizSupport: "Не се притеснявай! Тази тема ти идва трудна — продължаваме заедно.",
    },
    strong: {
      greeting: [
        "Справяш се отлично с тази тема! Нека потвърдим знанията ти. 🏆",
        "Ти вече владееш тази тема! Едно бързо преговаряне и продължаваме. ⭐",
        "Страхотно! Тази тема ти е добре позната. Нека я затвърдим!",
      ],
      practiceSupport: "Чудесно! Тази тема ти е силна страна.",
      hintPrefix: "💡 Спомни си:",
      skipExplanationBtn: "Познавам обяснението, пропусни →",
      reExplainMsg: "",
      quizSupport: "",
    },
    normal: {
      greeting: [],
      practiceSupport: "",
      hintPrefix: "💡",
      skipExplanationBtn: "",
      reExplainMsg: "",
      quizSupport: "",
    },
  },
  en: {
    weak: {
      greeting: [
        "We've worked on this topic before. Let's strengthen it together — step by step! 💪",
        "This topic was challenging. With more practice it'll get easier! 🌟",
        "We'll work through the difficulties together! I'm here to help.",
      ],
      practiceSupport: "Don't worry — this topic is tricky. Let's think together!",
      hintPrefix: "💡 Hint:",
      skipExplanationBtn: "See explanation →",
      reExplainMsg: "Let's go back to basics — I'll walk you through the explanation again! 🔍",
      quizSupport: "No worries! This topic is tricky — let's keep going together.",
    },
    strong: {
      greeting: [
        "You're doing great with this topic! Let's confirm your knowledge. 🏆",
        "You already master this topic! A quick review and we move on. ⭐",
        "Fantastic! This topic is familiar to you. Let's solidify it!",
      ],
      practiceSupport: "Great! This topic is one of your strengths.",
      hintPrefix: "💡 Remember:",
      skipExplanationBtn: "I know this — skip →",
      reExplainMsg: "",
      quizSupport: "",
    },
    normal: {
      greeting: [],
      practiceSupport: "",
      hintPrefix: "💡",
      skipExplanationBtn: "",
      reExplainMsg: "",
      quizSupport: "",
    },
  },
  es: {
    weak: {
      greeting: [
        "Ya trabajamos en este tema. ¡Reforcémoslo juntos — paso a paso! 💪",
        "Este tema fue desafiante. ¡Con más práctica será más fácil! 🌟",
        "¡Superaremos las dificultades juntos! Estoy aquí para ayudar.",
      ],
      practiceSupport: "No te preocupes — este tema es difícil. ¡Pensemos juntos!",
      hintPrefix: "💡 Pista:",
      skipExplanationBtn: "Ver explicación →",
      reExplainMsg: "¡Volvamos a lo básico — repasemos la explicación juntos! 🔍",
      quizSupport: "¡No te preocupes! Este tema es difícil — seguimos juntos.",
    },
    strong: {
      greeting: [
        "¡Lo estás haciendo muy bien en este tema! Confirmemos tu conocimiento. 🏆",
        "¡Ya dominas este tema! Un repaso rápido y seguimos. ⭐",
        "¡Fantástico! Este tema te es familiar. ¡Reforcémoslo!",
      ],
      practiceSupport: "¡Genial! Este tema es uno de tus puntos fuertes.",
      hintPrefix: "💡 Recuerda:",
      skipExplanationBtn: "Lo conozco — saltar →",
      reExplainMsg: "",
      quizSupport: "",
    },
    normal: {
      greeting: [],
      practiceSupport: "",
      hintPrefix: "💡",
      skipExplanationBtn: "",
      reExplainMsg: "",
      quizSupport: "",
    },
  },
  de: {
    weak: {
      greeting: [
        "Wir haben schon an diesem Thema gearbeitet. Lass es uns gemeinsam festigen — Schritt für Schritt! 💪",
        "Dieses Thema war schwierig. Mit mehr Übung wird es leichter! 🌟",
        "Wir überwinden die Schwierigkeiten gemeinsam! Ich bin hier um zu helfen.",
      ],
      practiceSupport: "Kein Sorge — dieses Thema ist schwierig. Denken wir gemeinsam!",
      hintPrefix: "💡 Hinweis:",
      skipExplanationBtn: "Erklärung ansehen →",
      reExplainMsg: "Zurück zu den Grundlagen — ich erkläre es dir noch einmal! 🔍",
      quizSupport: "Keine Sorge! Dieses Thema ist schwierig — wir machen zusammen weiter.",
    },
    strong: {
      greeting: [
        "Du machst das großartig mit diesem Thema! Lass uns dein Wissen bestätigen. 🏆",
        "Du beherrschst dieses Thema bereits! Eine schnelle Wiederholung und weiter. ⭐",
        "Fantastisch! Dieses Thema ist dir vertraut. Lass es uns festigen!",
      ],
      practiceSupport: "Großartig! Dieses Thema ist eine deiner Stärken.",
      hintPrefix: "💡 Erinnere dich:",
      skipExplanationBtn: "Ich kenne das — überspringen →",
      reExplainMsg: "",
      quizSupport: "",
    },
    normal: {
      greeting: [],
      practiceSupport: "",
      hintPrefix: "💡",
      skipExplanationBtn: "",
      reExplainMsg: "",
      quizSupport: "",
    },
  },
  fr: {
    weak: {
      greeting: [
        "On a déjà travaillé sur ce sujet. Renforçons-le ensemble — étape par étape! 💪",
        "Ce sujet était difficile. Avec plus de pratique ça deviendra plus facile! 🌟",
        "On surmontera les difficultés ensemble! Je suis là pour aider.",
      ],
      practiceSupport: "Ne t'inquiète pas — ce sujet est difficile. Réfléchissons ensemble!",
      hintPrefix: "💡 Indice:",
      skipExplanationBtn: "Voir l'explication →",
      reExplainMsg: "Revenons aux bases — je vais t'expliquer encore une fois! 🔍",
      quizSupport: "Pas d'inquiétude! Ce sujet est difficile — on continue ensemble.",
    },
    strong: {
      greeting: [
        "Tu fais très bien avec ce sujet! Confirmons tes connaissances. 🏆",
        "Tu maîtrises déjà ce sujet! Une révision rapide et on continue. ⭐",
        "Fantastique! Ce sujet t'est familier. Renforçons-le!",
      ],
      practiceSupport: "Super! Ce sujet est l'un de tes points forts.",
      hintPrefix: "💡 Rappelle-toi:",
      skipExplanationBtn: "Je connais — passer →",
      reExplainMsg: "",
      quizSupport: "",
    },
    normal: {
      greeting: [],
      practiceSupport: "",
      hintPrefix: "💡",
      skipExplanationBtn: "",
      reExplainMsg: "",
      quizSupport: "",
    },
  },
};

/* ─── Step Progress Bar ─────────────────────────────────────────── */

function ProgressDots({ current, total, colorClass }: { current: number; total: number; colorClass: string }) {
  return (
    <div className="flex items-center gap-1.5 justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={cn(
          "rounded-full transition-all duration-300",
          i < current ? cn("w-2 h-2", colorClass.replace("text-", "bg-"))
          : i === current ? cn("w-3 h-3 border-2", colorClass.replace("text-", "border-"), colorClass.replace("text-", "bg-"), "opacity-60")
          : "w-2 h-2 bg-muted",
        )} />
      ))}
    </div>
  );
}

/* ─── AYA Speech Bubble ─────────────────────────────────────────── */

function AyaSpeech({ emotion, text, speaking }: { emotion: AyaEmotion; text: string; speaking?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4 mb-4">
      <AyaAvatar emotion={emotion} visible={true} speaking={speaking} />
      <motion.div
        key={text}
        initial={{ opacity: 0, scale: 0.95, y: 4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white border-2 border-blue-100 rounded-2xl px-6 py-4 text-center max-w-sm shadow-sm"
      >
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-t-2 border-l-2 border-blue-100 rotate-45" />
        <p className="text-sm font-medium text-foreground leading-relaxed">{text}</p>
      </motion.div>
    </div>
  );
}

/* ─── Action Button ─────────────────────────────────────────────── */

function ActionBtn({ onClick, subject, children, disabled, variant = "primary", testId }: {
  onClick: () => void;
  subject: Subject;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: "primary" | "ghost";
  testId?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      data-testid={testId}
      className={cn(
        "w-full py-3.5 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2",
        variant === "primary"
          ? cn(subject.bgClass, subject.colorClass, "border-2", subject.borderClass, "hover:opacity-90 disabled:opacity-40 shadow-sm")
          : "bg-muted/40 text-muted-foreground hover:bg-muted hover:text-foreground border border-border/30",
      )}
    >
      {children}
    </button>
  );
}

/* ─── Curiosity Card (shown after lesson completion) ────────────── */

const CURIOSITY_CARD_LABELS: Record<LangCode, {
  seeReveal: string;
  nextLesson: string;
  discoverMore: string;
}> = {
  bg: { seeReveal: "Виж отговора 🔍", nextLesson: "Към следващия урок", discoverMore: "Искаш ли да разберем нещо интересно?" },
  en: { seeReveal: "See the answer 🔍", nextLesson: "Next lesson", discoverMore: "Want to discover something interesting?" },
  es: { seeReveal: "Ver la respuesta 🔍", nextLesson: "Siguiente lección", discoverMore: "¿Quieres descubrir algo interesante?" },
  de: { seeReveal: "Antwort sehen 🔍", nextLesson: "Nächste Lektion", discoverMore: "Möchtest du etwas Interessantes entdecken?" },
  fr: { seeReveal: "Voir la réponse 🔍", nextLesson: "Leçon suivante", discoverMore: "Tu veux découvrir quelque chose d'intéressant?" },
};

function CuriosityCardDisplay({ card, lang }: {
  card: CuriosityCardData;
  lang: LangCode;
}) {
  const [revealShown, setRevealShown] = useState(false);
  const lbl = CURIOSITY_CARD_LABELS[lang];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/60 p-4 space-y-2.5"
    >
      <p className="text-xs font-bold text-violet-400 uppercase tracking-wider text-center">
        {lbl.discoverMore}
      </p>
      <div className="flex items-start gap-2.5">
        <span className="text-2xl flex-shrink-0">{card.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-violet-700 mb-0.5">{card.title}</p>
          <p className="text-sm text-foreground leading-relaxed">{card.content}</p>
          {card.reveal && !revealShown && (
            <button
              onClick={() => setRevealShown(true)}
              className="mt-2 text-xs font-semibold text-violet-600 hover:text-violet-800 underline underline-offset-2"
            >
              {lbl.seeReveal}
            </button>
          )}
          {card.reveal && revealShown && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-2 text-sm font-semibold text-violet-700 bg-violet-100 rounded-xl px-3 py-1.5"
            >
              {card.reveal}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Interactive Lesson Engine ─────────────────────────────────── */

interface EngineProps {
  data: LessonContent;
  topic: Topic;
  subject: Subject;
  lang: LangCode;
  grade: number;
  childId: number;
  topicContext: TopicContext;
  speak: (text: string, emotion?: EmotionMode) => void;
  isVoicePlaying: boolean;
  voiceEnabled: boolean;
  onComplete: (practiceCorrect: number, quizCorrect: number, practiceTotal: number, quizTotal: number) => void;
  onRecordLesson: () => void;
  onBack: () => void;
  onAskAya: () => void;
}

function InteractiveLessonEngine({
  data, topic, subject, lang, grade, childId, topicContext,
  speak, isVoicePlaying, voiceEnabled,
  onComplete, onRecordLesson, onBack, onAskAya,
}: EngineProps) {
  const l = L[lang];
  const d = D[lang];
  const ctxD = CONTEXT_D[lang][topicContext];
  const isPrimary = grade <= 4;

  /* ── stable random strings (avoid re-roll on re-render) */
  const greetingText = useRef(
    ctxD.greeting.length > 0 ? pick(ctxD.greeting) : pick(d.greeting)
  ).current;
  const topicIntroText = useRef(pick(d.topicIntro(topic.label[lang] ?? topic.label.en))).current;

  /* ── phase state */
  const [phase, setPhase] = useState<Phase>({ kind: "greeting" });
  const [dialogue, setDialogue] = useState<string>(greetingText);
  /* spokenText may include content suffix (explanation/problem/hint) beyond what the bubble shows */
  const [spokenText, setSpokenText] = useState<string>(greetingText);
  const [answerInput, setAnswerInput] = useState("");
  /* voiceEmotion: AYA's delivery style for the current TTS line */
  const [voiceEmotion, setVoiceEmotion] = useState<EmotionMode>("intro");

  /* ── infinite practice state */
  const [infLoading, setInfLoading] = useState(false);

  /* ── score tracking */
  const practiceCorrectRef = useRef(0);
  const quizCorrectRef = useRef(0);
  const lessonRecordedRef = useRef(false);
  const consecutiveCorrectRef = useRef(0);
  /* ── cumulative lesson mistake counter (across all practice problems) */
  const lessonMistakesRef = useRef(0);

  /* ─── Teaching Consistency Layer ───────────────────────────────────────────
   * Tracks in-session performance so AYA praise matches real student state.
   * wrongStreak  — consecutive wrong answers in this session
   * correctStreak — consecutive correct answers in this session
   * "Recovery" = first correct after ≥2 wrong → calm genuine praise, not hype
   */
  const sessionPerfRef = useRef({ wrongStreak: 0, correctStreak: 0 });

  const trackAnswer = (correct: boolean) => {
    const s = sessionPerfRef.current;
    if (correct) { s.wrongStreak = 0; s.correctStreak += 1; }
    else         { s.correctStreak = 0; s.wrongStreak += 1; }
  };

  /**
   * Select context-appropriate praise for a CORRECT answer.
   * - recovery (wrong×2+ → correct): calm, genuine recognition
   * - high streak (correct×3+): already handled by celebrate phase, so same as normal here
   * - normal: enthusiastic random pick
   */
  const selectConsistentPraise = (pool: string[], recoveryPool: string[]): string => {
    return sessionPerfRef.current.wrongStreak >= 2
      ? pick(recoveryPool)
      : pick(pool);
  };

  /* ─── Curiosity Loop ────────────────────────────────────────────────────────
   * Triggers a short curiosity moment every 4–6 correctly solved tasks.
   * Non-blocking: fires between tasks without creating a new phase.
   * Disabled for weak-topic sessions so struggling children can stay focused.
   */
  const curiositySolvedRef = useRef(0);
  // Randomize threshold so children don't notice a fixed pattern (4, 5, or 6)
  const curiosityThresholdRef = useRef(4 + Math.floor(Math.random() * 3));

  const maybeTriggerCuriosity = (): string | null => {
    if (topicContext === "weak") return null; // struggling children need focus, not detours
    if (curiositySolvedRef.current < curiosityThresholdRef.current) return null;
    // Threshold reached — compose the curiosity moment
    curiositySolvedRef.current = 0;
    curiosityThresholdRef.current = 4 + Math.floor(Math.random() * 3);
    const fact = getCuriosityFact(subject.id, lang);
    if (!fact) return null;
    const bridges = CURIOSITY_BRIDGES[lang] ?? CURIOSITY_BRIDGES.en;
    return `${pick(bridges)} ${fact.content}`;
  };

  /* ── voice: speak whenever spokenText changes, with current emotion mode ── */
  useEffect(() => {
    speak(spokenText, voiceEmotion);
  }, [spokenText]);

  /* ── phase-specific cached pick refs */
  const explanationLeadRef = useRef(pick(d.explanationLead));
  const exampleLeadRef = useRef(pick(d.exampleLead));
  const practiceLeadRef = useRef(pick(d.practiceLead));

  /* ── curiosity card — stable per lesson session */
  const curiosityCard = useRef(getCuriosityCard(subject.id, lang)).current;
  /* ── mid-lesson curiosity spark — facts/questions only, never disrupts weak-topic focus */
  const explanationSpark = useRef(getCuriosityFact(subject.id, lang)).current;

  const examples = data.lesson.examples;
  const problems = data.practice.problems;
  const questions = data.quiz.questions;

  /* ── total dot count for progress */
  const totalSteps = 2 + examples.length + problems.length + 1 + questions.length + 1;
  const currentStep = (() => {
    switch (phase.kind) {
      case "greeting": return 0;
      case "explanation": return 1;
      case "example": return 2 + phase.idx;
      case "practice": return 2 + examples.length + phase.idx;
      case "hinting": return 2 + examples.length + phase.practiceIdx;
      case "celebrate": return 2 + examples.length + phase.nextPracticeIdx - 1;
      case "quiz-intro": return 2 + examples.length + problems.length;
      case "quiz": return 2 + examples.length + problems.length + 1 + phase.idx;
      case "completion": return totalSteps - 1;
      case "infinite-practice": return totalSteps - 1;
    }
  })();

  /* go() — phase transition: sets phase, dialogue (bubble), spokenText (TTS) + voice emotion from next phase */
  const go = useCallback((next: Phase, text: string, spokenSuffix?: string) => {
    setPhase(next);
    setDialogue(text);
    setVoiceEmotion(phaseToVoiceEmotion(next));
    setSpokenText(spokenSuffix ? `${text} ${spokenSuffix}`.trim() : text);
    setAnswerInput("");
  }, []);

  /* say() — update dialogue + spokenText without changing phase; emotion defaults to "explain" */
  const say = useCallback((text: string, spokenSuffix?: string, emotion?: EmotionMode) => {
    setDialogue(text);
    setVoiceEmotion(emotion ?? "explain");
    setSpokenText(spokenSuffix ? `${text} ${spokenSuffix}`.trim() : text);
  }, []);

  /* ── advance from greeting */
  const fromGreeting = () => {
    const warmMsg = `${topicIntroText} ${explanationLeadRef.current}`;
    const contentSpoken = [data.lesson.explanation, data.lesson.tip].filter(Boolean).join('. ');
    go({ kind: "explanation" }, warmMsg, contentSpoken || undefined);
    if (!lessonRecordedRef.current) {
      lessonRecordedRef.current = true;
      onRecordLesson();
    }
  };

  /* ── advance from explanation */
  const fromExplanation = () => {
    if (examples.length > 0) {
      go({ kind: "example", idx: 0, revealed: false }, exampleLeadRef.current, examples[0].problem);
    } else if (problems.length > 0) {
      go({ kind: "practice", idx: 0, attempts: 0, feedback: "none" }, pick(d.practiceLead), problems[0].question);
    } else {
      go({ kind: "quiz-intro" }, pick(d.quizIntro));
    }
  };

  /* ── reveal example solution — speak the solution and hint aloud */
  const revealExample = (idx: number) => {
    const ex = examples[idx];
    const revealMsg = pick(d.exampleReveal);
    const spokenSuffix = [ex.solution, ex.hint].filter(Boolean).join('. ');
    setPhase({ kind: "example", idx, revealed: true });
    say(revealMsg, spokenSuffix || undefined);
  };

  /* ── advance from example */
  const fromExample = (idx: number) => {
    if (idx + 1 < examples.length) {
      go({ kind: "example", idx: idx + 1, revealed: false }, exampleLeadRef.current, examples[idx + 1].problem);
    } else if (problems.length > 0) {
      go({ kind: "practice", idx: 0, attempts: 0, feedback: "none" }, pick(d.practiceLead), problems[0].question);
    } else {
      go({ kind: "quiz-intro" }, pick(d.quizIntro));
    }
  };

  /* ── check practice answer */
  const checkPractice = (idx: number, attempts: number) => {
    const correct = problems[idx].answer.trim().toLowerCase();
    const given = answerInput.trim().toLowerCase();
    if (given === correct) {
      trackAnswer(true);
      practiceCorrectRef.current += 1;
      consecutiveCorrectRef.current += 1;
      curiositySolvedRef.current += 1; // count toward curiosity loop threshold
      setPhase({ kind: "practice", idx, attempts, feedback: "correct" });
      say(selectConsistentPraise(d.practiceCorrect, d.praiseRecovery), undefined, "praise");
    } else {
      trackAnswer(false);
      consecutiveCorrectRef.current = 0;
      lessonMistakesRef.current += 1;
      const nextAttempts = attempts + 1;
      /* First wrong in primary grades (1-4): go to hinting phase — speak hint text aloud */
      if (isPrimary && attempts === 0) {
        const hintEx = examples.find(e => e.hint) ?? examples[0];
        const hintSpoken = hintEx?.hint ?? '';
        go({ kind: "hinting", practiceIdx: idx, attempts: nextAttempts }, pick(d.hinting), hintSpoken || undefined);
      } else {
        setPhase({ kind: "practice", idx, attempts: nextAttempts, feedback: "wrong" });
        const wrongMsg = topicContext === "weak" ? ctxD.practiceSupport : pick(d.practiceWrong2);
        say(wrongMsg, undefined, "retry");
      }
    }
  };

  /* ── from hinting → back to retry — speak the problem question again */
  const fromHinting = (practiceIdx: number, attempts: number) => {
    go({ kind: "practice", idx: practiceIdx, attempts, feedback: "none" }, pick(d.retryAfterHint), problems[practiceIdx].question);
  };

  /* ── advance from practice */
  const fromPractice = (idx: number, _feedback: "correct" | "wrong") => {
    const nextIdx = idx + 1;
    if (nextIdx < problems.length) {
      /* If 2+ consecutive correct → brief celebrate phase before next problem */
      if (consecutiveCorrectRef.current >= 2) {
        go({ kind: "celebrate", nextPracticeIdx: nextIdx }, pick(d.celebrate));
      } else {
        /* Curiosity loop: every 4-6 correct answers AYA shares a real-world fact */
        const curiosityMoment = maybeTriggerCuriosity();
        if (curiosityMoment) {
          go(
            { kind: "practice", idx: nextIdx, attempts: 0, feedback: "none" },
            curiosityMoment,
            `${curiosityMoment} ${problems[nextIdx].question}`,
          );
        } else {
          go({ kind: "practice", idx: nextIdx, attempts: 0, feedback: "none" }, pick(d.practiceLead), problems[nextIdx].question);
        }
      }
    } else {
      onComplete(practiceCorrectRef.current, quizCorrectRef.current, problems.length, questions.length);
      go({ kind: "quiz-intro" }, pick(d.quizIntro));
    }
  };

  /* ── from celebrate → next practice problem — speak problem after celebration */
  const fromCelebrate = (nextIdx: number) => {
    consecutiveCorrectRef.current = 0;
    go({ kind: "practice", idx: nextIdx, attempts: 0, feedback: "none" }, pick(d.celebrateLead), problems[nextIdx].question);
  };

  /* ── select quiz option */
  const selectQuiz = (idx: number, optIdx: number) => {
    const correct = optIdx === questions[idx].correctIndex;
    trackAnswer(correct);
    if (correct) {
      quizCorrectRef.current += 1;
      curiositySolvedRef.current += 1; // count toward curiosity loop threshold
    } else {
      lessonMistakesRef.current += 1;
    }
    setPhase({ kind: "quiz", idx, selected: optIdx, correct });
    /* Weak topics get a supportive wrong-answer message; others get generic */
    const wrongMsg = (topicContext === "weak" && ctxD.quizSupport)
      ? ctxD.quizSupport
      : pick(d.quizWrong);
    const praiseMsg = selectConsistentPraise(d.quizCorrect, d.praiseRecovery);
    say(correct ? praiseMsg : wrongMsg, undefined, correct ? "praise" : "retry");
  };

  /* ── start quiz from intro — speak first question after intro */
  const startQuiz = useCallback(() => {
    go({ kind: "quiz", idx: 0, selected: null, correct: null }, pick(d.quizIntro), questions[0]?.question);
  }, [go, d, questions]);

  /* ── advance from quiz — speak next question after feedback */
  const fromQuiz = (idx: number) => {
    if (idx + 1 < questions.length) {
      /* Curiosity loop fires between quiz questions too (only if threshold reached) */
      const curiosityMoment = maybeTriggerCuriosity();
      const nextQ = questions[idx + 1].question;
      if (curiosityMoment) {
        go(
          { kind: "quiz", idx: idx + 1, selected: null, correct: null },
          curiosityMoment,
          `${curiosityMoment} ${nextQ}`,
        );
      } else {
        go({ kind: "quiz", idx: idx + 1, selected: null, correct: null }, pick(d.quizIntro), nextQ);
      }
    } else {
      const pc = practiceCorrectRef.current;
      const qc = quizCorrectRef.current;
      const total = { practice: problems.length, quiz: questions.length };
      const pct = total.quiz > 0 ? qc / total.quiz : (total.practice > 0 ? pc / total.practice : 1);
      const topicLabel = topic.label[lang] ?? topic.label.en;
      const completionMsg = pct >= 0.9
        ? d.completionHigh(topicLabel)
        : pct >= 0.6
        ? d.completionMid(topicLabel)
        : d.completionLow(topicLabel);
      go({ kind: "completion", practiceCorrect: pc, quizCorrect: qc, total }, completionMsg);
      onComplete(pc, qc, problems.length, questions.length);
    }
  };

  /* ── infinite practice: load exercises from pool */
  const startInfinitePractice = async () => {
    setInfLoading(true);
    try {
      const params = new URLSearchParams({
        childId: String(childId),
        subjectId: subject.id,
        topicId: topic.id,
        grade: String(grade),
        lang,
        count: "10",
      });
      const res = await fetch(`/api/lessons/exercises?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("aya_token") ?? ""}` },
      });
      if (!res.ok) throw new Error("fetch failed");
      const body = await res.json() as { exercises: PoolExercise[] };
      const exercises = body.exercises ?? [];
      if (exercises.length === 0) throw new Error("empty");
      setPhase({ kind: "infinite-practice", exercises, idx: 0, correct: 0, selected: null, inputVal: "", feedback: "none", revealed: false });
      say(l.infPracticeTitle, exercises[0].question);
    } catch {
      say(l.infLoading);
    } finally {
      setInfLoading(false);
    }
  };

  /* ── infinite practice: record result + advance */
  const recordInfResult = async (ex: PoolExercise, isCorrect: boolean, userAnswer: string, p: Extract<Phase, { kind: "infinite-practice" }>) => {
    try {
      await fetch("/api/lessons/exercises/result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("aya_token") ?? ""}`,
        },
        body: JSON.stringify({ exerciseId: ex.id, correct: isCorrect, userAnswer }),
      });
    } catch { /* fire-and-forget */ }
    trackAnswer(isCorrect);
    const newCorrect = p.correct + (isCorrect ? 1 : 0);
    setPhase({ ...p, correct: newCorrect, feedback: isCorrect ? "correct" : "wrong", revealed: false });
    const infPraise = isCorrect
      ? selectConsistentPraise(d.practiceCorrect, d.praiseRecovery)
      : pick(d.practiceWrong);
    say(infPraise, undefined, isCorrect ? "praise" : "retry");
  };

  /* ── infinite practice: advance to next exercise (with auto-refill) */
  const nextInfExercise = async (p: Extract<Phase, { kind: "infinite-practice" }>) => {
    const nextIdx = p.idx + 1;
    if (nextIdx >= p.exercises.length) {
      /* auto-refill */
      setInfLoading(true);
      try {
        const params = new URLSearchParams({
          childId: String(childId),
          subjectId: subject.id,
          topicId: topic.id,
          grade: String(grade),
          lang,
          count: "10",
        });
        const res = await fetch(`/api/lessons/exercises?${params.toString()}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("aya_token") ?? ""}` },
        });
        if (!res.ok) throw new Error("fetch failed");
        const body = await res.json() as { exercises: PoolExercise[] };
        const fresh = body.exercises ?? [];
        if (fresh.length > 0) {
          setPhase({ ...p, exercises: fresh, idx: 0, selected: null, inputVal: "", feedback: "none", revealed: false });
          say(l.infPracticeTitle, fresh[0].question);
        } else {
          setPhase({ ...p, idx: nextIdx, selected: null, inputVal: "", feedback: "none", revealed: false });
          say(l.infPracticeTitle);
        }
      } catch {
        setPhase({ ...p, idx: 0, selected: null, inputVal: "", feedback: "none", revealed: false });
        say(l.infPracticeTitle);
      } finally {
        setInfLoading(false);
      }
    } else {
      const nextEx = p.exercises[nextIdx];
      setPhase({ ...p, idx: nextIdx, selected: null, inputVal: "", feedback: "none", revealed: false });
      say(l.infPracticeTitle, nextEx?.question);
    }
  };

  const emotion = phaseEmotion(phase);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 px-2 sm:px-4">

      {/* Progress dots */}
      {totalSteps > 2 && (
        <div className="flex justify-center">
          <ProgressDots current={currentStep} total={Math.min(totalSteps, 12)} colorClass={subject.colorClass} />
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={phase.kind + (phase.kind === "example" ? phase.idx : phase.kind === "practice" ? phase.idx : phase.kind === "quiz" ? phase.idx : phase.kind === "hinting" ? phase.practiceIdx : phase.kind === "celebrate" ? phase.nextPracticeIdx : "")}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* AYA speech + replay */}
          <div>
            <AyaSpeech emotion={emotion} text={dialogue} speaking={isVoicePlaying} />
            {voiceEnabled && !isVoicePlaying && (
              <div className="flex justify-center -mt-1 mb-1">
                <button
                  onClick={() => speak(spokenText, voiceEmotion)}
                  className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-1 px-2 py-0.5 rounded-full hover:bg-muted/40 transition-colors"
                  title={lang === "bg" ? "Изслушай пак" : lang === "de" ? "Nochmal hören" : lang === "fr" ? "Réécouter" : lang === "es" ? "Escuchar de nuevo" : "Replay"}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{lang === "bg" ? "Изслушай" : lang === "de" ? "Wiederholen" : lang === "fr" ? "Réécouter" : lang === "es" ? "Repetir" : "Replay"}</span>
                </button>
              </div>
            )}
          </div>

          {/* ── Greeting ── */}
          {phase.kind === "greeting" && (
            <ActionBtn onClick={fromGreeting} subject={subject} testId="btn-ready">
              {l.ready} <ChevronRight className="w-5 h-5" />
            </ActionBtn>
          )}

          {/* ── Explanation ── */}
          {phase.kind === "explanation" && (
            <div className="space-y-5">
              <div className={cn("rounded-3xl border-2 p-6", subject.bgClass, subject.borderClass)}>
                <h3 className={cn("text-lg font-display font-bold mb-3", subject.colorClass)}>{data.lesson.title}</h3>
                <p className="text-sm text-foreground leading-relaxed">{data.lesson.explanation}</p>
              </div>
              {data.lesson.tip && (
                <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-900 flex gap-3">
                  <span className="text-lg flex-shrink-0">{ctxD.hintPrefix || "💡"}</span>
                  <span className="leading-relaxed">{data.lesson.tip}</span>
                </div>
              )}
              {/* ── Curiosity spark — non-blocking fact/question shown mid-lesson ── */}
              {/* Only for normal/strong topics; struggling children need focus */}
              {topicContext !== "weak" && explanationSpark && (
                <div className="bg-violet-50 border border-violet-200 rounded-2xl px-5 py-3.5 flex gap-3 items-start">
                  <span className="text-base flex-shrink-0 mt-0.5">{explanationSpark.emoji}</span>
                  <div>
                    <span className="text-xs font-semibold text-violet-500 uppercase tracking-wide block mb-0.5">
                      {explanationSpark.title}
                    </span>
                    <p className="text-sm text-violet-900 leading-relaxed">{explanationSpark.content}</p>
                  </div>
                </div>
              )}
              <ActionBtn onClick={fromExplanation} subject={subject} testId="btn-understood">
                {l.understood} <ChevronRight className="w-5 h-5" />
              </ActionBtn>
              {topicContext === "strong" && ctxD.skipExplanationBtn && (
                <ActionBtn onClick={fromExplanation} subject={subject} variant="ghost">
                  <Sparkles className="w-4 h-4" /> {ctxD.skipExplanationBtn}
                </ActionBtn>
              )}
            </div>
          )}

          {/* ── Example ── */}
          {phase.kind === "example" && (() => {
            const ex = examples[phase.idx];
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", subject.bgClass, subject.colorClass)}>
                    {phase.idx + 1}
                  </span>
                  <span className="text-sm">{lang === "bg" ? `Пример ${phase.idx + 1} от ${examples.length}` : `Example ${phase.idx + 1} of ${examples.length}`}</span>
                </div>
                <div className={cn("rounded-2xl border-2 p-6", subject.bgClass, subject.borderClass)}>
                  <p className="font-mono text-xl font-bold text-center">{ex.problem}</p>
                  <AnimatePresence>
                    {phase.revealed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="mt-4 pt-4 border-t border-current/20"
                      >
                        <p className={cn("font-mono text-lg font-bold text-center", subject.colorClass)}>{ex.solution}</p>
                        {isPrimary && ex.hint && (
                          <p className="text-sm text-muted-foreground text-center mt-2 italic">{ex.hint}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {!phase.revealed ? (
                  <ActionBtn onClick={() => revealExample(phase.idx)} subject={subject} testId="btn-see-answer">
                    <Eye className="w-4 h-4" /> {l.seeAnswer}
                  </ActionBtn>
                ) : (
                  <ActionBtn onClick={() => fromExample(phase.idx)} subject={subject} testId="btn-next-example">
                    {l.nextExample} <ChevronRight className="w-4 h-4" />
                  </ActionBtn>
                )}
              </div>
            );
          })()}

          {/* ── Practice ── */}
          {phase.kind === "practice" && (() => {
            const prob = problems[phase.idx];
            const feedback = phase.feedback;
            const attempts = phase.attempts;
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-3 text-xs font-bold text-muted-foreground uppercase tracking-wider px-1">
                  <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold", subject.bgClass, subject.colorClass)}>
                    {phase.idx + 1}
                  </span>
                  <span className="text-sm">{lang === "bg" ? `Задача ${phase.idx + 1} от ${problems.length}` : `Problem ${phase.idx + 1} of ${problems.length}`}</span>
                </div>

                <div className={cn(
                  "rounded-2xl border-2 p-6 transition-colors",
                  feedback === "correct" ? "border-green-300 bg-green-50"
                  : feedback === "wrong" ? "border-orange-200 bg-orange-50"
                  : cn(subject.bgClass, subject.borderClass),
                )}>
                  <p className="font-mono text-lg font-bold text-center">{prob.question}</p>
                </div>

                {feedback === "none" && (
                  <div className="flex gap-3">
                    <input
                      key={phase.idx}
                      autoFocus
                      type="text"
                      data-testid="practice-input"
                      value={answerInput}
                      onChange={e => setAnswerInput(e.target.value)}
                      placeholder={l.placeholder}
                      onKeyDown={e => e.key === "Enter" && answerInput.trim() && checkPractice(phase.idx, attempts)}
                      className="flex-1 bg-white border-2 border-border/40 rounded-xl px-5 py-4 text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
                    />
                    <button
                      onClick={() => checkPractice(phase.idx, attempts)}
                      disabled={!answerInput.trim()}
                      data-testid="btn-check"
                      className={cn("px-5 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40", subject.bgClass, subject.colorClass, "border-2", subject.borderClass, "hover:opacity-90")}
                    >
                      {l.check}
                    </button>
                  </div>
                )}

                {feedback === "correct" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{lang === "bg" ? "Правилно!" : "Correct!"}</span>
                    </div>
                    <ActionBtn onClick={() => fromPractice(phase.idx, feedback)} subject={subject} testId="btn-next-problem">
                      {phase.idx + 1 < problems.length ? l.nextProblem : (lang === "bg" ? "Продължи →" : "Continue →")}
                      <ChevronRight className="w-4 h-4" />
                    </ActionBtn>
                  </div>
                )}

                {feedback === "wrong" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-orange-600 font-bold text-sm">
                      <XCircle className="w-4 h-4" />
                      <span>{lang === "bg" ? "Не съвсем — опитай пак!" : "Not quite — try again!"}</span>
                    </div>
                    {/* Weak topics: reveal correct answer after 1st wrong; others after 2nd */}
                    {((topicContext === "weak" && attempts >= 1) || attempts >= 2) && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-800">
                        <span className="font-bold">{l.showAnswer}: </span>{prob.answer}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <ActionBtn
                        onClick={() => { go({ kind: "practice", idx: phase.idx, attempts: phase.attempts, feedback: "none" }, pick(d.practiceWrong), prob.question); }}
                        subject={subject}
                        variant={(topicContext === "weak" && attempts >= 1) || attempts >= 2 ? "ghost" : "primary"}
                        testId="btn-retry"
                      >
                        <RotateCcw className="w-4 h-4" /> {l.retry}
                      </ActionBtn>
                      {attempts >= 1 && (
                        <ActionBtn onClick={() => fromPractice(phase.idx, feedback)} subject={subject} variant="ghost" testId="btn-skip-problem">
                          {l.nextProblem}
                        </ActionBtn>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Hinting ── */}
          {phase.kind === "hinting" && (() => {
            const prob = problems[phase.practiceIdx];
            /* Find the most relevant example hint to show */
            const hintEx = examples.find(e => e.hint) ?? examples[0];
            /* Deep-struggle: weak topic + 3+ cumulative lesson mistakes → show re-explain */
            const showReExplain = topicContext === "weak"
              && lessonMistakesRef.current >= 3
              && (data.lesson.tip || data.lesson.explanation);
            return (
              <div className="space-y-4">
                {/* Deep-struggle re-explanation banner (weak topics, 3+ mistakes) */}
                {showReExplain && ctxD.reExplainMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-violet-50 border-2 border-violet-200 rounded-2xl p-4 space-y-2"
                  >
                    <p className="text-sm font-bold text-violet-800">{ctxD.reExplainMsg}</p>
                    {data.lesson.tip && (
                      <p className="text-sm text-violet-700 leading-relaxed">{data.lesson.tip}</p>
                    )}
                  </motion.div>
                )}

                {/* Mini re-teach: show the problem again */}
                <div className={cn("rounded-2xl border-2 p-4 text-center", subject.bgClass, subject.borderClass)}>
                  <p className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wider">
                    {lang === "bg" ? "Задачата" : lang === "de" ? "Die Aufgabe" : lang === "fr" ? "Le problème" : lang === "es" ? "El problema" : "The problem"}
                  </p>
                  <p className="font-mono text-xl font-bold">{prob.question}</p>
                </div>

                {/* Hint card from lesson examples */}
                {hintEx && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <span>{ctxD.hintPrefix || "💡"}</span>
                    </div>
                    {hintEx.hint && (
                      <p className="text-sm text-amber-900 leading-relaxed">{hintEx.hint}</p>
                    )}
                    {hintEx.solution && (
                      <p className="text-xs text-amber-700 font-mono">
                        {lang === "bg" ? "Пример:" : "Example:"} {hintEx.problem} = {hintEx.solution}
                      </p>
                    )}
                  </motion.div>
                )}

                <ActionBtn onClick={() => fromHinting(phase.practiceIdx, phase.attempts)} subject={subject} testId="btn-retry-after-hint">
                  <RotateCcw className="w-4 h-4" />
                  {lang === "bg" ? "Разбрах! Опитвам пак →" : lang === "de" ? "Verstanden! Nochmal →" : lang === "fr" ? "Compris! Réessayer →" : lang === "es" ? "¡Entendido! Reintentar →" : "Got it! Try again →"}
                </ActionBtn>
              </div>
            );
          })()}

          {/* ── Celebrate ── */}
          {phase.kind === "celebrate" && (
            <div className="space-y-4">
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18 }}
                className={cn("rounded-3xl border-2 p-8 text-center", subject.bgClass, subject.borderClass)}
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -8, 8, 0], scale: [1, 1.15, 1.15, 1.1, 1.1, 1] }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                  className="text-5xl mb-3"
                >
                  🌟
                </motion.div>
                <p className={cn("font-display font-bold text-lg", subject.colorClass)}>
                  {lang === "bg" ? "Страхотно!" : lang === "de" ? "Großartig!" : lang === "fr" ? "Fantastique!" : lang === "es" ? "¡Fantástico!" : "Fantastic!"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang === "bg" ? `${consecutiveCorrectRef.current} верни подред!` : lang === "de" ? `${consecutiveCorrectRef.current} richtig hintereinander!` : lang === "fr" ? `${consecutiveCorrectRef.current} corrects d'affilée!` : lang === "es" ? `¡${consecutiveCorrectRef.current} correctas seguidas!` : `${consecutiveCorrectRef.current} correct in a row!`}
                </p>
              </motion.div>
              <ActionBtn onClick={() => fromCelebrate(phase.nextPracticeIdx)} subject={subject} testId="btn-celebrate-continue">
                <Sparkles className="w-4 h-4" />
                {lang === "bg" ? "Продължаваме! →" : lang === "de" ? "Weiter! →" : lang === "fr" ? "Continuer! →" : lang === "es" ? "¡Continuar! →" : "Keep going! →"}
              </ActionBtn>
            </div>
          )}

          {/* ── Quiz Intro ── */}
          {phase.kind === "quiz-intro" && (
            <div className="space-y-3">
              <div className={cn("rounded-3xl border-2 p-5 text-center", subject.bgClass, subject.borderClass)}>
                <p className="text-4xl mb-2">📝</p>
                <p className={cn("font-bold", subject.colorClass)}>
                  {lang === "bg" ? `${questions.length} въпроса` : `${questions.length} questions`}
                </p>
              </div>
              <ActionBtn onClick={startQuiz} subject={subject} testId="btn-start-quiz">
                {l.startQuiz} <Sparkles className="w-4 h-4" />
              </ActionBtn>
            </div>
          )}

          {/* ── Quiz Question ── */}
          {phase.kind === "quiz" && (() => {
            const q = questions[phase.idx];
            const revealed = phase.selected !== null;
            return (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1">
                  <span>{l.question(phase.idx + 1, questions.length)}</span>
                  <div className="flex gap-1">
                    {questions.map((_, i) => (
                      <div key={i} className={cn("w-2 h-2 rounded-full",
                        i < phase.idx ? "bg-green-400"
                        : i === phase.idx ? cn(subject.colorClass.replace("text-", "bg-"))
                        : "bg-muted"
                      )} />
                    ))}
                  </div>
                </div>
                <div className={cn("rounded-2xl border-2 p-6", subject.bgClass, subject.borderClass)}>
                  <p className="font-mono text-lg font-bold text-center leading-relaxed">{q.question}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {q.options.map((opt, i) => {
                    const isSelected = phase.selected === i;
                    const isCorrect = i === q.correctIndex;
                    return (
                      <button
                        key={i}
                        data-testid={`quiz-option-${i}`}
                        onClick={() => !revealed && selectQuiz(phase.idx, i)}
                        disabled={revealed}
                        className={cn(
                          "p-5 rounded-2xl border-2 font-bold text-sm transition-all text-center leading-relaxed",
                          !revealed && "hover:scale-[1.02] cursor-pointer border-border/40 bg-card",
                          revealed && isCorrect && "border-green-400 bg-green-50 text-green-700",
                          revealed && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-600",
                          revealed && !isSelected && !isCorrect && "border-border/30 bg-muted/30 text-muted-foreground opacity-50",
                        )}
                      >
                        {revealed && isCorrect && <span className="mr-1">✓</span>}
                        {revealed && isSelected && !isCorrect && <span className="mr-1">✗</span>}
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {revealed && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                    <ActionBtn
                      onClick={() => fromQuiz(phase.idx)}
                      subject={subject}
                      testId={phase.idx + 1 < questions.length ? "btn-next-question" : "btn-finish"}
                    >
                      {phase.idx + 1 < questions.length ? l.nextQuestion : (lang === "bg" ? "Финиш! 🏁" : "Finish! 🏁")}
                      <ChevronRight className="w-4 h-4" />
                    </ActionBtn>
                  </motion.div>
                )}
              </div>
            );
          })()}

          {/* ── Completion ── */}
          {phase.kind === "completion" && (() => {
            const { practiceCorrect, quizCorrect, total } = phase;
            const pct = total.quiz > 0
              ? Math.round((quizCorrect / total.quiz) * 100)
              : total.practice > 0
              ? Math.round((practiceCorrect / total.practice) * 100)
              : 100;
            return (
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className={cn("rounded-3xl border-2 p-6 text-center", subject.bgClass, subject.borderClass)}
                >
                  <div className="text-5xl mb-3">{pct >= 90 ? "🏆" : pct >= 60 ? "⭐" : "💪"}</div>
                  {total.quiz > 0 && (
                    <p className={cn("text-lg font-display font-bold mb-1", subject.colorClass)}>
                      {l.score(quizCorrect, total.quiz)}
                    </p>
                  )}
                  {total.practice > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {lang === "bg" ? `Упражнения: ${practiceCorrect} от ${total.practice}` : `Practice: ${practiceCorrect} of ${total.practice}`}
                    </p>
                  )}
                  <div className="mt-3">
                    <div className="w-full bg-white/50 rounded-full h-2.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className={cn("h-full rounded-full", subject.colorClass.replace("text-", "bg-"))}
                      />
                    </div>
                    <p className={cn("text-xs font-bold mt-1.5", subject.colorClass)}>{pct}%</p>
                  </div>
                </motion.div>
                <CuriosityCardDisplay card={curiosityCard} lang={lang} />
                <ActionBtn
                  onClick={startInfinitePractice}
                  subject={subject}
                  testId="btn-keep-practicing"
                  disabled={infLoading}
                >
                  {infLoading ? l.infLoading : l.keepPracticing}
                </ActionBtn>
                <ActionBtn onClick={onBack} subject={subject} testId="btn-continue-lesson">
                  <Star className="w-4 h-4" /> {d.continueLesson}
                </ActionBtn>
                <ActionBtn onClick={onAskAya} subject={subject} variant="ghost" testId="btn-ask-aya">
                  <Sparkles className="w-4 h-4" /> {d.askAya}
                </ActionBtn>
              </div>
            );
          })()}

          {/* ── Infinite Practice ── */}
          {phase.kind === "infinite-practice" && (() => {
            const p = phase;
            const ex = p.exercises[p.idx];
            if (!ex) return null;
            const isMultiple = ex.exerciseType === "multiple-choice" && ex.options && ex.options.length > 0;
            const answered = p.feedback !== "none";
            return (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn("text-sm font-bold", subject.colorClass)}>
                    {l.infPracticeTitle}
                  </span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {l.infScore(p.correct)}
                  </span>
                </div>

                <motion.div
                  key={`inf-ex-${p.idx}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("rounded-2xl border-2 p-5", subject.bgClass, subject.borderClass)}
                >
                  <p className="font-semibold text-foreground text-base leading-relaxed mb-4">{ex.question}</p>

                  {isMultiple ? (
                    <div className="grid grid-cols-2 gap-3">
                      {ex.options!.map((opt, i) => {
                        const isSelected = p.selected === i;
                        const isCorrectOpt = opt === ex.correctAnswer;
                        return (
                          <button
                            key={i}
                            onClick={() => {
                              if (answered) return;
                              const isCorrect = opt === ex.correctAnswer;
                              setPhase({ ...p, selected: i });
                              void recordInfResult(ex, isCorrect, opt, { ...p, selected: i });
                            }}
                            disabled={answered}
                            className={cn(
                              "p-4 rounded-xl border-2 font-semibold text-sm text-center transition-all leading-relaxed",
                              !answered && "hover:scale-[1.02] cursor-pointer border-border/40 bg-card",
                              answered && isCorrectOpt && "border-green-400 bg-green-50 text-green-700",
                              answered && isSelected && !isCorrectOpt && "border-red-400 bg-red-50 text-red-600",
                              answered && !isSelected && !isCorrectOpt && "border-border/30 bg-muted/30 text-muted-foreground opacity-50",
                            )}
                          >
                            {answered && isCorrectOpt && <span className="mr-1">✓</span>}
                            {answered && isSelected && !isCorrectOpt && <span className="mr-1">✗</span>}
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={p.inputVal}
                        onChange={(e) => !answered && setPhase({ ...p, inputVal: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && p.inputVal.trim() && !answered) {
                            const val = p.inputVal.trim();
                            const isCorrect = val.toLowerCase() === ex.correctAnswer.toLowerCase();
                            void recordInfResult(ex, isCorrect, val, p);
                          }
                        }}
                        disabled={answered}
                        placeholder={l.placeholder}
                        className="w-full px-4 py-3 rounded-xl border-2 border-border/40 bg-card text-foreground placeholder:text-muted-foreground font-semibold focus:outline-none focus:border-current transition-colors disabled:opacity-60"
                      />
                      {!answered && (
                        <ActionBtn
                          onClick={() => {
                            const val = p.inputVal.trim();
                            if (!val) return;
                            const isCorrect = val.toLowerCase() === ex.correctAnswer.toLowerCase();
                            void recordInfResult(ex, isCorrect, val, p);
                          }}
                          subject={subject}
                          testId="btn-inf-check"
                          disabled={!p.inputVal.trim()}
                        >
                          {l.check}
                        </ActionBtn>
                      )}
                    </div>
                  )}
                </motion.div>

                {answered && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                    <p className={cn("font-bold text-center text-base", p.feedback === "correct" ? "text-green-600" : "text-red-500")}>
                      {p.feedback === "correct" ? l.infCorrect : l.infWrong}
                    </p>
                    {p.feedback === "wrong" && !p.revealed && (
                      <button
                        onClick={() => setPhase({ ...p, revealed: true })}
                        className="text-xs text-muted-foreground underline underline-offset-2 w-full text-center"
                      >
                        {l.infReveal}
                      </button>
                    )}
                    {p.revealed && (
                      <p className="text-sm text-center text-foreground/70">
                        ✓ {ex.correctAnswer}
                      </p>
                    )}
                    {ex.explanation && p.feedback === "wrong" && (
                      <p className="text-xs text-muted-foreground text-center italic">{ex.explanation}</p>
                    )}
                    <ActionBtn
                      onClick={() => void nextInfExercise(p)}
                      subject={subject}
                      testId="btn-inf-next"
                      disabled={infLoading}
                    >
                      {infLoading ? l.infLoading : l.infNext}
                    </ActionBtn>
                    <ActionBtn onClick={onBack} subject={subject} variant="ghost" testId="btn-inf-back">
                      {l.backToLessons}
                    </ActionBtn>
                  </motion.div>
                )}
              </div>
            );
          })()}

        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Public LessonViewer ───────────────────────────────────────── */

export type LessonMode = "lesson" | "practice" | "quiz" | "story";

export interface LessonViewerProps {
  subject: Subject;
  topic: Topic;
  initialMode: LessonMode;
  grade: number;
  lang: LangCode;
  childId: number;
  onBack: () => void;
  onAskAya: () => void;
  /** When launched from Daily Plan, supply these to auto-mark the task complete */
  dailyPlanId?: number;
  dailyPlanTaskId?: string;
}

export function LessonViewer({ subject, topic, initialMode, grade, lang, childId, onBack, onAskAya, dailyPlanId, dailyPlanTaskId }: LessonViewerProps) {
  const [reward, setReward] = useState<XpReward | null>(null);
  const l = L[lang];
  const queryClient = useQueryClient();

  /* ── Voice ─────────────────────────────────────────────────────── */
  const {
    speak,
    stop: stopVoice,
    isPlaying: isVoicePlaying,
    voiceEnabled,
    toggleVoice,
  } = useAyaLessonVoice(lang, childId);
  const completeFiredRef = useRef(false);
  const lessonFiredRef = useRef(false);

  const { data, isLoading, isError } = useQuery<LessonContent>({
    queryKey: ["lesson", subject.id, topic.id, grade, lang],
    queryFn: async () => {
      const res = await fetch(`/api/lessons/content?subjectId=${subject.id}&topicId=${topic.id}&grade=${grade}&lang=${lang}`);
      if (!res.ok) throw new Error("Failed to load lesson");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: adaptiveProfile } = useQuery<AdaptiveProfile>({
    queryKey: ["adaptive-profile", childId, subject.id, topic.id],
    queryFn: async () => {
      const res = await fetch(
        `/api/learning/adaptive-profile?childId=${childId}&subjectId=${subject.id}&topicId=${topic.id}`
      );
      if (!res.ok) throw new Error("Failed to load adaptive profile");
      return res.json();
    },
    staleTime: 2 * 60 * 1000,
    enabled: childId > 0,
  });

  const topicContext: TopicContext = adaptiveProfile?.currentTopicStats?.context ?? "normal";

  const completeMutation = useMutation({
    mutationFn: async ({
      action, correctCount, totalCount,
    }: { action: "lesson" | "practice" | "quiz"; correctCount: number; totalCount?: number }) => {
      const res = await fetch("/api/learning/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childId, subjectId: subject.id, topicId: topic.id, action, correctCount, totalCount,
          ...(dailyPlanId && dailyPlanTaskId ? { dailyPlanId, dailyPlanTaskId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to record progress");
      return res.json() as Promise<XpReward & { newBadges: Array<{ icon: string; title: string }> }>;
    },
    onSuccess: (result) => {
      if (result.xpGained > 0 || result.starsGained > 0) setReward(result);
      queryClient.invalidateQueries({ queryKey: getListChildrenQueryKey() });
      queryClient.invalidateQueries({ queryKey: ["learning-progress", childId] });
      queryClient.invalidateQueries({ queryKey: ["adaptive-profile", childId, subject.id, topic.id] });
      queryClient.invalidateQueries({ queryKey: ["daily-plan", childId] });
      /* Auto-mark daily plan task complete if launched from plan */
      if (dailyPlanId && dailyPlanTaskId) {
        updateDailyPlanTask(dailyPlanId, dailyPlanTaskId, { status: "completed" }).catch(() => {});
      }
    },
  });

  const record = useCallback((action: "lesson" | "practice" | "quiz", correctCount: number, totalCount?: number) => {
    if (childId > 0) completeMutation.mutate({ action, correctCount, totalCount });
  }, [childId]);

  const handleComplete = useCallback((
    practiceCorrect: number, quizCorrect: number, practiceTotal: number, quizTotal: number,
  ) => {
    if (!completeFiredRef.current) {
      completeFiredRef.current = true;
      if (initialMode === "story") {
        record("practice", practiceCorrect, practiceTotal);
      } else {
        record("quiz", quizCorrect, quizTotal);
        record("practice", practiceCorrect, practiceTotal);
      }
    }
  }, [record, initialMode]);

  const handleRecordLesson = useCallback(() => {
    if (!lessonFiredRef.current) {
      lessonFiredRef.current = true;
      record("lesson", 0);
    }
  }, [record]);

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      <XpToast reward={reward} lang={lang} onDismiss={() => setReward(null)} />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => { stopVoice(); onBack(); }}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" /> {l.back}
        </button>
        <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
          <span className="text-lg">{subject.emoji}</span>
          <span className={cn("font-bold text-sm", subject.colorClass)}>{topic.label[lang] ?? topic.label.en}</span>
        </div>
        {/* Voice toggle */}
        <button
          onClick={toggleVoice}
          title={voiceEnabled
            ? (lang === "bg" ? "Изключи гласа" : "Mute AYA voice")
            : (lang === "bg" ? "Включи гласа" : "Unmute AYA voice")}
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-xl border transition-colors",
            voiceEnabled
              ? "bg-violet-100 border-violet-200 text-violet-600 hover:bg-violet-200"
              : "bg-white/60 border-white/50 text-muted-foreground hover:bg-muted/40",
          )}
        >
          {voiceEnabled
            ? <Volume2 className="w-4 h-4" />
            : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>{l.loading}</span>
        </div>
      ) : isError || !data ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-4xl mb-3">😕</p>
          <p>{lang === "bg" ? "Грешка при зареждане. Опитай пак." : "Error loading lesson. Please try again."}</p>
          <button onClick={onBack} className="mt-4 text-sm underline hover:text-foreground">{l.back}</button>
        </div>
      ) : initialMode === "story" ? (
        <StoryLessonEngine
          key={`story-${subject.id}-${topic.id}`}
          data={data}
          topic={topic}
          subject={subject}
          lang={lang}
          grade={grade}
          onComplete={handleComplete}
          onBack={onBack}
        />
      ) : (
        <InteractiveLessonEngine
          key={`${subject.id}-${topic.id}`}
          data={data}
          topic={topic}
          subject={subject}
          lang={lang}
          grade={grade}
          childId={childId}
          topicContext={topicContext}
          speak={speak}
          isVoicePlaying={isVoicePlaying}
          voiceEnabled={voiceEnabled}
          onComplete={handleComplete}
          onRecordLesson={handleRecordLesson}
          onBack={() => { stopVoice(); onBack(); }}
          onAskAya={() => { stopVoice(); onAskAya(); }}
        />
      )}
    </motion.div>
  );
}
