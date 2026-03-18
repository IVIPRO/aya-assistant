import { Layout } from "@/components/layout";
import { Star, Trophy, ArrowLeft, CheckCircle2, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useListMissions, useCompleteMission, useListChildren, getListMissionsQueryKey, getListChildrenQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Mission } from "@workspace/api-client-react";

interface Zone {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  xpRequired: number;
  description: string;
  subjectKeywords: string[];
}

const ZONES: Zone[] = [
  {
    id: "Math Island",
    name: "Math Island",
    emoji: "🏝️",
    color: "text-orange-600",
    bgColor: "bg-gradient-to-br from-orange-100 to-yellow-50",
    borderColor: "border-orange-300",
    xpRequired: 0,
    description: "Count, add, subtract, multiply and explore the magic of numbers!",
    subjectKeywords: ["Math", "Maths", "Математика", "Mathematik", "Matemáticas", "Numbers"],
  },
  {
    id: "Reading Forest",
    name: "Reading Forest",
    emoji: "🌲",
    color: "text-green-600",
    bgColor: "bg-gradient-to-br from-green-100 to-emerald-50",
    borderColor: "border-green-300",
    xpRequired: 30,
    description: "Read stories, learn words, and discover the power of language!",
    subjectKeywords: ["Reading", "Четене", "Deutsch", "Lengua", "English", "Literature", "Phonics"],
  },
  {
    id: "Logic Mountain",
    name: "Logic Mountain",
    emoji: "⛰️",
    color: "text-blue-600",
    bgColor: "bg-gradient-to-br from-blue-100 to-sky-50",
    borderColor: "border-blue-300",
    xpRequired: 80,
    description: "Solve puzzles, find patterns, and train your brilliant brain!",
    subjectKeywords: ["Logic", "Логика", "Lógica", "Sequencing", "Patterns"],
  },
  {
    id: "English City",
    name: "English City",
    emoji: "🏙️",
    color: "text-purple-600",
    bgColor: "bg-gradient-to-br from-purple-100 to-violet-50",
    borderColor: "border-purple-300",
    xpRequired: 150,
    description: "Practice English, learn new words, and speak with confidence!",
    subjectKeywords: ["English", "Английски", "Englisch", "Inglés", "Social Studies", "Grammar"],
  },
  {
    id: "Science Planet",
    name: "Science Planet",
    emoji: "🌍",
    color: "text-teal-600",
    bgColor: "bg-gradient-to-br from-teal-100 to-cyan-50",
    borderColor: "border-teal-300",
    xpRequired: 250,
    description: "Explore nature, animals, space, and how the world works!",
    subjectKeywords: ["Science", "Човекът и природата", "Sachkunde", "Ciencias Naturales", "Nature", "Biology", "Physics", "Social Studies"],
  },
];

function getMissionZone(mission: Mission): string {
  if (mission.zone) return mission.zone;
  const subj = mission.subject;
  for (const zone of ZONES) {
    if (zone.subjectKeywords.some(kw => subj.toLowerCase().includes(kw.toLowerCase()))) {
      return zone.id;
    }
  }
  return "Science Planet";
}

