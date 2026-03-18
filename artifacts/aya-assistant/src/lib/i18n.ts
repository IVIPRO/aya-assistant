export type LangCode = "en" | "bg" | "es";

export function resolveLang(language?: string | null): LangCode {
  const l = (language ?? "").toLowerCase();
  if (l.includes("bulgar") || l === "bg") return "bg";
  if (l.includes("spanish") || l.includes("español") || l === "es") return "es";
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
}

export const translations: Record<LangCode, UITranslations> = {
  en: {
    nav: {
      dashboard: "Dashboard",
      junior: "Junior",
      student: "Student",
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
    },
    modules: {
      juniorTitle: "AYA Junior",
      juniorDesc: "Learning World for Grades 1–4",
      studentTitle: "AYA Student",
      studentDesc: "Smart study companion & homework help",
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
  },
  bg: {
    nav: {
      dashboard: "Табло",
      junior: "Junior",
      student: "Ученик",
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
      childLevel: (lv, xp, stars) => `Ниво ${lv} · ${xp} XP · ⭐ ${stars}`,
      gradeLevel: (grade, lv) => `${grade} клас · Ниво ${lv}`,
    },
    modules: {
      juniorTitle: "AYA Junior",
      juniorDesc: "Учебен свят за класове 1–4",
      studentTitle: "AYA Ученик",
      studentDesc: "Умен помощник за учене и домашни",
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
  },
  es: {
    nav: {
      dashboard: "Panel",
      junior: "Junior",
      student: "Estudiante",
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
    },
    modules: {
      juniorTitle: "AYA Junior",
      juniorDesc: "Mundo de aprendizaje para Grados 1–4",
      studentTitle: "AYA Estudiante",
      studentDesc: "Compañero de estudio inteligente",
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
  },
};
