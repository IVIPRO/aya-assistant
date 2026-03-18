import { Layout } from "@/components/layout";
import { useState } from "react";
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, Circle, Clock, Calendar as CalendarIcon } from "lucide-react";
import { useListCalendarEvents, useListFamilyTasks, useCreateFamilyTask, useUpdateFamilyTask, useCreateCalendarEvent } from "@workspace/api-client-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Forms schemas based on api.schemas.ts
const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
});

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  startAt: z.string().min(1, "Date is required"),
  color: z.string().optional()
});

export function Family() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();
  
  const { data: events = [], refetch: refetchEvents } = useListCalendarEvents();
  const { data: tasks = [], refetch: refetchTasks } = useListFamilyTasks();
  
  const createTask = useCreateFamilyTask();
  const updateTask = useUpdateFamilyTask();
  const createEvent = useCreateCalendarEvent();

  const taskForm = useForm<z.infer<typeof taskSchema>>({ resolver: zodResolver(taskSchema), defaultValues: { priority: "medium" } });
  const eventForm = useForm<z.infer<typeof eventSchema>>({ resolver: zodResolver(eventSchema) });

  const onTaskSubmit = async (data: z.infer<typeof taskSchema>) => {
    try {
      await createTask.mutateAsync({ data });
      toast({ title: "Task added" });
      refetchTasks();
      taskForm.reset();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const onEventSubmit = async (data: z.infer<typeof eventSchema>) => {
    try {
      await createEvent.mutateAsync({ 
        data: { ...data, startAt: new Date(data.startAt).toISOString() } 
      });
      toast({ title: "Event added" });
      refetchEvents();
      eventForm.reset();
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const toggleTask = async (task: any) => {
    await updateTask.mutateAsync({ id: task.id, data: { completed: !task.completed } });
    refetchTasks();
  };

  // Calendar logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      const dayEvents = events.filter(e => isSameDay(new Date(e.startAt), cloneDay));
      
      days.push(
        <div 
          key={day.toString()} 
          className={`min-h-[80px] p-2 border border-border/30 ${
            !isSameMonth(day, monthStart) ? "bg-muted/10 text-muted-foreground" : "bg-card"
          } ${isSameDay(day, new Date()) ? "bg-family/5" : ""}`}
        >
          <div className="flex justify-between">
            <span className={`text-sm font-semibold ${isSameDay(day, new Date()) ? "w-6 h-6 bg-family text-white rounded-full flex items-center justify-center" : ""}`}>
              {formattedDate}
            </span>
          </div>
          <div className="mt-1 space-y-1">
            {dayEvents.map(e => (
              <div key={e.id} className="text-[10px] px-1 py-0.5 rounded bg-family/20 text-family-foreground font-semibold truncate" style={{ backgroundColor: e.color || undefined }}>
                {e.title}
              </div>
            ))}
          </div>
        </div>
      );
      day = addDays(day, 1);
    }
    rows.push(<div className="grid grid-cols-7" key={day.toString()}>{days}</div>);
    days = [];
  }

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Calendar */}
        <div className="flex-[2]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Family Calendar</h1>
              <p className="text-muted-foreground">Coordinate everyone's schedule</p>
            </div>
            
            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-family text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-family/20 hover:shadow-xl transition-all">
                  <Plus className="w-5 h-5" /> Event
                </button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Family Event</DialogTitle>
                </DialogHeader>
                <form onSubmit={eventForm.handleSubmit(onEventSubmit)} className="space-y-4 pt-4">
                  <div>
                    <label className="text-sm font-bold mb-1 block">Title</label>
                    <input {...eventForm.register("title")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-family" />
                  </div>
                  <div>
                    <label className="text-sm font-bold mb-1 block">Date</label>
                    <input type="datetime-local" {...eventForm.register("startAt")} className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-family" />
                  </div>
                  <button type="submit" disabled={createEvent.isPending} className="w-full bg-family text-white p-3 rounded-xl font-bold">
                    Save Event
                  </button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="bg-card rounded-3xl shadow-lg border border-border/50 overflow-hidden">
            <div className="p-4 flex justify-between items-center bg-muted/20 border-b border-border/50">
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-muted rounded-full">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-lg">{format(currentDate, "MMMM yyyy")}</h2>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-muted rounded-full">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 border-b border-border/50 bg-muted/10">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="p-2 text-center text-sm font-bold text-muted-foreground">{d}</div>
              ))}
            </div>
            <div className="flex flex-col">{rows}</div>
          </div>
        </div>

        {/* Right: Tasks */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Tasks & Chores</h2>
            <Dialog>
              <DialogTrigger asChild>
                <button className="bg-foreground text-background w-10 h-10 rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
                <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-4 pt-4">
                  <input {...taskForm.register("title")} placeholder="Task title" className="w-full p-3 rounded-xl border" />
                  <textarea {...taskForm.register("description")} placeholder="Details (optional)" className="w-full p-3 rounded-xl border h-20" />
                  <select {...taskForm.register("priority")} className="w-full p-3 rounded-xl border">
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  <button type="submit" disabled={createTask.isPending} className="w-full bg-foreground text-background p-3 rounded-xl font-bold">Save Task</button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {tasks.length === 0 ? (
              <div className="bg-card p-8 rounded-3xl border border-dashed flex flex-col items-center text-center text-muted-foreground">
                <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                <p>All caught up!</p>
              </div>
            ) : (
              tasks.map(task => (
                <div key={task.id} className={`bg-card p-4 rounded-2xl border flex gap-3 transition-all ${task.completed ? 'opacity-60' : 'hover:shadow-md'}`}>
                  <button onClick={() => toggleTask(task)} className="mt-1 shrink-0">
                    {task.completed ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <Circle className="w-6 h-6 text-muted-foreground" />}
                  </button>
                  <div>
                    <h4 className={`font-bold ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.title}</h4>
                    {task.description && <p className="text-sm text-muted-foreground mt-1">{task.description}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        task.priority === 'high' ? 'bg-red-100 text-red-700' :
                        task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
