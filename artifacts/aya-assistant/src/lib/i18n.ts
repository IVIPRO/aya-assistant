export type LangCode = "en" | "bg" | "es" | "de" | "fr";

export function resolveLang(language?: string | null): LangCode {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
  if (l.includes("german") || l.includes("deutsch") || l === "de") return "de";
  if (l.includes("french") || l.includes("français") || l === "fr") return "fr";
  return "en";
}

export interface UITranslations {
  nav: {
    dashboard: string;
    junior: string;
    student: string;
    family: string;
    psychology: string;
    parent: string;
    signOut: string;
  };
  dashboard: {
    greeting: (name: string) => string;
    subtitle: string;
    setupFamily: string;
    setupFamilyDesc: string;
    goToSettings: string;
    quickSwitch: string;
    childLevel: (lv: number, xp: number, stars: number) => string;
    gradeLevel: (grade: number, lv: number) => string;
    reviewChip: string;
  };
  modules: {
    juniorTitle: string;
    juniorDesc: string;
    studentTitle: string;
    studentDesc: string;
    familyTitle: string;
    familyDesc: string;
    psychologyTitle: string;
    psychologyDesc: string;
  };
  buttons: {
    saveChanges: string;
    addChild: string;
    back: string;
  };
  chat: {
    juniorPlaceholder: string;
    placeholder: string;
  };
  parent: {
    title: string;
    subtitle: string;
    tabChildren: string;
    tabProgress: string;
    sectionChildProfiles: string;
    sectionLearningProgress: string;
    toneStyle: Record<string, string>;
    aiCompanion: string;
  };
  worlds: {
    mathIsland: string;
    readingForest: string;
    logicMountain: string;
    englishCity: string;
  };
  missions: {
    missionComplete: string;
    correctAnswer: string;
    tryAgain: string;
    startMission: string;
    missionProgress: (completed: number, total: number) => string;
    xpEarned: (xp: number) => string;
    starsEarned: (stars: number) => string;
    xpLabel: string;
    levelLabel: (lv: number) => string;
  };
  streak: {
    dailyStreak: string;
    dayCount: (days: number) => string;
    xpPoints: string;
  };
}

