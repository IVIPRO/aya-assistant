import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { Link } from "wouter";
import { Star, Trophy, Map } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren } from "@workspace/api-client-react";

export function Junior() {
  const { activeChildId, setActiveChildId } = useAuth();
  const { data: children = [] } = useListChildren();

  // If no child is selected, try to pick the first one automatically
  if (!activeChildId && children.length > 0) {
    setActiveChildId(children[0].id);
  }

  const activeChild = children.find(c => c.id === activeChildId);

  return (
    <Layout isJunior>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white/60 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/50">
        <div className="flex items-center gap-4">
          <img 
            src={`${import.meta.env.BASE_URL}images/junior-mascot.png`} 
            alt="AYA Junior Mascot" 
            className="w-16 h-16 object-contain drop-shadow-md animate-bounce"
            style={{ animationDuration: "3s" }}
          />
          <div>
            <h1 className="text-3xl font-display font-bold text-junior-foreground">
              Hi, {activeChild?.name || "Explorer"}! 👋
            </h1>
            <p className="text-junior-foreground/70 font-medium">Ready for an adventure?</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-yellow-200 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-bold text-lg text-yellow-600">{activeChild?.stars || 0}</span>
          </div>
          <div className="bg-white px-4 py-2 rounded-2xl shadow-sm border border-orange-200 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-orange-400 fill-orange-400" />
            <span className="font-bold text-lg text-orange-600">{activeChild?.xp || 0} XP</span>
          </div>
          <Link href="/junior/missions">
            <button className="bg-junior text-junior-foreground px-4 py-2 rounded-2xl shadow-md border-b-4 border-yellow-600 hover:translate-y-1 hover:border-b-0 transition-all font-bold flex items-center gap-2">
              <Map className="w-5 h-5" />
              Missions
            </button>
          </Link>
        </div>
      </div>

      {children.length > 1 && (
         <div className="mb-6 flex gap-2">
           {children.map(c => (
             <button 
                key={c.id} 
                onClick={() => setActiveChildId(c.id)}
                className={`px-3 py-1 rounded-full text-sm font-bold ${activeChildId === c.id ? 'bg-junior text-junior-foreground shadow-sm' : 'bg-white/50 text-muted-foreground hover:bg-white'}`}
              >
               {c.name}
             </button>
           ))}
         </div>
      )}

      <Chat module="junior" themeColor="junior" greeting={`Hello ${activeChild?.name || ''}! Let's learn something fun today. What are you curious about?`} />
    </Layout>
  );
}
