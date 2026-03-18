import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Smile, BookOpen, CalendarHeart, HeartHandshake, ArrowRight, UserPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useGetFamily, useListChildren } from "@workspace/api-client-react";
import { useAuth as useLocalAuth } from "@/hooks/use-auth";

export function Dashboard() {
  const { user } = useLocalAuth();
  const { data: family } = useGetFamily({ query: { retry: false } });
  const { data: children = [] } = useListChildren({ query: { enabled: !!family } });

  const modules = [
    {
      id: "junior",
      title: "AYA Junior",
      desc: "Playful learning & missions for kids (Grades 1-4)",
      icon: Smile,
      color: "bg-junior text-junior-foreground",
      link: "/junior",
      delay: 0.1
    },
    {
      id: "student",
      title: "AYA Student",
      desc: "Smart study companion & homework help",
      icon: BookOpen,
      color: "bg-student text-student-foreground",
      link: "/student",
      delay: 0.2
    },
    {
      id: "family",
      title: "AYA Family",
      desc: "Shared calendar, tasks & household coordination",
      icon: CalendarHeart,
      color: "bg-family text-family-foreground",
      link: "/family",
      delay: 0.3
    },
    {
      id: "psychology",
      title: "AYA Psychology",
      desc: "Warm emotional support & thoughtful conversations",
      icon: HeartHandshake,
      color: "bg-psychology text-psychology-foreground",
      link: "/psychology",
      delay: 0.4
    }
  ];

  return (
    <Layout>
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground">
          Good morning, {user?.name?.split(" ")[0]}! ☀️
        </h1>
        <p className="mt-3 text-lg text-muted-foreground max-w-2xl">
          Welcome to your family's command center. Where would you like to go today?
        </p>
      </div>

      {!family && user?.role === "parent" && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border border-primary/20 rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4"
        >
          <div>
            <h3 className="text-xl font-bold text-foreground">Set up your Family</h3>
            <p className="text-muted-foreground mt-1">Create a family profile to add children and share calendars.</p>
          </div>
          <Link href="/parent" className="px-6 py-3 bg-primary text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all shrink-0">
            Go to Settings
          </Link>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.id} href={m.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: m.delay }}
                className="group relative bg-card p-8 rounded-[2rem] shadow-lg shadow-black/5 border border-border/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 transition-transform duration-500 group-hover:scale-150 ${m.color.split(' ')[0]}`} />
                
                <div className="flex items-start justify-between relative z-10">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mb-6 transform transition-transform group-hover:scale-110 group-hover:rotate-3 ${m.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-foreground group-hover:text-background transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
                
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">{m.title}</h2>
                <p className="text-muted-foreground">{m.desc}</p>
              </motion.div>
            </Link>
          );
        })}
      </div>

      {children.length > 0 && (
        <div className="mt-12">
          <h3 className="text-xl font-bold mb-4">Quick switch child</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
            {children.map(child => (
              <div key={child.id} className="bg-card px-4 py-3 rounded-2xl shadow-sm border border-border flex items-center gap-3 shrink-0 cursor-pointer hover:border-primary transition-colors">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-xl">
                  {child.avatar || "👦"}
                </div>
                <div>
                  <p className="font-bold text-sm">{child.name}</p>
                  <p className="text-xs text-muted-foreground">Grade {child.grade}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
