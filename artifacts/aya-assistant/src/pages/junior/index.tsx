import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { Link } from "wouter";
import { Star, Trophy, Map, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, useUpdateChild, getListChildrenQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import type { Badge, Child } from "@workspace/api-client-react";

const CHARACTERS = [
  { id: "panda", name: "Panda Teacher", emoji: "🐼", color: "bg-green-100 border-green-300", desc: "Patient and gentle" },
  { id: "robot", name: "Robot Guide", emoji: "🤖", color: "bg-blue-100 border-blue-300", desc: "Logical and precise" },
  { id: "fox", name: "Fox Mentor", emoji: "🦊", color: "bg-orange-100 border-orange-300", desc: "Creative and playful" },
  { id: "owl", name: "Owl Professor", emoji: "🦉", color: "bg-purple-100 border-purple-300", desc: "Wise and thoughtful" },
];

function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getLevelProgress(xp: number): number {
  return xp % 100;
}

function CharacterPicker({ child, onSelect, onClose }: { child: Child; onSelect: (char: string) => void; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-display font-bold mb-2 text-center">Choose Your Learning Companion!</h2>
        <p className="text-muted-foreground text-center mb-6">Your companion will guide you through every mission 🎓</p>
        <div className="grid grid-cols-2 gap-4">
          {CHARACTERS.map(char => (
            <button
              key={char.id}
              onClick={() => onSelect(char.id)}
              className={`p-4 rounded-2xl border-2 transition-all hover:scale-105 hover:shadow-lg ${child.aiCharacter === char.id ? 'border-junior shadow-lg ring-2 ring-junior/50' : 'border-transparent hover:border-junior/50'} ${char.color}`}
            >
              <div className="text-5xl mb-2">{char.emoji}</div>
              <div className="font-bold text-sm">{char.name}</div>
              <div className="text-xs text-muted-foreground">{char.desc}</div>
              {child.aiCharacter === char.id && (
                <div className="mt-2 text-xs font-bold text-junior-foreground bg-junior px-2 py-1 rounded-full">Current</div>
              )}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="mt-6 w-full py-2 text-muted-foreground hover:text-foreground font-medium transition-colors">
          Cancel
        </button>
      </motion.div>
    </motion.div>
  );
}

function BadgesPanel({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        Complete missions to earn badges! 🏅
      </div>
    );
  }
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {badges.map(badge => (
        <motion.div
          key={badge.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-1 p-2 bg-white rounded-xl border border-yellow-200 shadow-sm min-w-[64px]"
          title={badge.description}
        >
          <span className="text-2xl">{badge.icon}</span>
          <span className="text-[10px] font-bold text-center leading-tight">{badge.title}</span>
        </motion.div>
      ))}
    </div>
  );
}

export function Junior() {
  const { activeChildId, setActiveChildId } = useAuth();
  const { toast } = useToast();
  const [showCharPicker, setShowCharPicker] = useState(false);

  const { data: children = [], refetch } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const updateChild = useUpdateChild();

  if (!activeChildId && children.length > 0) {
    setActiveChildId(children[0].id);
  }

  const activeChild = children.find(c => c.id === activeChildId) ?? null;
  const character = activeChild?.aiCharacter ?? null;
  const currentChar = CHARACTERS.find(c => c.id === character);

  const level = getLevel(activeChild?.xp ?? 0);
  const levelProgress = getLevelProgress(activeChild?.xp ?? 0);
  const badges = (activeChild?.badgesEarned ?? []) as Badge[];

  const handleSelectCharacter = async (charId: string) => {
    if (!activeChildId) return;
    try {
      await updateChild.mutateAsync({ id: activeChildId, data: { aiCharacter: charId } });
      await refetch();
      setShowCharPicker(false);
      toast({ title: "Companion selected!", description: `${CHARACTERS.find(c => c.id === charId)?.name} is ready to help you learn!` });
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
          <CharacterPicker
            child={activeChild}
            onSelect={handleSelectCharacter}
            onClose={() => setShowCharPicker(false)}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={`${import.meta.env.BASE_URL}images/junior-mascot.png`}
              alt="AYA Junior Mascot"
              className="w-14 h-14 object-contain drop-shadow-md animate-bounce"
              style={{ animationDuration: "3s" }}
            />
            {character && (
              <div className="absolute -bottom-1 -right-1 text-xl">{currentChar?.emoji}</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-junior-foreground">
              Hi, {activeChild?.name || "Explorer"}! 👋
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-junior-foreground/70 font-medium">Level {level}</span>
              <div className="w-24 h-2 bg-yellow-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{levelProgress}/100 XP</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap justify-center">
          <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-yellow-200 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-yellow-600">{activeChild?.stars || 0}</span>
          </div>
          <div className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-orange-200 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-orange-400 fill-orange-400" />
            <span className="font-bold text-orange-600">{activeChild?.xp || 0} XP</span>
          </div>
          <button
            onClick={() => setShowCharPicker(true)}
            className="bg-white px-3 py-2 rounded-2xl shadow-sm border border-purple-200 flex items-center gap-1.5 hover:bg-purple-50 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-bold text-purple-600">
              {currentChar?.emoji ?? "👤"} {currentChar?.name ?? "Choose Companion"}
            </span>
          </button>
          <Link href="/junior/world">
            <button className="bg-junior text-junior-foreground px-3 py-2 rounded-2xl shadow-md border-b-4 border-yellow-600 hover:translate-y-1 hover:border-b-0 transition-all font-bold flex items-center gap-1.5">
              <Map className="w-4 h-4" />
              World Map
            </button>
          </Link>
        </div>
      </div>

      {children.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
          {children.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveChildId(c.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-bold whitespace-nowrap ${activeChildId === c.id ? 'bg-junior text-junior-foreground shadow-sm' : 'bg-white/50 text-muted-foreground hover:bg-white'}`}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {badges.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 bg-white/60 backdrop-blur-md rounded-2xl p-4 border border-yellow-200/50 shadow-sm"
        >
          <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            🏅 My Badges
          </h3>
          <BadgesPanel badges={badges} />
        </motion.div>
      )}

      <Chat
        module="junior"
        themeColor="junior"
        character={character}
        greeting={greeting}
      />
    </Layout>
  );
}
