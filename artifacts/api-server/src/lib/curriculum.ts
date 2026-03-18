export interface CurriculumMission {
  title: string;
  description: string;
  subject: string;
  zone: string;
  difficulty: "easy" | "medium" | "hard";
  xpReward: number;
  starReward: number;
}

interface GradeCurriculum {
  grade1: CurriculumMission[];
  grade2: CurriculumMission[];
  grade3: CurriculumMission[];
  grade4: CurriculumMission[];
}

const GENERIC: GradeCurriculum = {
  grade1: [
    { title: "Count to 20", description: "Count from 1 to 20 out loud and write the numbers", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
    { title: "Simple Addition", description: "Solve 5 addition problems: 2+3, 4+1, 5+2, 3+4, 6+1", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
    { title: "Read a Short Story", description: "Read a short story and tell AYA what it was about", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 40, starReward: 1 },
    { title: "Alphabet Sounds", description: "Say the sound each letter makes for all 26 letters", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
    { title: "Find the Odd One Out", description: "Look at 3 pictures: apple, orange, car. Which one is different?", subject: "Logic", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
    { title: "Greet in English", description: "Practice saying hello, goodbye, please and thank you in English", subject: "English", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
    { title: "Name 5 Animals", description: "Name 5 animals and say one fact about each one", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
    { title: "Color Mixing", description: "What color do you get when you mix red and yellow? Draw it!", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 25, starReward: 1 },
  ],
  grade2: [
    { title: "Count to 100", description: "Count from 1 to 100 by 2s (2, 4, 6...)", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
    { title: "Addition & Subtraction", description: "Solve: 15+7=?, 23-8=?, 14+9=?, 30-12=?", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 40, starReward: 1 },
    { title: "Read and Summarize", description: "Read a short paragraph and write 2 sentences about what happened", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 45, starReward: 1 },
    { title: "Rhyming Words", description: "Find 3 words that rhyme with: cat, day, and run", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
    { title: "Pattern Recognition", description: "What comes next: circle, square, circle, square, ___?", subject: "Logic", zone: "Logic Mountain", difficulty: "easy", xpReward: 30, starReward: 1 },
    { title: "English Colors", description: "Name 10 colors in English and point to something that color", subject: "English", zone: "English City", difficulty: "easy", xpReward: 30, starReward: 1 },
    { title: "Plant Life Cycle", description: "Draw and label the 4 stages of a plant's life cycle", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 40, starReward: 1 },
    { title: "Weather Types", description: "Name 5 types of weather and draw what you wear for each", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 30, starReward: 1 },
  ],
  grade3: [
    { title: "Multiplication Tables", description: "Practice the 2x, 3x, and 5x multiplication tables", subject: "Math", zone: "Math Island", difficulty: "medium", xpReward: 50, starReward: 2 },
    { title: "Word Problems", description: "Solve: Tom has 24 apples. He gives 8 away. How many left?", subject: "Math", zone: "Math Island", difficulty: "medium", xpReward: 50, starReward: 2 },
    { title: "Story Writing", description: "Write a 5-sentence story about your favorite animal", subject: "Reading", zone: "Reading Forest", difficulty: "medium", xpReward: 55, starReward: 2 },
    { title: "Adjectives", description: "Find 5 adjectives and use each in a sentence", subject: "Reading", zone: "Reading Forest", difficulty: "medium", xpReward: 40, starReward: 1 },
    { title: "Logic Puzzles", description: "Solve: If all cats are animals, and Whiskers is a cat, what is Whiskers?", subject: "Logic", zone: "Logic Mountain", difficulty: "medium", xpReward: 45, starReward: 2 },
    { title: "English Sentences", description: "Write 5 complete sentences in English about your day", subject: "English", zone: "English City", difficulty: "medium", xpReward: 45, starReward: 2 },
    { title: "The Solar System", description: "Name the 8 planets in order from the Sun", subject: "Science", zone: "Science Planet", difficulty: "medium", xpReward: 50, starReward: 2 },
    { title: "Food Chains", description: "Create a simple food chain with 3 living things", subject: "Science", zone: "Science Planet", difficulty: "medium", xpReward: 45, starReward: 2 },
  ],
  grade4: [
    { title: "Long Division", description: "Solve: 84 ÷ 4 = ?, 96 ÷ 6 = ?, 72 ÷ 8 = ?", subject: "Math", zone: "Math Island", difficulty: "hard", xpReward: 65, starReward: 2 },
    { title: "Fractions", description: "What is 1/2 of 20? What is 3/4 of 12? Draw the fractions", subject: "Math", zone: "Math Island", difficulty: "hard", xpReward: 65, starReward: 2 },
    { title: "Book Report", description: "Read a chapter book and write a summary with 3 main events", subject: "Reading", zone: "Reading Forest", difficulty: "hard", xpReward: 70, starReward: 2 },
    { title: "Synonyms and Antonyms", description: "Find synonyms for: happy, big, fast. Antonyms for: hot, loud, old", subject: "Reading", zone: "Reading Forest", difficulty: "medium", xpReward: 50, starReward: 2 },
    { title: "Deductive Reasoning", description: "Solve the logic puzzle: 3 friends each have different pets. Use clues to find who has which pet.", subject: "Logic", zone: "Logic Mountain", difficulty: "hard", xpReward: 70, starReward: 3 },
    { title: "English Paragraph", description: "Write a 3-paragraph essay in English about your favorite hobby", subject: "English", zone: "English City", difficulty: "hard", xpReward: 70, starReward: 3 },
    { title: "States of Matter", description: "Explain solid, liquid, gas and give 2 examples of each", subject: "Science", zone: "Science Planet", difficulty: "hard", xpReward: 65, starReward: 2 },
    { title: "Human Body Systems", description: "Name 3 body systems and explain what each one does", subject: "Science", zone: "Science Planet", difficulty: "hard", xpReward: 70, starReward: 3 },
  ],
};

const CURRICULA: Record<string, GradeCurriculum> = {
  BG: {
    grade1: [
      { title: "Брой до 20", description: "Брой от 1 до 20 на глас и запиши числата", subject: "Математика", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Събиране и изваждане", description: "Реши: 5+3=?, 8-2=?, 4+6=?, 10-4=?", subject: "Математика", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Прочети кратка история", description: "Прочети кратка история и разкажи на AYA за какво е", subject: "Четене", zone: "Reading Forest", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Познай буквите", description: "Кажи звука на всяка буква от азбуката", subject: "Четене", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Кое не е като другите?", description: "Ябълка, портокал, кола - кое е различното и защо?", subject: "Логика", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Поздрав на английски", description: "Научи се да казваш hello, goodbye, please и thank you", subject: "Английски", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Назови 5 животни", description: "Назови 5 животни и кажи по един факт за всяко", subject: "Човекът и природата", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Времето около нас", description: "Опиши времето навън - слънчево, облачно, дъждовно, снежно?", subject: "Човекът и природата", zone: "Science Planet", difficulty: "easy", xpReward: 25, starReward: 1 },
    ],
    grade2: [
      { title: "Умножение на 2 и 3", description: "Научи таблицата за умножение на 2 и 3", subject: "Математика", zone: "Math Island", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Задача с думи", description: "Мария има 15 ябълки и дава 6 на приятел. Колко остават?", subject: "Математика", zone: "Math Island", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Кратък преразказ", description: "Прочети абзац и напиши 2 изречения за основната мисъл", subject: "Четене", zone: "Reading Forest", difficulty: "easy", xpReward: 45, starReward: 1 },
      { title: "Части на речта", description: "Намери по 2 съществителни, прилагателни и глаголи в изречение", subject: "Четене", zone: "Reading Forest", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Редица от числа", description: "Какво е следващото число: 2, 4, 6, 8, ___?", subject: "Логика", zone: "Logic Mountain", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Цветовете на английски", description: "Назови 10 цвята на английски и посочи нещо от същия цвят", subject: "Английски", zone: "English City", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Жив и нежив свят", description: "Дай по 5 примера за живи и нежив обекти около теб", subject: "Човекът и природата", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Сезоните", description: "Опиши 4-те сезона: какво се случва с природата и хората", subject: "Човекът и природата", zone: "Science Planet", difficulty: "easy", xpReward: 30, starReward: 1 },
    ],
    grade3: [
      ...GENERIC.grade3,
    ],
    grade4: [
      ...GENERIC.grade4,
    ],
  },
  US: {
    grade1: [
      { title: "Count to 100", description: "Count from 1 to 100 and practice writing the numbers 1-20", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Adding to 10", description: "Solve addition problems where both numbers add up to 10 or less", subject: "Math", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Sight Words", description: "Practice reading 10 sight words: the, and, a, to, said, in, he, I, of, it", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Phonics Practice", description: "Sound out 5 short words using letter sounds: cat, dog, sun, big, hop", subject: "Reading", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "What's Different?", description: "Look at 4 shapes: triangle, square, circle, triangle. Which is different?", subject: "Logic", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Community Helpers", description: "Name 5 community helpers and explain what they do", subject: "Social Studies", zone: "Science Planet", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Living vs Non-living", description: "Sort these into living/non-living: dog, rock, flower, pencil, bird", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "My Feelings", description: "Draw faces showing 5 different emotions and name each one", subject: "Social Studies", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
    ],
    grade2: [
      ...GENERIC.grade2,
    ],
    grade3: [
      ...GENERIC.grade3,
    ],
    grade4: [
      ...GENERIC.grade4,
    ],
  },
  DE: {
    grade1: [
      { title: "Zahlen bis 20", description: "Zähle von 1 bis 20 laut und schreibe die Zahlen auf", subject: "Mathematik", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Einfaches Rechnen", description: "Löse: 3+4=?, 7-2=?, 5+5=?, 8-3=?", subject: "Mathematik", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Leseübung", description: "Lies einen kurzen Text und erzähle AYA, worum es geht", subject: "Deutsch", zone: "Reading Forest", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Buchstabenlaute", description: "Nenne den Laut jedes Buchstabens im Alphabet", subject: "Deutsch", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Muster erkennen", description: "Was kommt als nächstes: Kreis, Dreieck, Kreis, Dreieck, ___?", subject: "Logik", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Englisch Begrüßung", description: "Lerne: hello, goodbye, please und thank you auf Englisch", subject: "Englisch", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Tiere benennen", description: "Nenne 5 Tiere und nenne je einen Fakt über jedes Tier", subject: "Sachkunde", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Jahreszeiten", description: "Erkläre die 4 Jahreszeiten: Was passiert in der Natur?", subject: "Sachkunde", zone: "Science Planet", difficulty: "easy", xpReward: 25, starReward: 1 },
    ],
    grade2: [...GENERIC.grade2],
    grade3: [...GENERIC.grade3],
    grade4: [...GENERIC.grade4],
  },
  ES: {
    grade1: [
      { title: "Contar hasta 20", description: "Cuenta del 1 al 20 en voz alta y escribe los números", subject: "Matemáticas", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Suma y resta básica", description: "Resuelve: 3+4=?, 7-2=?, 5+5=?, 9-3=?", subject: "Matemáticas", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Lectura de palabras", description: "Lee 10 palabras y di qué significan: casa, perro, sol, árbol, agua", subject: "Lengua", zone: "Reading Forest", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Vocales y consonantes", description: "Identifica las 5 vocales y encuentra palabras que empiecen con cada una", subject: "Lengua", zone: "Reading Forest", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "¿Cuál es diferente?", description: "Manzana, naranja, bicicleta, plátano - ¿cuál no pertenece al grupo?", subject: "Lógica", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Inglés: Saludos", description: "Aprende a decir hello, goodbye, please y thank you en inglés", subject: "Inglés", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Animales del campo", description: "Nombra 5 animales del campo y di qué come cada uno", subject: "Ciencias Naturales", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "El tiempo atmosférico", description: "Describe el tiempo que hace hoy y qué ropa te pondrías", subject: "Ciencias Naturales", zone: "Science Planet", difficulty: "easy", xpReward: 25, starReward: 1 },
    ],
    grade2: [...GENERIC.grade2],
    grade3: [...GENERIC.grade3],
    grade4: [...GENERIC.grade4],
  },
  GB: {
    grade1: [
      { title: "Phonics: Set 1 Sounds", description: "Practice the sounds s, a, t, p, i, n, and blend them into words", subject: "English", zone: "Reading Forest", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Number Bonds to 10", description: "Find all the pairs of numbers that add up to 10: 1+9, 2+8...", subject: "Maths", zone: "Math Island", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Counting in 2s", description: "Count in 2s from 0 to 20: 0, 2, 4, 6...", subject: "Maths", zone: "Math Island", difficulty: "easy", xpReward: 30, starReward: 1 },
      { title: "Reading Comprehension", description: "Read a short passage about animals and answer 3 simple questions", subject: "English", zone: "Reading Forest", difficulty: "easy", xpReward: 40, starReward: 1 },
      { title: "Sequencing", description: "Put these events in order: getting dressed, waking up, eating breakfast, going to school", subject: "Logic", zone: "Logic Mountain", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "English Greetings", description: "Practice: hello, goodbye, good morning, good afternoon, good evening", subject: "English", zone: "English City", difficulty: "easy", xpReward: 25, starReward: 1 },
      { title: "Plants and Animals", description: "Name 3 plants and 3 animals found in the UK countryside", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 35, starReward: 1 },
      { title: "Seasonal Changes", description: "Describe what changes in nature during each of the 4 seasons", subject: "Science", zone: "Science Planet", difficulty: "easy", xpReward: 30, starReward: 1 },
    ],
    grade2: [...GENERIC.grade2],
    grade3: [...GENERIC.grade3],
    grade4: [...GENERIC.grade4],
  },
};

const COUNTRY_ALIASES: Record<string, string> = {
  BULGARIA: "BG",
  БЪЛЛГАРИЯ: "BG",
  BG: "BG",
  USA: "US",
  "UNITED STATES": "US",
  "UNITED STATES OF AMERICA": "US",
  US: "US",
  GERMANY: "DE",
  DEUTSCHLAND: "DE",
  DE: "DE",
  SPAIN: "ES",
  ESPAÑA: "ES",
  ES: "ES",
  "UNITED KINGDOM": "GB",
  UK: "GB",
  ENGLAND: "GB",
  BRITAIN: "GB",
  "GREAT BRITAIN": "GB",
  GB: "GB",
};

export function normalizeCountryCode(country: string): string {
  const upper = country.trim().toUpperCase();
  if (COUNTRY_ALIASES[upper]) return COUNTRY_ALIASES[upper];
  const twoLetter = upper.slice(0, 2);
  if (CURRICULA[twoLetter]) return twoLetter;
  return "GENERIC";
}

export function getMissionsForChild(country: string, grade: number): CurriculumMission[] {
  const code = normalizeCountryCode(country);
  const curriculum = CURRICULA[code] ?? GENERIC;

  const clampedGrade = Math.max(1, Math.min(4, grade));
  const gradeKey = `grade${clampedGrade}` as keyof GradeCurriculum;
  return curriculum[gradeKey];
}