export const translations: Record<LangCode, UITranslations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      junior: "Elementary",
      student: "Middle School",
      family: "Family",
      psychology: "Psychology",
      parent: "Parent",
      signOut: "Sign Out",
    },
    dashboard: {
      greeting: (name) => `Good morning, ${name}! ☀️`,
      subtitle: "Welcome to your family's command center. Where would you like to go today?",
      setupFamily: "Set up your Family",
      setupFamilyDesc: "Create a family profile to add children and share calendars.",
      goToSettings: "Go to Settings",
      quickSwitch: "Quick switch child",
      childLevel: (lv, xp, stars) => `Level ${lv} · ${xp} XP · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `Grade ${grade} · Lv ${lv}`,
      reviewChip: "Review",
    },
    modules: {
      juniorTitle: "AYA Elementary",
      juniorDesc: "Learning world for Grades 1–4",
      studentTitle: "AYA Middle School",
      studentDesc: "Smart companion for Grades 5–7",
      familyTitle: "AYA Family",
      familyDesc: "Shared calendar, tasks & household coordination",
      psychologyTitle: "AYA Psychology",
      psychologyDesc: "Warm emotional support & thoughtful conversations",
    },
    buttons: {
      saveChanges: "Save Changes",
      addChild: "Add Child",
      back: "Back",
    },
    chat: {
      juniorPlaceholder: "Ask me anything! I'm here to guide you… 🌟",
      placeholder: "Type your message...",
    },
    parent: {
      title: "Parent Control Panel",
      subtitle: "Manage profiles, monitor progress, and review AI insights.",
      tabChildren: "Children Profiles",
      tabProgress: "Learning Progress",
      sectionChildProfiles: "Child Profiles",
      sectionLearningProgress: "Learning Progress",
      toneStyle: {
        gentle:      "gentle style",
        encouraging: "encouraging style",
        playful:     "playful style",
        calm:        "calm style",
      },
      aiCompanion: "AI Companion",
    },
    worlds: {
      mathIsland: "Math Island",
      readingForest: "Reading Forest",
      logicMountain: "Logic Mountain",
      englishCity: "English City",
    },
    missions: {
      missionComplete: "Mission completed!",
      correctAnswer: "Great job!",
      tryAgain: "Try again. Think a bit more.",
      startMission: "Start Mission",
      missionProgress: (completed, total) => `${completed} / ${total} tasks completed`,
      xpEarned: (xp) => `+${xp} XP`,
      starsEarned: (stars) => `⭐ +${stars}`,
      xpLabel: "XP",
      levelLabel: (lv) => `Level ${lv}`,
    },
    streak: {
      dailyStreak: "Daily Streak",
      dayCount: (days) => `${days} days in a row`,
      xpPoints: "XP Points",
    },
  },
  bg: {
    nav: {
      dashboard: "Табло",
      junior: "Начален етап",
      student: "Прогимназия",
      family: "Семейство",
      psychology: "Психология",
      parent: "Родител",
      signOut: "Изход",
    },
    dashboard: {
      greeting: (name) => `Добро утро, ${name}! ☀️`,
      subtitle: "Добре дошли в семейния команден център. Накъде искате да отидете днес?",
      setupFamily: "Настройте вашето Семейство",
      setupFamilyDesc: "Създайте семеен профил, за да добавите деца и да споделите календари.",
      goToSettings: "Към настройки",
      quickSwitch: "Смени дете",
      childLevel: (lv, xp, stars) => `Ниво ${lv} · ${xp} точки · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `${grade} клас · Ниво ${lv}`,
      reviewChip: "Преговор",
    },
    modules: {
      juniorTitle: "AYA Начален етап",
      juniorDesc: "Учебен свят за 1–4 клас",
      studentTitle: "AYA Прогимназия",
      studentDesc: "Умен помощник за 5–7 клас",
      familyTitle: "AYA Семейство",
      familyDesc: "Споделен календар, задачи и домашна координация",
      psychologyTitle: "AYA Психология",
      psychologyDesc: "Топла емоционална подкрепа и разговори",
    },
    buttons: {
      saveChanges: "Запази промените",
      addChild: "Добави дете",
      back: "Назад",
    },
    chat: {
      juniorPlaceholder: "Попитай ме нещо! Аз съм тук да помогна.",
      placeholder: "Напишете вашето съобщение...",
    },
    parent: {
      title: "Родителски контролен панел",
      subtitle: "Управлявайте профили, следете напредъка и преглеждайте AI анализите.",
      tabChildren: "Профили на деца",
      tabProgress: "Напредък в обучението",
      sectionChildProfiles: "Профили на деца",
      sectionLearningProgress: "Напредък в обучението",
      toneStyle: {
        gentle:      "нежен стил",
        encouraging: "насърчаващ стил",
        playful:     "игрив стил",
        calm:        "спокоен стил",
      },
      aiCompanion: "AI Компаньон",
    },
    worlds: {
      mathIsland: "Остров на математиката",
      readingForest: "Гора на четенето",
      logicMountain: "Логическа планина",
      englishCity: "Английски град",
    },
    missions: {
      missionComplete: "Мисията е изпълнена!",
      correctAnswer: "Браво!",
      tryAgain: "Опитай отново. Помисли още малко.",
      startMission: "Започни мисия",
      missionProgress: (completed, total) => `${completed} / ${total} задачи решени`,
      xpEarned: (xp) => `+${xp} точки`,
      starsEarned: (stars) => `⭐ +${stars}`,
      xpLabel: "Точки",
      levelLabel: (lv) => `Ниво ${lv}`,
    },
    streak: {
      dailyStreak: "Поредица",
      dayCount: (days) => `${days} дни подред`,
      xpPoints: "Точки",
    },
  },
  es: {
    nav: {
      dashboard: "Panel",
      junior: "Primaria",
      student: "Secundaria",
      family: "Familia",
      psychology: "Psicología",
      parent: "Padre",
      signOut: "Cerrar sesión",
    },
    dashboard: {
      greeting: (name) => `¡Buenos días, ${name}! ☀️`,
      subtitle: "Bienvenido al centro de control familiar. ¿A dónde quieres ir hoy?",
      setupFamily: "Configurar tu Familia",
      setupFamilyDesc: "Crea un perfil familiar para agregar niños y compartir calendarios.",
      goToSettings: "Ir a configuración",
      quickSwitch: "Cambiar niño",
      childLevel: (lv, xp, stars) => `Nivel ${lv} · ${xp} XP · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `${grade} grado · Nv ${lv}`,
      reviewChip: "Repaso",
    },
    modules: {
      juniorTitle: "AYA Primaria",
      juniorDesc: "Mundo de aprendizaje para 1–4",
      studentTitle: "AYA Secundaria",
      studentDesc: "Compañero inteligente para 5–7",
      familyTitle: "AYA Familia",
      familyDesc: "Calendario compartido y coordinación del hogar",
      psychologyTitle: "AYA Psicología",
      psychologyDesc: "Apoyo emocional cálido y conversaciones reflexivas",
    },
    buttons: {
      saveChanges: "Guardar cambios",
      addChild: "Añadir niño",
      back: "Volver",
    },
    chat: {
      juniorPlaceholder: "Pregúntame algo. Estoy aquí para ayudarte.",
      placeholder: "Escribe tu mensaje...",
    },
    parent: {
      title: "Panel de control parental",
      subtitle: "Administre perfiles, monitoree el progreso y revise los análisis de IA.",
      tabChildren: "Perfiles de niños",
      tabProgress: "Progreso de aprendizaje",
      sectionChildProfiles: "Perfiles de niños",
      sectionLearningProgress: "Progreso de aprendizaje",
      toneStyle: {
        gentle:      "estilo suave",
        encouraging: "estilo motivador",
        playful:     "estilo lúdico",
        calm:        "estilo tranquilo",
      },
      aiCompanion: "Compañero IA",
    },
    worlds: {
      mathIsland: "Isla de Matemáticas",
      readingForest: "Bosque de Lectura",
      logicMountain: "Montaña de Lógica",
      englishCity: "Ciudad de Inglés",
    },
    missions: {
      missionComplete: "¡Misión completada!",
      correctAnswer: "¡Muy bien!",
      tryAgain: "Intenta de nuevo. Piensa un poco más.",
      startMission: "Comenzar misión",
      missionProgress: (completed, total) => `${completed} / ${total} ejercicios resueltos`,
      xpEarned: (xp) => `+${xp} XP`,
      starsEarned: (stars) => `⭐ +${stars}`,
      xpLabel: "XP",
      levelLabel: (lv) => `Nivel ${lv}`,
    },
    streak: {
      dailyStreak: "Racha diaria",
      dayCount: (days) => `${days} días seguidos`,
      xpPoints: "Puntos XP",
    },
  },
  de: {
    nav: {
      dashboard: "Dashboard",
      junior: "Grundschule",
      student: "Mittelschule",
      family: "Familie",
      psychology: "Psychologie",
      parent: "Eltern",
      signOut: "Abmelden",
    },
    dashboard: {
      greeting: (name) => `Guten Morgen, ${name}! ☀️`,
      subtitle: "Willkommen bei deinem Familien-Kommandozentrum. Wohin möchtest du heute gehen?",
      setupFamily: "Richte deine Familie ein",
      setupFamilyDesc: "Erstelle ein Familienprofil, um Kinder hinzuzufügen und Kalender zu teilen.",
      goToSettings: "Zu den Einstellungen",
      quickSwitch: "Kind wechseln",
      childLevel: (lv, xp, stars) => `Stufe ${lv} · ${xp} XP · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `Klasse ${grade} · Stufe ${lv}`,
      reviewChip: "Wiederholung",
    },
    modules: {
      juniorTitle: "AYA Grundschule",
      juniorDesc: "Lernwelt für 1.–4. Klasse",
      studentTitle: "AYA Mittelschule",
      studentDesc: "Intelligenter Begleiter für 5.–7. Klasse",
      familyTitle: "AYA Familie",
      familyDesc: "Gemeinsamer Kalender, Aufgaben & Haushaltskoordination",
      psychologyTitle: "AYA Psychologie",
      psychologyDesc: "Warme emotionale Unterstützung und durchdachte Gespräche",
    },
    buttons: {
      saveChanges: "Änderungen speichern",
      addChild: "Kind hinzufügen",
      back: "Zurück",
    },
    chat: {
      juniorPlaceholder: "Frag mich etwas! Ich bin hier, um dir zu helfen… 🌟",
      placeholder: "Gib deine Nachricht ein...",
    },
    parent: {
      title: "Eltern-Kontrollpanel",
      subtitle: "Verwalte Profile, überwache Fortschritte und überprüfe KI-Erkenntnisse.",
      tabChildren: "Kinderprofile",
      tabProgress: "Lernfortschritt",
      sectionChildProfiles: "Kinderprofile",
      sectionLearningProgress: "Lernfortschritt",
      toneStyle: {
        gentle:      "sanfter Stil",
        encouraging: "ermutigender Stil",
        playful:     "verspikelter Stil",
        calm:        "ruhiger Stil",
      },
      aiCompanion: "KI-Begleiter",
    },
    worlds: {
      mathIsland: "Mathematik-Insel",
      readingForest: "Lese-Wald",
      logicMountain: "Logik-Berg",
      englishCity: "Englisch-Stadt",
    },
    missions: {
      missionComplete: "Mission abgeschlossen!",
      correctAnswer: "Sehr gut!",
      tryAgain: "Versuche es noch mal. Denk ein bisschen mehr nach.",
      startMission: "Mission starten",
      missionProgress: (completed, total) => `${completed} / ${total} Aufgaben gelöst`,
      xpEarned: (xp) => `+${xp} XP`,
      starsEarned: (stars) => `⭐ +${stars}`,
      xpLabel: "XP",
      levelLabel: (lv) => `Stufe ${lv}`,
    },
    streak: {
      dailyStreak: "Tägliche Gewohnheit",
      dayCount: (days) => `${days} Tage hintereinander`,
      xpPoints: "XP-Punkte",
    },
  },
  fr: {
    nav: {
      dashboard: "Tableau de bord",
      junior: "Primaire",
      student: "Collège",
      family: "Famille",
      psychology: "Psychologie",
      parent: "Parent",
      signOut: "Déconnexion",
    },
    dashboard: {
      greeting: (name) => `Bonjour, ${name}! ☀️`,
      subtitle: "Bienvenue dans le centre de contrôle de votre famille. Où voulez-vous aller aujourd'hui?",
      setupFamily: "Configurez votre famille",
      setupFamilyDesc: "Créez un profil familial pour ajouter des enfants et partager des calendriers.",
      goToSettings: "Aller aux paramètres",
      quickSwitch: "Changer d'enfant",
      childLevel: (lv, xp, stars) => `Niveau ${lv} · ${xp} XP · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `Grade ${grade} · Niveau ${lv}`,
      reviewChip: "Révision",
    },
    modules: {
      juniorTitle: "AYA Primaire",
      juniorDesc: "Monde d'apprentissage pour les classes 1–4",
      studentTitle: "AYA Collège",
      studentDesc: "Compagnon intelligent pour les classes 5–7",
      familyTitle: "AYA Famille",
      familyDesc: "Calendrier partagé, tâches et coordination familiale",
      psychologyTitle: "AYA Psychologie",
      psychologyDesc: "Soutien émotionnel chaleureux et conversations réfléchies",
    },
    buttons: {
      saveChanges: "Enregistrer les modifications",
      addChild: "Ajouter un enfant",
      back: "Retour",
    },
    chat: {
      juniorPlaceholder: "Posez-moi une question! Je suis là pour vous aider… 🌟",
      placeholder: "Tapez votre message...",
    },
    parent: {
      title: "Panneau de contrôle parental",
      subtitle: "Gérez les profils, suivez les progrès et révisez les informations sur l'IA.",
      tabChildren: "Profils des enfants",
      tabProgress: "Progrès d'apprentissage",
      sectionChildProfiles: "Profils des enfants",
      sectionLearningProgress: "Progrès d'apprentissage",
      toneStyle: {
        gentle:      "style doux",
        encouraging: "style encourageant",
        playful:     "style ludique",
        calm:        "style calme",
      },
      aiCompanion: "Compagnon IA",
    },
    worlds: {
      mathIsland: "Île des Mathématiques",
      readingForest: "Forêt de Lecture",
      logicMountain: "Montagne de la Logique",
      englishCity: "Ville de l'Anglais",
    },
    missions: {
      missionComplete: "Mission accomplie!",
      correctAnswer: "Bravo!",
      tryAgain: "Réessaie. Réfléchis un peu plus.",
      startMission: "Commencer la mission",
      missionProgress: (completed, total) => `${completed} / ${total} tâches résolues`,
      xpEarned: (xp) => `+${xp} XP`,
      starsEarned: (stars) => `⭐ +${stars}`,
      xpLabel: "XP",
      levelLabel: (lv) => `Niveau ${lv}`,
    },
    streak: {
      dailyStreak: "Apprentissage quotidien",
      dayCount: (days) => `${days} jours consécutifs`,
      xpPoints: "Points XP",
    },
  },
};
