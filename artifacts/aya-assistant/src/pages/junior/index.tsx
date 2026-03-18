import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { Link } from "wouter";
import { Star, Trophy, Sparkles, Map, MessageCircle, Lock, CheckCircle2, Mic, Volume2, Video, ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, useUpdateChild, useListMissions, getListChildrenQueryKey, getListMissionsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Badge, Child, Mission, UpdateChildBodyAiCharacter } from "@workspace/api-client-react";

const CHARACTERS = [
  {
    id: "panda",
    name: "AYA Panda",
    emoji: "🐼",
    color: "bg-green-100 border-green-300",
    accentColor: "text-green-700",
    desc: "Patient and gentle",
    tone: "gentle" as const,
    personality: "Panda takes learning step by step with warmth and care. Perfect for children who love calm, patient guidance through every new idea.",
  },
  {
    id: "robot",
    name: "AYA Robot",
    emoji: "🤖",
    color: "bg-blue-100 border-blue-300",
    accentColor: "text-blue-700",
    desc: "Logical and precise",
    tone: "encouraging" as const,
    personality: "Robot celebrates every correct answer and keeps learning clear and organized. Great for children who love structure and being cheered on.",
  },
  {
    id: "fox",
    name: "AYA Fox",
    emoji: "🦊",
    color: "bg-orange-100 border-orange-300",
    accentColor: "text-orange-700",
    desc: "Creative and playful",
    tone: "playful" as const,
    personality: "Fox turns every lesson into an adventure with games, stories, and surprises. Ideal for curious, energetic explorers who love discovering new things.",
  },
  {
    id: "owl",
    name: "AYA Owl",
    emoji: "🦉",
    color: "bg-purple-100 border-purple-300",
    accentColor: "text-purple-700",
    desc: "Wise and thoughtful",
    tone: "calm" as const,
    personality: "Owl guides deep thinking without rushing, encouraging reflection and curiosity. Best for children who love asking \"why?\" and thinking things through.",
  },
];

const ZONES = [
  { id: "Math Island", emoji: "🏝️", color: "text-orange-600", bgColor: "bg-gradient-to-br from-orange-100 to-yellow-50", borderColor: "border-orange-300", xpRequired: 0, desc: "Numbers & counting" },
  { id: "Reading Forest", emoji: "🌲", color: "text-green-600", bgColor: "bg-gradient-to-br from-green-100 to-emerald-50", borderColor: "border-green-300", xpRequired: 30, desc: "Words & stories" },
  { id: "Logic Mountain", emoji: "⛰️", color: "text-blue-600", bgColor: "bg-gradient-to-br from-blue-100 to-sky-50", borderColor: "border-blue-300", xpRequired: 80, desc: "Puzzles & patterns" },
  { id: "English City", emoji: "🏙️", color: "text-purple-600", bgColor: "bg-gradient-to-br from-purple-100 to-violet-50", borderColor: "border-purple-300", xpRequired: 150, desc: "Language & speaking" },
  { id: "Science Planet", emoji: "🌍", color: "text-teal-600", bgColor: "bg-gradient-to-br from-teal-100 to-cyan-50", borderColor: "border-teal-300", xpRequired: 250, desc: "Nature & discovery" },
];

const VOICE_FEATURES = [
  {
    icon: Mic,
    title: "Talk with AYA",
    desc: "Speak your questions and AYA will listen and respond to your voice.",
    color: "from-blue-50 to-sky-50 border-blue-200",
    iconColor: "text-blue-500 bg-blue-100",
  },
  {
    icon: Volume2,
    title: "Listen Mode",
    desc: "AYA reads lessons, stories, and missions aloud for you.",
    color: "from-green-50 to-emerald-50 border-green-200",
    iconColor: "text-green-500 bg-green-100",
  },
  {
    icon: Video,
    title: "Video Teacher",
    desc: "Meet AYA's animated video teacher for interactive face-to-face lessons.",
    color: "from-purple-50 to-violet-50 border-purple-200",
    iconColor: "text-purple-500 bg-purple-100",
  },
];

const JUNIOR_PROMPTS = [
  "Help me with math",
  "Let's read together",
  "Ask me a logic question",
  "Practice English",
];

function getMissionZone(mission: Mission): string {
  if (mission.zone) return mission.zone;
  const subj = mission.subject.toLowerCase();
  if (subj.includes("math") || subj.includes("матем") || subj.includes("maths")) return "Math Island";
  if (subj.includes("read") || subj.includes("четен") || subj.includes("deutsch") || subj.includes("lengua")) return "Reading Forest";
  if (subj.includes("logic") || subj.includes("логика")) return "Logic Mountain";
  if (subj.includes("english") || subj.includes("английски") || subj.includes("englisch") || subj.includes("inglés")) return "English City";
  return "Science Planet";
}

