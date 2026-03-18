import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { Link } from "wouter";
import { Star, Trophy, Sparkles, Map, MessageCircle, Lock, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, useUpdateChild, useListMissions, getListChildrenQueryKey, getListMissionsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Badge, Child, Mission, UpdateChildBodyAiCharacter } from "@workspace/api-client-react";

const CHARACTERS = [
  { id: "panda", name: "Panda Teacher", emoji: "🐼", color: "bg-green-100 border-green-300", desc: "Patient and gentle" },
  { id: "robot", name: "Robot Guide", emoji: "🤖", color: "bg-blue-100 border-blue-300", desc: "Logical and precise" },
  { id: "fox", name: "Fox Mentor", emoji: "🦊", color: "bg-orange-100 border-orange-300", desc: "Creative and playful" },
  { id: "owl", name: "Owl Professor", emoji: "🦉", color: "bg-purple-100 border-purple-300", desc: "Wise and thoughtful" },
];

const ZONES = [
  { id: "Math Island", emoji: "🏝️", color: "text-orange-600", bgColor: "bg-gradient-to-br from-orange-100 to-yellow-50", borderColor: "border-orange-300", xpRequired: 0, desc: "Numbers & counting" },
  { id: "Reading Forest", emoji: "🌲", color: "text-green-600", bgColor: "bg-gradient-to-br from-green-100 to-emerald-50", borderColor: "border-green-300", xpRequired: 30, desc: "Words & stories" },
  { id: "Logic Mountain", emoji: "⛰️", color: "text-blue-600", bgColor: "bg-gradient-to-br from-blue-100 to-sky-50", borderColor: "border-blue-300", xpRequired: 80, desc: "Puzzles & patterns" },
  { id: "English City", emoji: "🏙️", color: "text-purple-600", bgColor: "bg-gradient-to-br from-purple-100 to-violet-50", borderColor: "border-purple-300", xpRequired: 150, desc: "Language & speaking" },
  { id: "Science Planet", emoji: "🌍", color: "text-teal-600", bgColor: "bg-gradient-to-br from-teal-100 to-cyan-50", borderColor: "border-teal-300", xpRequired: 250, desc: "Nature & discovery" },
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

function CharacterPicker({ child, onSelect, onClose }: { child: Child; onSelect: (char: UpdateChildBodyAiCharacter) => void; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-display font-bold mb-2 text-center">Choose Your Learning Companion!</h2>
        <p className="text-muted-foreground text-center mb-6">Your companion will guide you through every mission 🎓</p>
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map(char => (
            <button key={char.id} onClick={() => onSelect(char.id as UpdateChildBodyAiCharacter)}
              className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg ${child.aiCharacter === char.id ? 'border-junior shadow-lg ring-2 ring-junior/50' : 'border-transparent hover:border-junior/50'} ${char.color}`}>
              <div className="text-5xl mb-2">{char.emoji}</div>
              <div className="font-bold text-sm">{char.name}</div>
              <div className="text-xs text-muted-foreground">{char.desc}</div>
              {child.aiCharacter === char.id && (
                <div className="mt-2 text-xs font-bold text-junior-foreground bg-junior px-2 py-1 rounded-full">Current</div>
              )}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors">Cancel</button>
      </motion.div>
    </motion.div>
  );
}

export function Junior() {
  const { activeChildId, setActiveChildId } = useAuth();
  const { toast } = useToast();
  const [showCharPicker, setShowCharPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "chat">("map");

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
    ? `${currentChar?.emoji ?? "🌟"} Hi ${activeChild.name}! I'm your ${currentChar?.name ?? "AYA"} and I'm so excited to learn with you today! What would you like to explore? 🚀`
    : "Hello! I'm AYA. Let's learn something wonderful today! 🌟";

  return (
    <Layout isJunior>
      <AnimatePresence>
        {showCharPicker && activeChild && (
          <CharacterPicker child={activeChild} onSelect={handleSelectCharacter} onClose={() => setShowCharPicker(false)} />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 bg-white/60 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-junior-foreground">
              Hi, {activeChild?.name || "Explorer"}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-junior-foreground/70 font-medium">Level {level}</span>
              <div className="w-24 h-2 bg-yellow-200 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${levelProgress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{levelProgress}/100 XP</span>
            </div>
            {badges.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {badges.slice(0, 5).map(b => <span key={b.id} title={b.title} className="text-base">{b.icon}</span>)}
                {badges.length > 5 && <span className="text-xs text-muted-foreground">+{badges.length - 5}</span>}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-yellow-200 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-yellow-600">{activeChild?.stars || 0}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-orange-200 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="font-bold text-orange-600">{activeChild?.xp || 0} XP</span>
          </div>
          <button onClick={() => setShowCharPicker(true)}
            className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-purple-200 flex items-center gap-1.5 hover:bg-purple-50 transition-colors">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-purple-600">{currentChar?.emoji ?? "👤"} {currentChar?.name ?? "Choose Companion"}</span>
          </button>
        </div>
      </div>

      {children.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {children.map(c => (
            <button key={c.id} onClick={() => setActiveChildId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${activeChildId === c.id ? 'bg-junior text-junior-foreground shadow-sm' : 'bg-white/50 text-muted-foreground hover:bg-white'}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-1 mb-6 bg-white/50 backdrop-blur-sm p-1.5 rounded-2xl w-fit border border-white/60 shadow-sm">
        <button onClick={() => setActiveTab("map")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "map" ? "bg-junior text-junior-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
          <Map className="w-4 h-4" /> World Map
        </button>
        <button onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === "chat" ? "bg-junior text-junior-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}>
          <MessageCircle className="w-4 h-4" /> Chat with {currentChar?.name ?? "AYA"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "map" ? (
          <motion.div key="map" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
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
          <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <Chat module="junior" themeColor="junior" character={character} greeting={greeting} />
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