function DifficultyBadge({ difficulty }: { difficulty?: string | null }) {
  const map: Record<string, { label: string; color: string }> = {
    easy: { label: "Easy", color: "bg-green-100 text-green-700" },
    medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
    hard: { label: "Hard", color: "bg-red-100 text-red-700" },
  };
  const d = map[difficulty ?? "easy"] ?? map.easy;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.color}`}>{d.label}</span>;
}

export function WorldMap() {
  const { activeChildId } = useAuth();
  const { toast } = useToast();
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const { data: children = [] } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const { data: missions = [], refetch } = useListMissions(
    { childId: activeChildId || 0 },
    { query: { queryKey: getListMissionsQueryKey({ childId: activeChildId || 0 }), enabled: !!activeChildId } }
  );

  const completeMutation = useCompleteMission();
  const activeChild = children.find(c => c.id === activeChildId);
  const childXp = activeChild?.xp ?? 0;

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id, data: {} });
      toast({ title: "Mission Completed! 🎉", description: "You earned XP and Stars!" });
      refetch();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const zoneMissions = ZONES.map(zone => ({
    zone,
    missions: missions.filter(m => getMissionZone(m) === zone.id),
  }));

  const activeZone = selectedZone ? ZONES.find(z => z.id === selectedZone) : null;
  const activeMissions = selectedZone ? missions.filter(m => getMissionZone(m) === selectedZone) : [];

  return (
    <Layout isJunior>
      <div className="mb-6">
        <Link href="/junior" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-4 bg-white/50 px-4 py-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
          Back to Learning
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-junior-foreground flex items-center gap-3">
              🗺️ Learning World Map
            </h1>
            <p className="text-muted-foreground mt-1">Explore different zones and complete missions!</p>
          </div>
          {activeChild && (
            <div className="flex gap-3">
              <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-yellow-200 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-bold text-yellow-600">{activeChild.stars}</span>
              </div>
              <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-orange-200 flex items-center gap-1.5">
                <Trophy className="w-4 h-4 text-orange-400 fill-orange-400" />
                <span className="font-bold text-orange-600">{activeChild.xp} XP</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {!activeChildId && (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
          <p className="text-muted-foreground text-lg">Select a child profile to explore the Learning World!</p>
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedZone && activeZone ? (
          <motion.div
            key="zone-missions"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
          >
            <button
              onClick={() => setSelectedZone(null)}
              className="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold bg-white/50 px-4 py-2 rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to World Map
            </button>

            <div className={`p-6 rounded-2xl mb-6 ${activeZone.bgColor} border ${activeZone.borderColor}`}>
              <div className="flex items-center gap-4">
                <span className="text-5xl">{activeZone.emoji}</span>
                <div>
                  <h2 className={`text-2xl font-display font-bold ${activeZone.color}`}>{activeZone.name}</h2>
                  <p className="text-muted-foreground">{activeZone.description}</p>
                </div>
              </div>
            </div>

            {activeMissions.length === 0 ? (
              <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
                <p className="text-muted-foreground">No missions in this zone yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {activeMissions.map((mission, idx) => (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.08 }}
                    className={`relative p-5 rounded-[1.5rem] border-4 transition-all ${
                      mission.completed
                        ? "bg-green-50 border-green-200"
                        : `${activeZone.bgColor} ${activeZone.borderColor} shadow-xl hover:-translate-y-1`
                    }`}
                  >
                    {mission.completed && (
                      <div className="absolute -top-3 -right-3 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-3">
                      <DifficultyBadge difficulty={mission.difficulty} />
                      <div className="flex gap-1">
                        <span className="flex items-center gap-1 text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                          <Trophy className="w-3 h-3" /> {mission.xpReward}
                        </span>
                        <span className="flex items-center gap-1 text-xs font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 fill-yellow-500" /> {mission.starReward}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-lg font-display font-bold mb-1">{mission.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{mission.description}</p>

                    {!mission.completed ? (
                      <button
                        onClick={() => handleComplete(mission.id)}
                        disabled={completeMutation.isPending}
                        className={`w-full py-2.5 font-bold rounded-xl border-b-4 border-yellow-600 hover:border-b-0 hover:translate-y-1 transition-all text-sm bg-junior text-junior-foreground`}
                      >
                        Complete Mission ✨
                      </button>
                    ) : (
                      <button disabled className="w-full py-2.5 bg-green-100 text-green-700 font-bold rounded-xl flex justify-center items-center gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Completed!
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="zone-map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {zoneMissions.map(({ zone, missions: zMissions }, idx) => {
              const isUnlocked = childXp >= zone.xpRequired;
              const completedCount = zMissions.filter(m => m.completed).length;
              const totalCount = zMissions.length;

              return (
                <motion.div
                  key={zone.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  onClick={() => isUnlocked && activeChildId && setSelectedZone(zone.id)}
                  className={`relative p-6 rounded-[2rem] border-4 transition-all ${
                    isUnlocked
                      ? `${zone.bgColor} ${zone.borderColor} cursor-pointer hover:-translate-y-2 hover:shadow-xl`
                      : "bg-muted/30 border-muted-foreground/20 cursor-not-allowed opacity-60"
                  }`}
                >
                  {!isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-6 h-6 text-muted-foreground/50" />
                    </div>
                  )}

                  <div className="text-5xl mb-4">{zone.emoji}</div>
                  <h3 className={`text-xl font-display font-bold mb-1 ${isUnlocked ? zone.color : 'text-muted-foreground'}`}>
                    {zone.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">{zone.description}</p>

                  {isUnlocked ? (
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>{completedCount}/{totalCount} missions</span>
                        {totalCount > 0 && <span>{Math.round((completedCount / totalCount) * 100)}%</span>}
                      </div>
                      {totalCount > 0 && (
                        <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-current rounded-full transition-all"
                            style={{ width: `${(completedCount / totalCount) * 100}%`, color: zone.color.replace('text-', '') }}
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs font-bold text-muted-foreground">
                          {totalCount === 0 ? "No missions yet" : completedCount === totalCount ? "✅ All done!" : `${totalCount - completedCount} remaining`}
                        </span>
                        {activeChildId && (
                          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${zone.color} bg-white/60`}>
                            Enter →
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground font-medium">
                      🔒 Unlock at {zone.xpRequired} XP (need {zone.xpRequired - childXp} more)
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  );
}
