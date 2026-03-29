import type { LangCode } from "@/lib/i18n";

/* ─── Types ─────────────────────────────────────────────────────── */

export type CuriosityKind = "fact" | "riddle" | "challenge" | "question";

export interface CuriosityCard {
  kind: CuriosityKind;
  emoji: string;
  title: string;
  content: string;
  reveal?: string;
}

/* ─── Static curiosity pool ─────────────────────────────────────── */
/* Organised by subjectId → lang → card[].
   Fallback chain: subjectId → "general"; lang → "en".              */

type Pool = Record<string, Record<LangCode, CuriosityCard[]>>;

const POOL: Pool = {
  mathematics: {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Интересен факт",
        content: "Числото 0 е единственото число, което не е нито положително, нито отрицателно. То е специален гост в света на числата!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Загадка",
        content: "Имам три ябълки. Вземам две. Колко ябълки имам сега?",
        reveal: "Две — тези, които взех! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Преброи назад от 20 до 1 само в ума си. Можеш ли да го направиш за 15 секунди?",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Защо когато умножаваме по 10, просто добавяме нула накрая? Например 5 × 10 = 50.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Всяко четно число може да се раздели на 2 без остатък. Числата 2, 4, 6, 8, 10... никога не свършват!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Числова загадка",
        content: "Кое число, когато добавиш 15 към него, получаваш 30?",
        reveal: "15! Защото 15 + 15 = 30.",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Fun fact",
        content: "The number 0 is neither positive nor negative — it is unique in the world of numbers!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Riddle",
        content: "I have three apples. I take away two. How many apples do I have now?",
        reveal: "Two — the ones I took! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Count backwards from 20 to 1 in your head. Can you do it in 15 seconds?",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "Why does multiplying by 10 just add a zero? For example 5 × 10 = 50. What is really happening?",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Every even number can be divided by 2 without a remainder. 2, 4, 6, 8, 10... they never end!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Dato curioso",
        content: "¡El número 0 no es ni positivo ni negativo — es único en el mundo de los números!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Acertijo",
        content: "Tengo tres manzanas. Me llevo dos. ¿Cuántas manzanas tengo ahora?",
        reveal: "¡Dos — las que me llevé! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini desafío",
        content: "Cuenta hacia atrás desde 20 hasta 1 en tu cabeza. ¿Puedes hacerlo en 15 segundos?",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Die Zahl 0 ist weder positiv noch negativ — sie ist einzigartig in der Welt der Zahlen!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Rätsel",
        content: "Ich habe drei Äpfel. Ich nehme zwei weg. Wie viele Äpfel habe ich jetzt?",
        reveal: "Zwei — die, die ich genommen habe! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini-Aufgabe",
        content: "Zähle von 20 bis 1 rückwärts in deinem Kopf. Schaffst du es in 15 Sekunden?",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Le nombre 0 n'est ni positif ni négatif — il est unique dans le monde des nombres!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Devinette",
        content: "J'ai trois pommes. J'en prends deux. Combien de pommes est-ce que j'ai maintenant?",
        reveal: "Deux — celles que j'ai prises! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini défi",
        content: "Compte à rebours de 20 à 1 dans ta tête. Peux-tu le faire en 15 secondes?",
      },
    ],
  },

  "bulgarian-language": {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Българският език има 30 букви. Много езици по света нямат собствена азбука, а ние имаме кирилицата!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Езикова загадка",
        content: "Коя дума в българския език означи и животно, и инструмент? Помислй!",
        reveal: "Има много такива — например 'лисица' и 'гвоздей' ❌... опитай с 'кон' (и животно, и при колело)!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Измисли изречение с думите: небе, летя, птица — в точно 6 думи!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Защо в историите героите имат имена, а не просто се казват 'човекът'? Какво добавя едно хубаво име?",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Интересен факт",
        content: "Думата 'баница' е само българска! Много чужденци я произнасят като 'банитца' 😄",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Загадка за думи",
        content: "Кой е по-голям — морето или океанът? А в речника коя дума е по-дълга?",
        reveal: "'Океан' и 'океан' — океанът е по-голям И думата е по-дълга (6 букви срещу 4)!",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Bulgarian uses the Cyrillic alphabet with 30 letters. Many languages in the world do not have their own alphabet!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Make up a sentence using the words: sky, fly, bird — in exactly 6 words!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "Why do story heroes have names instead of just being called 'the person'? What does a good name add?",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "El idioma búlgaro tiene 30 letras en el alfabeto cirílico. ¡Muchos idiomas del mundo no tienen su propio alfabeto!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini desafío",
        content: "Inventa una oración con las palabras: cielo, volar, pájaro — ¡en exactamente 6 palabras!",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Bulgarisch benutzt das kyrillische Alphabet mit 30 Buchstaben. Viele Sprachen der Welt haben kein eigenes Alphabet!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini-Aufgabe",
        content: "Erfinde einen Satz mit den Wörtern: Himmel, fliegen, Vogel — in genau 6 Wörtern!",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Le bulgare utilise l'alphabet cyrillique avec 30 lettres. Beaucoup de langues du monde n'ont pas leur propre alphabet!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini défi",
        content: "Invente une phrase avec les mots: ciel, voler, oiseau — en exactement 6 mots!",
      },
    ],
  },

  "logic-thinking": {
    bg: [
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Логическа загадка",
        content: "Ако имаш 2 монети, сумата им е 30 стотинки, и едната НЕ Е 20-стотинчена — какви са монетите?",
        reveal: "10 стотинки и 20 стотинки! Едната не е 20-стотинчена (тя е 10-стотинчена), но другата е! 😄",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Мисловен въпрос",
        content: "Ако всички котки са животни и всички животни имат сърца — имат ли всички котки сърца?",
        reveal: "Да! Това е логика стъпка по стъпка.",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Намери закономерността: 2, 4, 8, 16, ... — кое е следващото число?",
        reveal: "32! Всяко число се умножава по 2.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Мозъкът ни обича закономерности! Затова музиката, математиката и езиците са ни лесни — всичко е модели.",
      },
    ],
    en: [
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Logic riddle",
        content: "If you have 2 coins totalling 30 cents and one is NOT a 20-cent coin — what are the coins?",
        reveal: "10 cents and 20 cents! One is NOT the 20-cent coin (it is the 10-cent one), but the other IS! 😄",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Find the pattern",
        content: "What comes next? 2, 4, 8, 16, ...",
        reveal: "32! Each number is multiplied by 2.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Our brain loves patterns! That is why music, maths, and languages feel natural — everything is made of patterns.",
      },
    ],
    es: [
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Acertijo lógico",
        content: "¿Qué sigue en la serie? 2, 4, 8, 16, ...",
        reveal: "¡32! Cada número se multiplica por 2.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "¡A nuestro cerebro le encantan los patrones! Por eso la música, las matemáticas y los idiomas se sienten naturales.",
      },
    ],
    de: [
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Logik-Rätsel",
        content: "Was kommt als nächstes? 2, 4, 8, 16, ...",
        reveal: "32! Jede Zahl wird mit 2 multipliziert.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Unser Gehirn liebt Muster! Deshalb fühlen sich Musik, Mathematik und Sprachen natürlich an.",
      },
    ],
    fr: [
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Devinette logique",
        content: "Qu'est-ce qui suit? 2, 4, 8, 16, ...",
        reveal: "32! Chaque nombre est multiplié par 2.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Notre cerveau adore les schémas! C'est pourquoi la musique, les maths et les langues nous semblent naturelles.",
      },
    ],
  },

  "nature-science": {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Удивителен факт",
        content: "Пеперудите вкусват с краката си! Те имат рецептори за вкус на лапите.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Защо небето е синьо? Слънчевата светлина е бяла, но ние виждаме синьо!",
        reveal: "Защото въздухът разсейва синята светлина повече от другите цветове. Казва се разсейване на Рейли!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Природна загадка",
        content: "Кой е най-бавно движещото се животно на Земята?",
        reveal: "Ленивецът! Може да спи до 20 часа на ден и се движи само 40 метра на час.",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Назови 5 животни, които живеят в морето, за 10 секунди!",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Земята е единствената планета в Слънчевата система, на която има течна вода на повърхността. Ние сме уникални!",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Amazing fact",
        content: "Butterflies taste with their feet! They have taste receptors on their legs.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "Why is the sky blue? Sunlight is white, but we see blue!",
        reveal: "Because air scatters blue light more than other colours. It is called Rayleigh scattering!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Nature riddle",
        content: "What is the slowest animal on Earth?",
        reveal: "The sloth! It can sleep up to 20 hours a day and moves only 40 metres per hour.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Earth is the only planet in our Solar System with liquid water on its surface. We are unique!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Dato asombroso",
        content: "¡Las mariposas saborean con sus patas! Tienen receptores de sabor en sus pies.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Reflexiona",
        content: "¿Por qué el cielo es azul? ¡La luz del sol es blanca pero vemos azul!",
        reveal: "¡Porque el aire dispersa la luz azul más que otros colores!",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Erstaunliche Tatsache",
        content: "Schmetterlinge schmecken mit ihren Füßen! Sie haben Geschmacksrezeptoren an ihren Beinen.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Denk mal nach",
        content: "Warum ist der Himmel blau? Das Sonnenlicht ist weiß, aber wir sehen Blau!",
        reveal: "Weil die Luft blaues Licht mehr streut als andere Farben!",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Fait étonnant",
        content: "Les papillons goûtent avec leurs pieds! Ils ont des récepteurs gustatifs sur leurs pattes.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Réfléchis",
        content: "Pourquoi le ciel est-il bleu? La lumière du soleil est blanche mais on voit du bleu!",
        reveal: "Parce que l'air diffuse la lumière bleue plus que les autres couleurs!",
      },
    ],
  },

  "english-language": {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Думата 'set' на английски има над 430 различни значения! Тя е рекордьор в речника.",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Английска загадка",
        content: "Коя е думата, която се чете по същия начин отляво надясно и отдясно наляво?",
        reveal: "Много такива: 'racecar', 'level', 'civic'. Те се казват palindroми!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Назови 5 животни на английски за 10 секунди! Cat, dog... продължи ти!",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "The word 'set' has over 430 different meanings in English — it is the record-holder in the dictionary!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Word riddle",
        content: "Which word reads the same forwards and backwards?",
        reveal: "Many! 'racecar', 'level', 'civic' — these are called palindromes!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Name 5 animals in English in 10 seconds! Cat, dog... you continue!",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Fun fact",
        content: "There are more possible games of chess than there are atoms in the observable universe!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "¡La palabra 'set' en inglés tiene más de 430 significados diferentes — es el récord en el diccionario!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini desafío",
        content: "¡Nombra 5 animales en inglés en 10 segundos! Cat, dog... ¡tú continúas!",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Das Wort 'set' hat auf Englisch über 430 verschiedene Bedeutungen — Rekordhalter im Wörterbuch!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini-Aufgabe",
        content: "Nenne 5 Tiere auf Englisch in 10 Sekunden! Cat, dog... du machst weiter!",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Le mot 'set' en anglais a plus de 430 significations différentes — c'est le recordman du dictionnaire!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini défi",
        content: "Nomme 5 animaux en anglais en 10 secondes! Cat, dog... continue!",
      },
    ],
  },

  "reading-literature": {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Хората четат истории вече над 5000 години! Първите разкази са написани на глинени плочки в древна Месопотамия.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Защо героите в историите правят грешки? Какво научаваме от техните грешки?",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Литературна загадка",
        content: "В кои истории животните говорят, мислят и действат като хора?",
        reveal: "Баснята! Езоп е писал такива истории преди 2600 години. Той учи за живота чрез животни!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Измисли един герой — дай му име, едно добро качество и един страх. Имаш 30 секунди!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Мисловен въпрос",
        content: "Как се чувстваш, когато прочетеш история с тъжен край? Защо понякога обичаме тъжни истории?",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Интересен факт",
        content: "Стихотворенията са измислени, за да ги помним по-лесно! Ритъмът помага на мозъка да запомня.",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "People have been telling stories for over 5000 years! The first written stories were on clay tablets in ancient Mesopotamia.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "Why do story heroes make mistakes? What do we learn from their mistakes?",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Literature riddle",
        content: "In which stories do animals speak, think and act like humans?",
        reveal: "Fables! Aesop wrote them 2600 years ago. He taught life lessons through animals!",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Invent a character — give them a name, one good quality, and one fear. You have 30 seconds!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "¡La gente lleva contando historias más de 5000 años! Las primeras historias escritas estaban en tablillas de arcilla.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Reflexiona",
        content: "¿Por qué los héroes de las historias cometen errores? ¿Qué aprendemos de sus errores?",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini desafío",
        content: "¡Inventa un personaje — dale un nombre, una buena cualidad y un miedo. Tienes 30 segundos!",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Menschen erzählen seit über 5000 Jahren Geschichten! Die ersten schriftlichen Geschichten standen auf Tontafeln.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Denk mal nach",
        content: "Warum machen Helden in Geschichten Fehler? Was lernen wir aus ihren Fehlern?",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini-Aufgabe",
        content: "Erfinde eine Figur — gib ihr einen Namen, eine gute Eigenschaft und eine Angst. Du hast 30 Sekunden!",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Les gens racontent des histoires depuis plus de 5000 ans! Les premières histoires écrites étaient sur des tablettes d'argile.",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Réfléchis",
        content: "Pourquoi les héros des histoires font-ils des erreurs? Qu'est-ce qu'on apprend de leurs erreurs?",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini défi",
        content: "Invente un personnage — donne-lui un nom, une bonne qualité et une peur. Tu as 30 secondes!",
      },
    ],
  },

  "social-studies": {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "България е една от най-старите държави в Европа! Основана е през 681 г. — преди над 1300 години!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Как мислиш, защо е важно да знаем историята на своето семейство и роден край?",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Загадка за България",
        content: "Кой е символът на България, който е бял, зелен и червен?",
        reveal: "Трицветното знаме! Бялото е мир, зеленото е природа, а червеното е смелост.",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Традиция",
        content: "На Баба Марта (1 март) носим мартеници — бяло и червено за здраве и щастие! Тази традиция е само наша, българска.",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Назови 3 неща, заради които обичаш своето семейство или своя роден край. Имаш 20 секунди!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Мисловен въпрос",
        content: "Какви правила имате у дома? Защо смяташ, че правилата са важни в семейството и в класа?",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Bulgaria is one of the oldest countries in Europe! It was founded in 681 AD — over 1300 years ago!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "Why do you think it is important to know the history of your family and hometown?",
      },
      {
        kind: "fact",
        emoji: "💡",
        title: "Tradition",
        content: "On March 1st Bulgarians wear Martenitsi — red and white threads for health and happiness! This tradition is uniquely Bulgarian.",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Name 3 things you love about your family or hometown. You have 20 seconds!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "¡Bulgaria es uno de los países más antiguos de Europa! Fue fundada en 681 d.C. — ¡hace más de 1300 años!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Reflexiona",
        content: "¿Por qué crees que es importante conocer la historia de tu familia y tu ciudad natal?",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Bulgarien ist eines der ältesten Länder Europas! Es wurde 681 n. Chr. gegründet — vor über 1300 Jahren!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Denk mal nach",
        content: "Warum ist es wichtig, die Geschichte deiner Familie und deiner Heimatstadt zu kennen?",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "La Bulgarie est l'un des pays les plus anciens d'Europe! Elle a été fondée en 681 ap. J.-C. — il y a plus de 1300 ans!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Réfléchis",
        content: "Pourquoi penses-tu qu'il est important de connaître l'histoire de ta famille et de ta ville natale?",
      },
    ],
  },

  general: {
    bg: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Знаеш ли?",
        content: "Всеки ден, в който учиш нещо ново, мозъкът ти буквално расте — образуват се нови връзки!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Замисли се",
        content: "Ако можеше да научиш нещо за един ден, какво би избрала?",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Загадка",
        content: "Имам градове, но без хора. Имам планини, но без дървета. Какво съм аз?",
        reveal: "Карта! 🗺️",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Мини предизвикателство",
        content: "Затвори очи и изброй колко звуци чуваш в тази минута. Опитай!",
      },
    ],
    en: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Did you know?",
        content: "Every day you learn something new, your brain literally grows — new connections form between neurons!",
      },
      {
        kind: "question",
        emoji: "🔍",
        title: "Think about it",
        content: "If you could learn anything in one day, what would you choose?",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Riddle",
        content: "I have cities, but no people. I have mountains, but no trees. What am I?",
        reveal: "A map! 🗺️",
      },
      {
        kind: "challenge",
        emoji: "🎯",
        title: "Mini challenge",
        content: "Close your eyes and count how many sounds you can hear right now. Try it!",
      },
    ],
    es: [
      {
        kind: "fact",
        emoji: "💡",
        title: "¿Sabías que?",
        content: "¡Cada día que aprendes algo nuevo, tu cerebro literalmente crece — se forman nuevas conexiones!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Acertijo",
        content: "Tengo ciudades pero sin gente. Tengo montañas pero sin árboles. ¿Qué soy?",
        reveal: "¡Un mapa! 🗺️",
      },
    ],
    de: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Wusstest du?",
        content: "Jeden Tag, an dem du etwas Neues lernst, wächst dein Gehirn buchstäblich — es bilden sich neue Verbindungen!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Rätsel",
        content: "Ich habe Städte, aber keine Menschen. Ich habe Berge, aber keine Bäume. Was bin ich?",
        reveal: "Eine Karte! 🗺️",
      },
    ],
    fr: [
      {
        kind: "fact",
        emoji: "💡",
        title: "Le savais-tu?",
        content: "Chaque jour où tu apprends quelque chose de nouveau, ton cerveau grandit littéralement — de nouvelles connexions se forment!",
      },
      {
        kind: "riddle",
        emoji: "🧩",
        title: "Devinette",
        content: "J'ai des villes mais pas de gens. J'ai des montagnes mais pas d'arbres. Qu'est-ce que je suis?",
        reveal: "Une carte! 🗺️",
      },
    ],
  },
};

