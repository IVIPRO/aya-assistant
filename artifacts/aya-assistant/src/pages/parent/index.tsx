import { Layout } from "@/components/layout";
import { useState } from "react";
import {
  useListChildren,
  useCreateChild,
  useDeleteChild,
  useUpdateChild,
  useListProgress,
  useListMemories,
  useCreateFamily,
  useGetFamily,
} from "@workspace/api-client-react";
import type { Child } from "@workspace/api-client-react";
import { Activity, BrainCircuit, Users, LineChart, Plus, Trash2, Pencil, Home } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

const childSchema = z.object({
  name: z.string().min(1, "Name is required"),
  grade: z.coerce.number().min(1).max(12),
  language: z.string().min(1, "Language is required"),
  country: z.string().min(1, "Country is required"),
});

const familySchema = z.object({
  name: z.string().min(1, "Family name is required"),
});

type ChildFormData = z.infer<typeof childSchema>;

export function ParentDashboard() {
  const [tab, setTab] = useState("children");
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const { refreshUser } = useAuth();

  const { data: family, refetch: refetchFamily } = useGetFamily({ query: { retry: false } });
  const { data: children = [], refetch: refetchChildren } = useListChildren({ query: { enabled: !!family } });
  const { data: memories = [] } = useListMemories();
  const { data: progress = [] } = useListProgress(
    { childId: children[0]?.id || 0 },
    { query: { enabled: children.length > 0 } }
  );

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
          <form onSubmit={familyForm.handleSubmit(onFamilySubmit)} className="flex gap-4 max-w-md">
            <input
              {...familyForm.register("name")}
              placeholder="Your family name (e.g. The Smiths)"
              className="flex-1 p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={createFamily.isPending}
              className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
            >
              {createFamily.isPending ? "Creating..." : "Create Family"}
            </button>
          </form>
          {familyForm.formState.errors.name && (
            <p className="text-destructive text-sm mt-2">{familyForm.formState.errors.name.message}</p>
          )}
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
                      <input type="number" {...childForm.register("grade")} placeholder="Grade (1-12)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                      {childForm.formState.errors.grade && <p className="text-destructive text-xs mt-1">{childForm.formState.errors.grade.message}</p>}
                    </div>
                    <div>
                      <input {...childForm.register("language")} placeholder="Language (e.g. English)" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
                    </div>
                    <div>
                      <input {...childForm.register("country")} placeholder="Country" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
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
            {children.map(child => (
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
                <p className="text-muted-foreground mb-4">Grade {child.grade} · {child.country}</p>
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">XP</span>
                    <span className="font-bold text-orange-600">{child.xp}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground">Stars</span>
                    <span className="font-bold text-yellow-600">{child.stars}</span>
                  </div>
                </div>
              </div>
            ))}
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
        <div className="bg-card p-6 md:p-8 rounded-[2rem] shadow-lg border border-border/50">
          <h2 className="text-2xl font-bold mb-6">Subject Performance</h2>
          {progress.length > 0 ? (
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={progress}>
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-10">Not enough data to display progress yet.</p>
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
            <input {...editForm.register("country")} placeholder="Country" className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            <button type="submit" disabled={updateChild.isPending} className="w-full bg-primary text-white p-3 rounded-xl font-bold hover:bg-primary/90">
              {updateChild.isPending ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
