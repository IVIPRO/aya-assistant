import { Layout } from "@/components/layout";
import { Chat } from "@/components/chat";
import { Heart } from "lucide-react";
import { motion } from "framer-motion";

export function Psychology() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-center mb-8 p-6 rounded-3xl bg-gradient-to-r from-psychology/20 to-psychology/5 border border-psychology/30"
        >
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white shadow-xl flex items-center justify-center p-2 relative overflow-hidden">
               <img 
                src={`${import.meta.env.BASE_URL}images/psychology-mascot.png`} 
                alt="Psychology Support" 
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground flex items-center gap-2">
                Emotional Support <Heart className="w-6 h-6 text-psychology fill-psychology" />
              </h1>
              <p className="text-muted-foreground text-lg">A safe space to talk, reflect, and find balance.</p>
            </div>
          </div>
        </motion.div>

        <Chat 
          module="psychology" 
          themeColor="psychology" 
          greeting="Hello. I'm here to listen. How are you feeling today? Take your time." 
        />
      </div>
    </Layout>
  );
}