/* Subject aliases — map advanced/variant ids to pool key */
const SUBJECT_ALIAS: Record<string, string> = {
  "mathematics-advanced": "mathematics",
  "bulgarian-language-adv": "bulgarian-language",
  "english-advanced": "english-language",
  "logic-math": "logic-thinking",
  "natural-world": "nature-science",
  /* natural-science (middle/high) → same pool as nature-science (junior) */
  "natural-science": "nature-science",
  /* literature subject → reading-literature pool */
  "literature": "reading-literature",
};

function resolveSubjectKey(subjectId: string): string {
  return SUBJECT_ALIAS[subjectId] ?? subjectId;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ─── Public API ────────────────────────────────────────────────── */

/**
 * Get a random curiosity card for the given subject and language.
 * Falls back to "general" subject pool and "en" lang if needed.
 */
export function getCuriosityCard(subjectId: string, lang: LangCode): CuriosityCard {
  const key = resolveSubjectKey(subjectId);
  const subjectPool = POOL[key] ?? POOL.general;
  const langPool = subjectPool[lang] ?? subjectPool.en;
  if (!langPool || langPool.length === 0) {
    return pickRandom(POOL.general.en);
  }
  return pickRandom(langPool);
}

/**
 * Get a curiosity "spark" card for mid-lesson display.
 * Restricted to fact/question kinds — riddles and challenges require
 * interaction and would disrupt the lesson flow.
 * Falls back gracefully if no suitable card exists.
 */
export function getCuriosityFact(subjectId: string, lang: LangCode): CuriosityCard | null {
  const key = resolveSubjectKey(subjectId);
  const subjectPool = POOL[key] ?? POOL.general;
  const langPool = subjectPool[lang] ?? subjectPool.en;
  const pool = langPool ?? POOL.general.en;
  const facts = pool.filter(c => c.kind === "fact" || c.kind === "question");
  if (facts.length === 0) return null;
  return pickRandom(facts);
}

/**
 * Streak acknowledgment message — returns null if streak < 2.
 */
export function getStreakMessage(streak: number, lang: LangCode): string | null {
  if (streak < 2) return null;
  const MSGS: Record<LangCode, (n: number) => string> = {
    bg: n => n >= 7
      ? `🔥 Цяла седмица учим заедно! Ти си неспирен! ${n} поредни дни!`
      : n >= 5
      ? `⚡ ${n} поредни дни учим заедно! Невероятно постоянство!`
      : n >= 3
      ? `🌟 ${n} поредни дни учим заедно! Така се постига майсторство!`
      : `😊 Втори ден поред! Браво — продължавай така!`,
    en: n => n >= 7
      ? `🔥 A whole week of learning together! You are unstoppable! ${n} days in a row!`
      : n >= 5
      ? `⚡ ${n} days in a row! Incredible consistency!`
      : n >= 3
      ? `🌟 ${n} days in a row together! That is how mastery is built!`
      : `😊 Second day in a row! Great — keep it up!`,
    es: n => n >= 7
      ? `🔥 ¡Una semana entera aprendiendo juntos! ¡${n} días seguidos — imparable!`
      : n >= 3
      ? `🌟 ¡${n} días seguidos aprendiendo! ¡Así se construye el conocimiento!`
      : `😊 ¡Segundo día seguido! ¡Genial — sigue así!`,
    de: n => n >= 7
      ? `🔥 Eine ganze Woche gemeinsam lernen! ${n} Tage in Folge — unaufhaltsam!`
      : n >= 3
      ? `🌟 ${n} Tage in Folge! So wird Meisterschaft aufgebaut!`
      : `😊 Zweiter Tag in Folge! Toll — weiter so!`,
    fr: n => n >= 7
      ? `🔥 Une semaine entière à apprendre ensemble! ${n} jours d'affilée — inarrêtable!`
      : n >= 3
      ? `🌟 ${n} jours d'affilée! C'est comme ça qu'on construit la maîtrise!`
      : `😊 Deuxième jour d'affilée! Super — continue comme ça!`,
  };
  const fn = MSGS[lang] ?? MSGS.en;
  return fn(streak);
}

/**
 * Returns curiosity-style chat discovery prompts for the given language.
 * These are designed to spark curiosity, not just task-completion.
 */
export const DISCOVERY_PROMPTS: Record<LangCode, string[]> = {
  bg: [
    "Задай ми интересен факт",
    "Дай ми загадка!",
    "Знаеш ли защо...?",
    "Покажи ми нещо изненадващо",
    "Дай ми мини предизвикателство",
  ],
  en: [
    "Tell me an interesting fact",
    "Give me a riddle!",
    "Did you know why...?",
    "Show me something surprising",
    "Give me a mini challenge",
  ],
  es: [
    "Cuéntame un dato curioso",
    "¡Dame un acertijo!",
    "¿Sabías por qué...?",
    "Muéstrame algo sorprendente",
    "Dame un mini desafío",
  ],
  de: [
    "Erzähl mir eine interessante Tatsache",
    "Gib mir ein Rätsel!",
    "Wusstest du warum...?",
    "Zeig mir etwas Überraschendes",
    "Gib mir eine Mini-Aufgabe",
  ],
  fr: [
    "Dis-moi un fait intéressant",
    "Donne-moi une devinette!",
    "Savais-tu pourquoi...?",
    "Montre-moi quelque chose de surprenant",
    "Donne-moi un mini défi",
  ],
};

/**
 * Returns a combined prompt set: 2 task prompts + 2 discovery prompts.
 * Pass existing task prompts to merge with.
 */
export function mergeWithDiscoveryPrompts(
  taskPrompts: string[],
  lang: LangCode,
): string[] {
  const discovery = DISCOVERY_PROMPTS[lang] ?? DISCOVERY_PROMPTS.en;
  const twoTask = taskPrompts.slice(0, 2);
  const twoDisc = discovery.slice(0, 2);
  return [...twoTask, ...twoDisc];
}

/**
 * A short daily curiosity hook for the daily plan card header.
 */
export const DAILY_CURIOSITY_HOOKS: Record<LangCode, string[]> = {
  bg: [
    "Днес ще научим нещо, което ще те изненада! 🌟",
    "Готов ли си за едно страхотно откритие днес?",
    "Мозъкът ти е готов — нека открием нещо ново заедно!",
    "Знаеш ли какво ни чака днес? Нещо интересно! 🔍",
    "Всеки урок ни прави малко по-умни. Да започваме!",
  ],
  en: [
    "Today we will learn something that will surprise you! 🌟",
    "Ready for an amazing discovery today?",
    "Your brain is ready — let's discover something new together!",
    "Do you know what awaits us today? Something interesting! 🔍",
    "Every lesson makes us a little smarter. Let's start!",
  ],
  es: [
    "¡Hoy aprenderemos algo que te sorprenderá! 🌟",
    "¿Listo para un descubrimiento asombroso hoy?",
    "Tu cerebro está listo — ¡vamos a descubrir algo nuevo juntos!",
    "¿Sabes lo que nos espera hoy? ¡Algo interesante! 🔍",
    "Cada lección nos hace un poco más inteligentes. ¡Empecemos!",
  ],
  de: [
    "Heute werden wir etwas lernen, das dich überraschen wird! 🌟",
    "Bereit für eine tolle Entdeckung heute?",
    "Dein Gehirn ist bereit — lass uns gemeinsam etwas Neues entdecken!",
    "Weißt du, was uns heute erwartet? Etwas Interessantes! 🔍",
    "Jede Lektion macht uns ein bisschen klüger. Lass uns anfangen!",
  ],
  fr: [
    "Aujourd'hui nous allons apprendre quelque chose qui te surprendra! 🌟",
    "Prêt pour une découverte incroyable aujourd'hui?",
    "Ton cerveau est prêt — découvrons quelque chose de nouveau ensemble!",
    "Sais-tu ce qui nous attend aujourd'hui? Quelque chose d'intéressant! 🔍",
    "Chaque leçon nous rend un peu plus intelligents. Commençons!",
  ],
};

export function getDailyHook(lang: LangCode): string {
  return pickRandom(DAILY_CURIOSITY_HOOKS[lang] ?? DAILY_CURIOSITY_HOOKS.en);
}

/**
 * Short bridge phrases AYA uses to introduce a mid-lesson curiosity moment.
 * Spoken after the Nth solved task to keep lessons engaging.
 * Designed to feel like a natural teacher aside, not an interruption.
 */
export const CURIOSITY_BRIDGES: Record<LangCode, string[]> = {
  bg: [
    "Знаеш ли нещо интересно?",
    "Ей, слушай това —",
    "Малко интересен факт:",
    "Знаеш ли, че",
    "Преди следващата задача — интересно нещо:",
  ],
  en: [
    "Did you know?",
    "Here's something cool —",
    "Fun fact:",
    "Before the next task —",
    "Quick interesting fact:",
  ],
  es: [
    "¿Sabías que",
    "Aquí algo genial —",
    "Dato curioso:",
    "Antes de seguir —",
    "¡Escucha esto!",
  ],
  de: [
    "Wusstest du das?",
    "Hier etwas Tolles —",
    "Kleiner Wissensfakt:",
    "Kurz etwas Interessantes:",
    "Bevor wir weitermachen —",
  ],
  fr: [
    "Le savais-tu?",
    "Voici quelque chose de cool —",
    "Petit fait amusant:",
    "Avant la prochaine tâche —",
    "Écoute ça:",
  ],
};
