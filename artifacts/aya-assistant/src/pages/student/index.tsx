import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { useState } from "react";
import { Calculator, Book, Beaker, Globe, Palette } from "lucide-react";
import { motion } from "framer-motion";

export function Student() {
  const [subject, setSubject] = useState<string>("General");

  const subjects = [
    { id: "Math", icon: Calculator, color: "text-blue-500", bg: "bg-blue-100" },
    { id: "Science", icon: Beaker, color: "text-green-500", bg: "bg-green-100" },
    { id: "Language", icon: Book, color: "text-purple-500", bg: "bg-purple-100" },
    { id: "History", icon: Globe, color: "text-orange-500", bg: "bg-orange-100" },
    { id: "Art", icon: Palette, color: "text-pink-500", bg: "bg-pink-100" },
  ];

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6">
        <div className="flex items-center gap-4">
           <img 
            src={`${import.meta.env.BASE_URL}images/student-mascot.png`} 
            alt="Student Mascot" 
            className="w-16 h-16 object-contain rounded-2xl shadow-sm"
          />
          <div>
            <h1 className="text-3xl font-display font-bold text-student">Study Assistant</h1>
            <p className="text-muted-foreground">Get help with homework and explanations</p>
          </div>
        </div>
      </div>

      <div className="mb-6 flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {subjects.map(s => {
          const Icon = s.icon;
          const isActive = subject === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setSubject(s.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all shrink-0 ${
                isActive 
                  ? `${s.bg} border-transparent shadow-sm font-bold text-foreground` 
                  : `bg-card border-border/50 text-muted-foreground hover:bg-muted`
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? s.color : ''}`} />
              {s.id}
            </button>
          )
        })}
      </div>

      <motion.div
        key={subject}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Chat 
          module="student" 
          themeColor="student" 
          greeting={`I'm ready to help with ${subject}. What are we working on today?`} 
        />
      </motion.div>
    </Layout>
  );
}
