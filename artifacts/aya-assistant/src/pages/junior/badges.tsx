import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { ArrowLeft, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useListChildren, getListChildrenQueryKey } from "@workspace/api-client-react";
import type { Badge } from "@workspace/api-client-react";

export function JuniorBadgesPage() {
  const { activeChildId } = useAuth();
  const { data: children = [] } = useListChildren({ query: { queryKey: getListChildrenQueryKey() } });
  const child = children.find(c => c.id === activeChildId);
  const badges = (child?.badgesEarned ?? []) as Badge[];

  return (
    <Layout>
      <Link href="/junior" className="flex items-center gap-2 text-purple-600 hover:text-purple-700 mb-6 font-bold">
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-6 h-6 text-purple-600" />
          <h1 className="text-3xl font-bold text-foreground">All Badges</h1>
        </div>
        <p className="text-muted-foreground">
          {badges.length} badge{badges.length !== 1 ? 's' : ''} unlocked
        </p>
      </div>

      {badges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {badges.map((badge, idx) => (
            <motion.div
              key={badge.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: (idx % 10) * 0.05 }}
              whileHover={{ scale: 1.1 }}
              className="bg-white rounded-2xl p-4 border-2 border-purple-100 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center gap-2"
            >
              <div className="text-4xl">{badge.icon}</div>
              <div className="text-xs font-semibold text-purple-900 text-center line-clamp-2">
                {badge.title}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-blue-50 rounded-2xl p-8 border border-blue-200 text-center">
          <span className="text-4xl mb-4 block">🎯</span>
          <p className="text-base font-medium text-blue-900">Keep learning to unlock badges!</p>
        </div>
      )}
    </Layout>
  );
}