function getLevel(xp: number): number { return Math.floor(xp / 100) + 1; }
function getLevelProgress(xp: number): number { return xp % 100; }

function getGradeLabel(grade: number, country: string): string {
  const c = (country ?? "").toUpperCase().slice(0, 2);
  if (c === "DE") return `Klasse ${grade}`;
  if (c === "ES") return `${grade}º de Primaria`;
  if (c === "BG") return `${grade} клас`;
  if (c === "GB") return `Year ${grade + 1}`;
  return `Grade ${grade}`;
}

type JuniorView = "welcome" | "map" | "chat";

function CharacterPicker({ child, onSelect, onClose }: { child: Child; onSelect: (char: UpdateChildBodyAiCharacter) => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display font-bold mb-1 text-center">Choose Your Learning Companion!</h2>
        <p className="text-muted-foreground text-center mb-6 text-sm">Your companion will guide you through every mission with their own special teaching style 🎓</p>
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map(char => {
            const isSelected = child.aiCharacter === char.id;
            return (
              <button key={char.id} onClick={() => onSelect(char.id as UpdateChildBodyAiCharacter)}
                className={`p-5 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg text-left ${isSelected ? 'border-junior shadow-lg ring-2 ring-junior/50' : 'border-transparent hover:border-junior/50'} ${char.color}`}>
                <div className="text-5xl mb-3">{char.emoji}</div>
                <div className="font-bold text-base mb-0.5">{char.name}</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-2 ${char.accentColor}`}>{char.tone} tone</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{char.personality}</div>
                {isSelected && (
                  <div className="mt-3 text-xs font-bold text-junior-foreground bg-junior px-2 py-1 rounded-full inline-block">✓ Current companion</div>
                )}
              </button>
            );
          })}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors">Cancel</button>
      </motion.div>
    </motion.div>
  );
}

function WelcomeScreen({ child, character, onEnterWorld, onChat, onChangeCompanion }: {
  child: Child;
  character: typeof CHARACTERS[0] | undefined;
  onEnterWorld: () => void;
  onChat: () => void;
  onChangeCompanion: () => void;
}) {
  const level = getLevel(child.xp ?? 0);
  const levelProgress = getLevelProgress(child.xp ?? 0);
  const gradeLabel = getGradeLabel(child.grade, child.country ?? "");
  const badges = (child.badgesEarned ?? []) as Badge[];

  const welcomeMsg = character
    ? `${character.name} is ready for today's learning adventure! Let's discover something amazing together.`
    : "AYA is ready for today's learning adventure!";

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
      <div className="bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 rounded-[2.5rem] border-4 border-yellow-200 shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-junior/80 to-junior/60 px-8 pt-8 pb-6 text-center">
          <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="text-8xl mb-4 drop-shadow-lg leading-none">
            {character?.emoji ?? "🌟"}
          </motion.div>
          <h1 className="text-3xl font-display font-bold text-junior-foreground mb-1">
            Welcome back, {child.name}!
          </h1>
          <p className="text-junior-foreground/80 font-medium text-base">{welcomeMsg}</p>
        </div>

        <div className="px-8 py-6 space-y-5">
          {character && (
            <div className={`flex items-start gap-4 p-4 rounded-2xl border-2 ${character.color}`}>
              <div className="text-4xl">{character.emoji}</div>
              <div>
                <div className="font-bold text-base">{character.name}</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${character.accentColor}`}>{character.tone} learning style</div>
                <div className="text-xs text-muted-foreground leading-relaxed max-w-xs">{character.personality}</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Class</div>
              <div className="font-bold text-sm">{gradeLabel}</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Country</div>
              <div className="font-bold text-sm">{child.country ?? "—"}</div>
            </div>
            <div className="bg-white rounded-2xl p-3 text-center border border-border/30 shadow-sm">
              <div className="text-xs text-muted-foreground mb-1">Language</div>
              <div className="font-bold text-sm">{child.language ?? "—"}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-border/30 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-orange-400" />
                <span className="font-bold text-sm">Level {level}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                  {child.stars ?? 0} stars
                </span>
                <span>{child.xp ?? 0} XP total</span>
              </div>
            </div>
            <div className="w-full h-3 bg-yellow-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${levelProgress}%` }} transition={{ duration: 0.8, delay: 0.3 }}
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full" />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{levelProgress}/100 XP to next level</span>
              {badges.length > 0 && (
                <span className="flex gap-0.5">{badges.slice(0, 4).map(b => <span key={b.id}>{b.icon}</span>)}{badges.length > 4 && `+${badges.length - 4}`}</span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={onEnterWorld}
              className="w-full py-4 bg-junior text-junior-foreground rounded-2xl font-bold text-lg shadow-lg border-b-4 border-yellow-600 hover:border-b-2 hover:translate-y-0.5 transition-all flex items-center justify-center gap-3">
              <Map className="w-6 h-6" />
              Enter Learning World
              <ChevronRight className="w-5 h-5" />
            </motion.button>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onChat}
                className="py-3 bg-white border-2 border-junior/40 text-junior-foreground rounded-2xl font-bold text-sm shadow-md hover:bg-junior/5 transition-all flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chat with {character?.name?.split(" ")[1] ?? "AYA"}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={onChangeCompanion}
                className="py-3 bg-white border-2 border-purple-200 text-purple-700 rounded-2xl font-bold text-sm shadow-md hover:bg-purple-50 transition-all flex items-center justify-center gap-2">
                <Sparkles className="w-5 h-5" />
                Change Companion
              </motion.button>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground italic">
              AYA uses a Montessori-inspired learning style — guiding discovery, not just giving answers ✨
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function VoiceReadySection() {
  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-px flex-1 bg-border/40" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-3">Coming Soon</span>
        <div className="h-px flex-1 bg-border/40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {VOICE_FEATURES.map((f) => (
          <div key={f.title}
            className={`bg-gradient-to-br ${f.color} border rounded-2xl p-4 flex flex-col gap-3 opacity-80`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.iconColor}`}>
              <f.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm">{f.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</div>
            </div>
            <div className="mt-auto">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/60 text-muted-foreground px-2 py-1 rounded-full border border-border/30">
                Coming Soon
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Junior() {
  const { activeChildId, setActiveChildId } = useAuth();
  const { toast } = useToast();
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [view, setView] = useState<JuniorView>("welcome");

  const { data: children = [], refetch } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const updateChild = useUpdateChild();

  const activeChildIdResolved = activeChildId ?? children[0]?.id ?? null;
  if (!activeChildId && children.length > 0) setActiveChildId(children[0].id);

  const { data: missions = [] } = useListMissions(
    { childId: activeChildIdResolved ?? 0 },
    { query: { queryKey: getListMissionsQueryKey({ childId: activeChildIdResolved ?? 0 }), enabled: !!activeChildIdResolved } }
  );

  const activeChild = children.find(c => c.id === activeChildIdResolved) ?? null;
  const character = activeChild?.aiCharacter ?? null;
  const currentChar = CHARACTERS.find(c => c.id === character);
  const level = getLevel(activeChild?.xp ?? 0);
  const levelProgress = getLevelProgress(activeChild?.xp ?? 0);
  const badges = (activeChild?.badgesEarned ?? []) as Badge[];
  const childXp = activeChild?.xp ?? 0;

  const handleSelectCharacter = async (charId: UpdateChildBodyAiCharacter) => {
    if (!activeChildIdResolved) return;
    try {
      await updateChild.mutateAsync({ id: activeChildIdResolved, data: { aiCharacter: charId } });
      await refetch();
      setShowCharPicker(false);
      toast({ title: "Companion selected!", description: `${CHARACTERS.find(c => c.id === charId)?.name} is ready to help!` });
    } catch {
      toast({ title: "Error updating companion", variant: "destructive" });
    }
  };

  const greeting = activeChild
    ? `${currentChar?.emoji ?? "🌟"} Hi ${activeChild.name}! I'm your ${currentChar?.name ?? "AYA"} — using a Montessori teaching style to guide your learning adventure! What would you like to explore today? 🚀`
    : "Hello! I'm AYA. Let's learn something wonderful together! 🌟";

  return (
    <Layout isJunior>
      <AnimatePresence>
        {showCharPicker && activeChild && (
          <CharacterPicker child={activeChild} onSelect={handleSelectCharacter} onClose={() => setShowCharPicker(false)} />
        )}
      </AnimatePresence>

      {children.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {children.map(c => (
            <button key={c.id} onClick={() => { setActiveChildId(c.id); setView("welcome"); }}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${activeChildId === c.id ? 'bg-junior text-junior-foreground shadow-sm' : 'bg-white/50 text-muted-foreground hover:bg-white'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {view === "welcome" && activeChild ? (
          <motion.div key="welcome" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WelcomeScreen
              child={activeChild}
              character={currentChar}
              onEnterWorld={() => setView("map")}
              onChat={() => setView("chat")}
              onChangeCompanion={() => setShowCharPicker(true)}
            />
          </motion.div>
        ) : view === "welcome" && !activeChild ? (
          <motion.div key="no-child" className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No child profile found.</p>
            <p className="text-sm">Ask a parent to set up your learning profile in the Parent area.</p>
          </motion.div>
        ) : view === "map" ? (
          <motion.div key="map" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("welcome")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
                <span className="text-lg">{currentChar?.emoji ?? "🌟"}</span>
                <span className="font-bold text-sm text-junior-foreground">{currentChar?.name ?? "AYA"}</span>
                <span className="text-xs text-muted-foreground">· Level {level} · {childXp} XP</span>
              </div>
              <button onClick={() => setShowCharPicker(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/60 rounded-xl border border-white/50 hover:bg-purple-50 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {ZONES.map((zone, idx) => {
                const isUnlocked = childXp >= zone.xpRequired;
                const zoneMissions = missions.filter(m => getMissionZone(m) === zone.id);
                const completedCount = zoneMissions.filter(m => m.completed).length;
                const totalCount = zoneMissions.length;

                return (
                  <motion.div key={zone.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.07 }}>
                    <Link href={isUnlocked && activeChildIdResolved ? `/junior/world?zone=${encodeURIComponent(zone.id)}` : "#"}>
                      <div className={`relative p-6 rounded-[2rem] border-4 transition-all ${isUnlocked
                        ? `${zone.bgColor} ${zone.borderColor} cursor-pointer hover:-translate-y-2 hover:shadow-xl`
                        : "bg-muted/30 border-muted-foreground/20 cursor-not-allowed opacity-60"}`}>
                        {!isUnlocked && (
                          <div className="absolute top-4 right-4"><Lock className="w-5 h-5 text-muted-foreground/50" /></div>
                        )}
                        {isUnlocked && completedCount === totalCount && totalCount > 0 && (
                          <div className="absolute top-4 right-4"><CheckCircle2 className="w-5 h-5 text-green-500" /></div>
                        )}

                        <div className="text-5xl mb-3">{zone.emoji}</div>
                        <h3 className={`text-lg font-display font-bold mb-1 ${isUnlocked ? zone.color : 'text-muted-foreground'}`}>{zone.id}</h3>
                        <p className="text-muted-foreground text-sm mb-3">{zone.desc}</p>

                        {isUnlocked ? (
                          <div>
                            {totalCount > 0 && (
                              <>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                  <span>{completedCount}/{totalCount} missions</span>
                                  <span>{Math.round((completedCount / totalCount) * 100)}%</span>
                                </div>
                                <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all ${zone.color.replace('text-', 'bg-')}`}
                                    style={{ width: `${(completedCount / totalCount) * 100}%` }} />
                                </div>
                              </>
                            )}
                            <div className={`mt-3 text-xs font-bold ${zone.color}`}>
                              {totalCount === 0 ? "No missions yet" : completedCount === totalCount ? "✅ All done!" : `${totalCount - completedCount} missions left →`}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground font-medium">🔒 Unlock at {zone.xpRequired} XP</p>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-6 text-center">
              <Link href="/junior/world">
                <button className="bg-junior text-junior-foreground px-6 py-3 rounded-2xl shadow-md border-b-4 border-yellow-600 hover:translate-y-1 hover:border-b-0 transition-all font-bold flex items-center gap-2 mx-auto">
                  <Map className="w-5 h-5" /> Open Full World Map
                </button>
              </Link>
            </div>
          </motion.div>
        ) : (
          <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setView("welcome")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/60 px-4 py-2 rounded-xl border border-white/50 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl border border-white/50">
                <span className="text-lg">{currentChar?.emoji ?? "🌟"}</span>
                <span className="font-bold text-sm text-junior-foreground">{currentChar?.name ?? "AYA"}</span>
                {currentChar && <span className="text-xs text-muted-foreground">· {currentChar.tone} style</span>}
              </div>
              <button onClick={() => setView("map")}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/60 rounded-xl border border-white/50 hover:bg-yellow-50 transition-colors text-sm font-bold text-junior-foreground">
                <Map className="w-4 h-4" />
              </button>
            </div>

            <Chat
              module="junior"
              themeColor="junior"
              character={character}
              greeting={greeting}
              suggestedPrompts={JUNIOR_PROMPTS}
            />

            <VoiceReadySection />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
