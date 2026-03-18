import { Layout } from "@/components/layout";
import { Map, Star, Trophy, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useListMissions, useCompleteMission, getListMissionsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export function Missions() {
  const { activeChildId } = useAuth();
  const { toast } = useToast();

  const { data: missions = [], refetch } = useListMissions(
    { childId: activeChildId || 0 },
    { query: { queryKey: getListMissionsQueryKey({ childId: activeChildId || 0 }), enabled: !!activeChildId } }
  );
  const completeMutation = useCompleteMission();

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id });
      toast({
        title: "Mission Completed!",
        description: "You earned XP and Stars!",
      });
      refetch();
    } catch {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <Layout isJunior>
      <div className="mb-8">
        <Link href="/junior" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-bold mb-4 bg-white/50 px-4 py-2 rounded-xl">
          <ArrowLeft className="w-5 h-5" />
          Back to Chat
        </Link>
        <h1 className="text-4xl font-display font-bold text-junior-foreground flex items-center gap-3">
          <Map className="w-10 h-10" />
          Mission Map
        </h1>
      </div>

      {!activeChildId && (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
          <p className="text-muted-foreground text-lg">Select a child profile to view missions.</p>
        </div>
      )}

      {activeChildId && missions.length === 0 && (
        <div className="py-16 text-center bg-muted/20 rounded-3xl border border-dashed">
          <p className="text-muted-foreground text-lg">No missions yet. Add a child profile to get started!</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {missions.map((mission, idx) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className={`relative p-6 rounded-[2rem] border-4 transition-all ${
              mission.completed
                ? "bg-green-50 border-green-200"
                : "bg-white border-junior shadow-xl shadow-junior/20 hover:-translate-y-2"
            }`}
          >
            {mission.completed && (
              <div className="absolute -top-4 -right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center text-white border-4 border-white shadow-lg rotate-12">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            )}

            <div className="flex justify-between items-start mb-4">
              <span className="px-3 py-1 bg-muted rounded-full text-xs font-bold uppercase tracking-wider">
                {mission.subject}
              </span>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-sm font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                  <Trophy className="w-4 h-4" /> {mission.xpReward}
                </span>
                <span className="flex items-center gap-1 text-sm font-bold text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg">
                  <Star className="w-4 h-4 fill-yellow-500" /> {mission.starReward}
                </span>
              </div>
            </div>

            <h3 className="text-xl font-display font-bold mb-2">{mission.title}</h3>
            <p className="text-muted-foreground font-medium mb-6">{mission.description}</p>

            {!mission.completed ? (
              <button
                onClick={() => handleComplete(mission.id)}
                disabled={completeMutation.isPending}
                className="w-full py-3 bg-junior text-junior-foreground font-bold rounded-xl border-b-4 border-yellow-600 hover:border-b-0 hover:translate-y-1 transition-all"
              >
                Complete Mission
              </button>
            ) : (
              <button disabled className="w-full py-3 bg-green-100 text-green-700 font-bold rounded-xl flex justify-center items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Completed
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </Layout>
  );
}
