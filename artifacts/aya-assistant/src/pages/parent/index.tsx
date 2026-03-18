import { Layout } from "@/components/layout";
import { useState } from "react";
import {
  useListChildren,
  useCreateChild,
  useDeleteChild,
  useUpdateChild,
  useListProgress,
  useListMissions,
  useListMemories,
  useCreateFamily,
  useGetFamily,
  getGetFamilyQueryKey,
  getListChildrenQueryKey,
  getListProgressQueryKey,
  getListMissionsQueryKey,
} from "@workspace/api-client-react";
import type { Child, Badge } from "@workspace/api-client-react";
import { Activity, BrainCircuit, Users, LineChart, Plus, Trash2, Pencil, Home, Clock, Award, TrendingUp, TrendingDown, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const ZONE_ORDER = ["Math Island", "Reading Forest", "Logic Mountain", "English City", "Science Planet"];

const COMPANION_DATA: Record<string, { emoji: string; name: string; tone: string; color: string; accentColor: string }> = {
  panda: { emoji: "🐼", name: "AYA Panda", tone: "gentle", color: "bg-green-50 border-green-200", accentColor: "text-green-700" },
  robot: { emoji: "🤖", name: "AYA Robot", tone: "encouraging", color: "bg-blue-50 border-blue-200", accentColor: "text-blue-700" },
  fox:   { emoji: "🦊", name: "AYA Fox",   tone: "playful",    color: "bg-orange-50 border-orange-200", accentColor: "text-orange-700" },
  owl:   { emoji: "🦉", name: "AYA Owl",   tone: "calm",       color: "bg-purple-50 border-purple-200", accentColor: "text-purple-700" },
};

const ZONE_EMOJIS: Record<string, string> = {
  "Math Island": "🏝️",
  "Reading Forest": "🌲",
  "Logic Mountain": "⛰️",
  "English City": "🏙️",
  "Science Planet": "🌍",
};

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade: z.coerce.number().min(1).max(12),
  language: z.string().min(1, "Language is required"),
  country: z.string().min(1, "Country is required"),
});

const familySchema = z.object({
  name: z.string().min(1, "Family name is required"),
  country: z.string().min(1, "Country is required"),
  language: z.string().min(1, "Language is required"),
});

type ChildFormData = z.infer<typeof childSchema>;

const COMPANION_CHARS = [
  { id: "panda", emoji: "🐼", name: "AYA Panda", desc: "Patient and gentle", tone: "gentle", color: "bg-green-100 border-green-300", accentColor: "text-green-700" },
  { id: "robot", emoji: "🤖", name: "AYA Robot", desc: "Logical and precise", tone: "encouraging", color: "bg-blue-100 border-blue-300", accentColor: "text-blue-700" },
  { id: "fox",   emoji: "🦊", name: "AYA Fox",   desc: "Creative and playful", tone: "playful",    color: "bg-orange-100 border-orange-300", accentColor: "text-orange-700" },
  { id: "owl",   emoji: "🦉", name: "AYA Owl",   desc: "Wise and thoughtful", tone: "calm",       color: "bg-purple-100 border-purple-300", accentColor: "text-purple-700" },
];

function getLevel(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

function getCurrentZone(xp: number): { name: string; emoji: string } {
  if (xp >= 250) return { name: "Science Planet", emoji: "🌍" };
  if (xp >= 150) return { name: "English City", emoji: "🏙️" };
  if (xp >= 80) return { name: "Logic Mountain", emoji: "⛰️" };
  if (xp >= 30) return { name: "Reading Forest", emoji: "🌲" };
  return { name: "Math Island", emoji: "🏝️" };
}

function getMissionZone(mission: { zone?: string | null; subject: string }): string {
  if (mission.zone) return mission.zone;
  const subj = mission.subject.toLowerCase();
  if (subj.includes("math") || subj.includes("матем") || subj.includes("maths")) return "Math Island";
  if (subj.includes("read") || subj.includes("четен") || subj.includes("deutsch") || subj.includes("lengua")) return "Reading Forest";
  if (subj.includes("logic") || subj.includes("логика")) return "Logic Mountain";
  if (subj.includes("english") || subj.includes("английски") || subj.includes("englisch") || subj.includes("inglés")) return "English City";
  return "Science Planet";
}

export function ParentDashboard() {
  const [tab, setTab] = useState("children");
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedChildId, setSelectedChildId] = useState<number | null>(null);
  const [companionPickerChild, setCompanionPickerChild] = useState<Child | null>(null);
  const [companionPickerOpen, setCompanionPickerOpen] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const { data: family, refetch: refetchFamily } = useGetFamily({ query: { queryKey: getGetFamilyQueryKey(), retry: false } });
  const { data: children = [], refetch: refetchChildren } = useListChildren({ query: { queryKey: getListChildrenQueryKey(), enabled: !!family } });
  const { data: memories = [] } = useListMemories();

  const progressChildId = selectedChildId ?? children[0]?.id ?? 0;
  const { data: progress = [] } = useListProgress(
    { childId: progressChildId },
    { query: { queryKey: getListProgressQueryKey({ childId: progressChildId }), enabled: children.length > 0 && progressChildId > 0 } }
  );
  const { data: missions = [] } = useListMissions(
    { childId: progressChildId },
    { query: { queryKey: getListMissionsQueryKey({ childId: progressChildId }), enabled: children.length > 0 && progressChildId > 0 } }
  );

  const progressChild = children.find(c => c.id === progressChildId);

  const createChild = useCreateChild();
  const deleteChild = useDeleteChild();
  const updateChild = useUpdateChild();
  const createFamily = useCreateFamily();

  const childForm = useForm<ChildFormData>({ resolver: zodResolver(childSchema) });
  const editForm = useForm<ChildFormData>({ resolver: zodResolver(childSchema) });
  const familyForm = useForm<z.infer<typeof familySchema>>({ resolver: zodResolver(familySchema) });

  const onChildSubmit = async (data: ChildFormData) => {
    try {
      await createChild.mutateAsync({ data });
      toast({ title: "Child added successfully" });
      refetchChildren();
      childForm.reset();
    } catch {
      toast({ title: "Error adding child", variant: "destructive" });
    }
  };

  const onEditSubmit = async (data: ChildFormData) => {
    if (!editingChild) return;
    try {
      await updateChild.mutateAsync({ id: editingChild.id, data });
      toast({ title: "Profile updated" });
      refetchChildren();
      setEditDialogOpen(false);
      setEditingChild(null);
    } catch {
      toast({ title: "Error updating child", variant: "destructive" });
    }
  };

  const handleDeleteChild = async (id: number) => {
    if (!confirm("Remove this child profile?")) return;
    try {
      await deleteChild.mutateAsync({ id });
      refetchChildren();
      toast({ title: "Child profile removed" });
    } catch {
      toast({ title: "Error removing child", variant: "destructive" });
    }
  };

  const openEditDialog = (child: Child) => {
    setEditingChild(child);
    editForm.reset({ name: child.name, grade: child.grade, language: child.language, country: child.country });
    setEditDialogOpen(true);
  };

  const openCompanionPicker = (child: Child) => {
    setCompanionPickerChild(child);
    setCompanionPickerOpen(true);
  };

  const handleSelectCompanion = async (charId: string) => {
    if (!companionPickerChild) return;
    try {
      await updateChild.mutateAsync({ id: companionPickerChild.id, data: { aiCharacter: charId as "panda" | "robot" | "fox" | "owl" } });
      toast({ title: "Companion updated!", description: `${COMPANION_CHARS.find(c => c.id === charId)?.name} is now ${companionPickerChild.name}'s companion.` });
      refetchChildren();
      setCompanionPickerOpen(false);
      setCompanionPickerChild(null);
    } catch {
      toast({ title: "Error updating companion", variant: "destructive" });
    }
  };

  const onFamilySubmit = async (data: z.infer<typeof familySchema>) => {
    try {
      await createFamily.mutateAsync({ data });
      toast({ title: "Family created!", description: "You can now add children to your family." });
      await refetchFamily();
      await refreshUser();
      familyForm.reset();
    } catch {
      toast({ title: "Error creating family", variant: "destructive" });
    }
  };

  const completedMissions = missions.filter(m => m.completed);
  const pendingMissions = missions.filter(m => !m.completed);

  const totalLearningMinutes = (() => {
    const withTimestamps = completedMissions
      .filter(m => m.completedAt != null)
      .sort((a, b) => new Date(a.completedAt!).getTime() - new Date(b.completedAt!).getTime());
    if (withTimestamps.length === 0) return completedMissions.length * 5;

    const SESSION_GAP_MS = 30 * 60 * 1000;
    const MIN_PER_MISSION = 5;
    let totalMinutes = 0;
    let sessionStart = new Date(withTimestamps[0].completedAt!).getTime();
    let sessionLast = sessionStart;
    let sessionCount = 1;

    for (let i = 1; i < withTimestamps.length; i++) {
      const t = new Date(withTimestamps[i].completedAt!).getTime();
      if (t - sessionLast <= SESSION_GAP_MS) {
        sessionLast = t;
        sessionCount++;
      } else {
        const sessionSpanMin = Math.round((sessionLast - sessionStart) / 60000);
        totalMinutes += Math.max(sessionSpanMin + MIN_PER_MISSION, sessionCount * MIN_PER_MISSION);
        sessionStart = t;
        sessionLast = t;
        sessionCount = 1;
      }
    }
    const sessionSpanMin = Math.round((sessionLast - sessionStart) / 60000);
    totalMinutes += Math.max(sessionSpanMin + MIN_PER_MISSION, sessionCount * MIN_PER_MISSION);
    return totalMinutes;
  })();

  const subjectScores: Record<string, { total: number; count: number }> = {};
  for (const p of progress) {
    if (!subjectScores[p.subject]) subjectScores[p.subject] = { total: 0, count: 0 };
    subjectScores[p.subject].total += p.score;
    subjectScores[p.subject].count += 1;
  }
  const avgBySubject = Object.entries(subjectScores).map(([subject, { total, count }]) => ({
    subject,
    score: Math.round(total / count),
  })).sort((a, b) => b.score - a.score);

  const strengths = avgBySubject.slice(0, 2);
  const weaknesses = avgBySubject.slice(-2).reverse().filter(s => s.score < 70);

  const unlockedZones = ZONE_ORDER.filter(zoneName => {
    const zone = { "Math Island": 0, "Reading Forest": 30, "Logic Mountain": 80, "English City": 150, "Science Planet": 250 };
    return (progressChild?.xp ?? 0) >= zone[zoneName as keyof typeof zone];
  });

  const badges = (progressChild?.badgesEarned ?? []) as Badge[];

  const tabs = [
    { id: "children", label: "Children Profiles", icon: Users },
    { id: "progress", label: "Learning Progress", icon: LineChart },
    { id: "memories", label: "Memory Engine", icon: BrainCircuit },
  ];

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-4xl font-display font-bold text-foreground">Parent Control Panel</h1>
        <p className="text-muted-foreground mt-2">Manage profiles, monitor progress, and review AI insights.</p>
      </div>

      {!family && (
        <div className="bg-card p-8 rounded-[2rem] shadow-lg border border-border/50 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Create Your Family</h2>
              <p className="text-muted-foreground">Set up your family profile to start adding children.</p>
            </div>
          </div>
          <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="space-y-4 max-w-md">
            <div>
              <input
                {...familyForm.register("name")}
                placeholder="Family name (e.g. The Smiths)"
                className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {familyForm.formState.errors.name && (
                <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.name.message}</p>
              )}
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  {...familyForm.register("country")}
                  placeholder="Country (e.g. USA)"
                  className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {familyForm.formState.errors.country && (
                  <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.country.message}</p>
                )}
              </div>
              <div className="flex-1">
                <input
                  {...familyForm.register("language")}
                  placeholder="Language (e.g. English)"
                  className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                {familyForm.formState.errors.language && (
                  <p className="text-destructive text-sm mt-1">{familyForm.formState.errors.language.message}</p>
                )}
              </div>
            </div>
            <button
              type="submit"
              disabled={createFamily.isPending}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              {createFamily.isPending ? "Creating..." : "Create Family"}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 border-b border-border/50 mb-8 overflow-x-auto hide-scrollbar">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-4 font-bold border-b-2 transition-all shrink-0 ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <t.icon className="w-5 h-5" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "children" && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Child Profiles</h2>
            {family && (
              <Dialog>
                <DialogTrigger asChild>
                  <button className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all">
                    <Plus className="w-5 h-5" /> Add Child
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add New Profile</DialogTitle></DialogHeader>
                  <form onSubmit={childForm.handleSubmit(onChildSubmit)} className="space-y-4 pt-4">
                    <div>
                      <input {...childForm.register("name")} placeholder="Child's name" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {childForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{childForm.formState.errors.name.message}</p>}
                    </div>
                    <div>
                      <input type="number" {...childForm.register("grade")} placeholder="Grade (1-4 for Junior)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {childForm.formState.errors.grade && <p className="text-destructive text-xs mt-1">{childForm.formState.errors.grade.message}</p>}
                    </div>
                    <div>
                      <input {...childForm.register("language")} placeholder="Language (e.g. English, Bulgarian)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <input {...childForm.register("country")} placeholder="Country (e.g. USA, BG, DE, ES, GB)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      <p className="text-xs text-muted-foreground mt-1">Used to set the right curriculum for your child</p>
                    </div>
                    <button type="submit" disabled={createChild.isPending} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90">
                      {createChild.isPending ? "Saving..." : "Save Profile"}
                    </button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {children.map(child => {
              const childBadges = (child.badgesEarned ?? []) as Badge[];
              const level = getLevel(child.xp);
              return (
                <div key={child.id} className="bg-card p-6 rounded-[2rem] shadow-lg border border-border/50 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEditDialog(child)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteChild(child.id)}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl flex items-center justify-center text-3xl mb-4">
                    {child.avatar || "👦"}
                  </div>
                  <h3 className="text-xl font-bold">{child.name}</h3>
                  <p className="text-muted-foreground mb-2">Grade {child.grade} · {child.country}</p>
                  {child.aiCharacter && COMPANION_DATA[child.aiCharacter] ? (
                    <div className={`flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border ${COMPANION_DATA[child.aiCharacter].color}`}>
                      <span className="text-2xl">{COMPANION_DATA[child.aiCharacter].emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm">{COMPANION_DATA[child.aiCharacter].name}</div>
                        <div className={`text-[10px] font-semibold uppercase tracking-wider ${COMPANION_DATA[child.aiCharacter].accentColor}`}>
                          {COMPANION_DATA[child.aiCharacter].tone} style · AI Companion
                        </div>
                      </div>
                      <button
                        onClick={() => openCompanionPicker(child)}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/60 transition-colors"
                        title="Change companion"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => openCompanionPicker(child)}
                      className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/40 hover:bg-primary/5 transition-all w-full text-left"
                    >
                      <Sparkles className="w-4 h-4 text-muted-foreground/50" />
                      <span className="text-xs text-muted-foreground italic">No companion selected yet — tap to choose</span>
                    </button>
                  )}
                  <div className="flex gap-4 mb-3">
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Level</span>
                      <span className="font-bold text-primary">{level}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">XP</span>
                      <span className="font-bold text-orange-600">{child.xp}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Stars</span>
                      <span className="font-bold text-yellow-600">{child.stars}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">Badges</span>
                      <span className="font-bold text-purple-600">{childBadges.length}</span>
                    </div>
                  </div>
                  {childBadges.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {childBadges.slice(0, 5).map(b => (
                        <span key={b.id} title={b.title} className="text-lg">{b.icon}</span>
                      ))}
                      {childBadges.length > 5 && (
                        <span className="text-xs text-muted-foreground">+{childBadges.length - 5}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            {children.length === 0 && family && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-3xl border border-dashed">
                No child profiles yet. Click "Add Child" to get started!
              </div>
            )}
            {!family && (
              <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-3xl border border-dashed">
                Create your family first to add children.
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "progress" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Learning Progress</h2>
            {children.length > 1 && (
              <select
                value={progressChildId}
                onChange={(e) => setSelectedChildId(Number(e.target.value))}
                className="p-2 rounded-xl border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {children.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
            {children.length === 1 && children[0] && (
              <span className="text-sm text-muted-foreground font-medium">{children[0].name}</span>
            )}
          </div>

          {progressChild && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-primary">{getLevel(progressChild.xp)}</div>
                <div className="text-sm text-muted-foreground mt-1">Level</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-orange-500">{progressChild.xp}</div>
                <div className="text-sm text-muted-foreground mt-1">Total XP</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-yellow-500">{progressChild.stars}</div>
                <div className="text-sm text-muted-foreground mt-1">Stars</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-3xl font-bold text-green-500">{completedMissions.length}</div>
                <div className="text-sm text-muted-foreground mt-1">Missions Done</div>
              </div>
              <div className="bg-card p-4 rounded-2xl border shadow-sm text-center">
                <div className="text-2xl font-bold">{getCurrentZone(progressChild.xp).emoji}</div>
                <div className="text-xs font-bold text-foreground mt-0.5 leading-tight">{getCurrentZone(progressChild.xp).name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">Current Zone</div>
              </div>
            </div>
          )}

          {progressChild && progressChild.aiCharacter && COMPANION_DATA[progressChild.aiCharacter] && (
            <div className={`flex items-start gap-4 p-4 rounded-2xl border ${COMPANION_DATA[progressChild.aiCharacter].color}`}>
              <span className="text-4xl">{COMPANION_DATA[progressChild.aiCharacter].emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold">{COMPANION_DATA[progressChild.aiCharacter].name}</div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${COMPANION_DATA[progressChild.aiCharacter].accentColor}`}>
                  {COMPANION_DATA[progressChild.aiCharacter].tone} teaching style · Montessori AI Companion
                </div>
                <p className="text-xs text-muted-foreground">
                  {progressChild.name}'s selected learning companion for all Junior modules. The companion adapts questions and encouragement to guide discovery.
                </p>
              </div>
            </div>
          )}

          {completedMissions.length > 0 && (
            <div className="bg-card p-5 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4" /> Recent Mission Activity
              </h3>
              <div className="space-y-2">
                {completedMissions.slice(-3).reverse().map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-green-500">✅</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject}</p>
                    </div>
                    {m.completedAt && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(m.completedAt as string).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(strengths.length > 0 || weaknesses.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {strengths.length > 0 && (
                <div className="bg-green-50 p-5 rounded-2xl border border-green-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-green-700">
                    <TrendingUp className="w-5 h-5" /> Subject Strengths
                  </h3>
                  {strengths.map(s => (
                    <div key={s.subject} className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">{s.subject}</span>
                      <span className="text-sm font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
              {weaknesses.length > 0 && (
                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
                  <h3 className="font-bold mb-3 flex items-center gap-2 text-orange-700">
                    <TrendingDown className="w-5 h-5" /> Needs Practice
                  </h3>
                  {weaknesses.map(s => (
                    <div key={s.subject} className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-orange-800">{s.subject}</span>
                      <span className="text-sm font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{s.score}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="bg-card p-6 rounded-2xl border shadow-sm">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              🗺️ Unlocked Learning Zones
            </h3>
            <div className="flex flex-wrap gap-3">
              {ZONE_ORDER.map(zoneName => {
                const isUnlocked = unlockedZones.includes(zoneName);
                return (
                  <div
                    key={zoneName}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${
                      isUnlocked ? 'bg-green-50 border-green-200 text-green-700' : 'bg-muted/50 border-muted text-muted-foreground opacity-60'
                    }`}
                  >
                    <span>{ZONE_EMOJIS[zoneName]}</span>
                    <span>{zoneName}</span>
                    {isUnlocked ? <span>✅</span> : <span>🔒</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {badges.length > 0 && (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-yellow-500" /> Earned Badges ({badges.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {badges.map(badge => (
                  <div key={badge.id} className="flex flex-col items-center gap-1 p-3 bg-yellow-50 rounded-xl border border-yellow-200 min-w-[72px] text-center">
                    <span className="text-2xl">{badge.icon}</span>
                    <span className="text-xs font-bold">{badge.title}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(badge.earnedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {progress.length > 0 ? (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4">Subject Performance Chart</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={avgBySubject}>
                    <XAxis dataKey="subject" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10 bg-card rounded-2xl border">Not enough progress data yet. Encourage your child to complete missions!</p>
          )}

          {missions.length > 0 && (
            <div className="bg-card p-6 rounded-2xl border shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5" /> Mission Activity
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {completedMissions.slice(-10).reverse().map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                    <span className="text-green-500 text-lg">✅</span>
                    <div>
                      <p className="text-sm font-medium">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject} · {m.completedAt ? new Date(m.completedAt as string).toLocaleDateString() : ''}</p>
                    </div>
                  </div>
                ))}
                {pendingMissions.slice(0, 4).map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                    <span className="text-muted-foreground text-lg">⏳</span>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{m.title}</p>
                      <p className="text-xs text-muted-foreground">{m.subject} · Pending</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "memories" && (
        <div>
          <div className="flex items-center gap-3 mb-6 bg-gradient-to-r from-psychology/20 to-transparent p-4 rounded-2xl">
            <BrainCircuit className="w-8 h-8 text-psychology" />
            <div>
              <h2 className="text-xl font-bold">AI Family Memory Engine</h2>
              <p className="text-sm text-muted-foreground">Insights learned from family interactions.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memories.map(mem => (
              <div key={mem.id} className="bg-card p-5 rounded-2xl border shadow-sm flex items-start gap-4">
                <div className="w-2 min-h-[2rem] bg-psychology rounded-full shrink-0" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-muted px-2 py-1 rounded-md">
                      {mem.type.replace('_', ' ')}
                    </span>
                    {mem.module && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        via {mem.module}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground">{mem.content}</p>
                  <p className="text-xs text-muted-foreground mt-3">{new Date(mem.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {memories.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                The Memory Engine is gathering insights...
              </div>
            )}
          </div>
        </div>
      )}

      <Dialog open={companionPickerOpen} onOpenChange={setCompanionPickerOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Choose a Learning Companion</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground -mt-2 mb-4">
            {companionPickerChild ? `Select a companion for ${companionPickerChild.name}` : "Select a companion"}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {COMPANION_CHARS.map(char => {
              const isSelected = companionPickerChild?.aiCharacter === char.id;
              return (
                <button
                  key={char.id}
                  onClick={() => handleSelectCompanion(char.id)}
                  disabled={updateChild.isPending}
                  className={`p-4 rounded-2xl border-2 transition-all hover:scale-[1.02] hover:shadow-md text-left ${
                    isSelected ? 'ring-2 ring-primary/50 border-primary shadow-md' : 'border-transparent hover:border-primary/30'
                  } ${char.color}`}
                >
                  <div className="text-4xl mb-2">{char.emoji}</div>
                  <div className="font-bold text-sm">{char.name}</div>
                  <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${char.accentColor}`}>{char.tone} tone</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{char.desc}</div>
                  {isSelected && (
                    <div className="mt-2 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-block">✓ Current</div>
                  )}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCompanionPickerOpen(false)}
            className="mt-2 w-full py-2 text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            Cancel
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Child Profile</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
            <div>
              <input {...editForm.register("name")} placeholder="Child's name" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {editForm.formState.errors.name && <p className="text-destructive text-xs mt-1">{editForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <input type="number" {...editForm.register("grade")} placeholder="Grade (1-12)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
              {editForm.formState.errors.grade && <p className="text-destructive text-xs mt-1">{editForm.formState.errors.grade.message}</p>}
            </div>
            <input {...editForm.register("language")} placeholder="Language (e.g. English)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <input {...editForm.register("country")} placeholder="Country (e.g. USA, BG, DE, ES, GB)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <button type="submit" disabled={updateChild.isPending} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90">
              {updateChild.isPending ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
