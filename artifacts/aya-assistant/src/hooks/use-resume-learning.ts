import { useQuery } from "@tanstack/react-query";
import type { Subject, Topic } from "@/lib/curriculum";

interface ResumeData {
  subject: Subject | null;
  topic: Topic | null;
  lastActivityAt?: string;
}

export function useResumeLesson(childId: number | null) {
  return useQuery<ResumeData>({
    queryKey: ["learning", "resume", childId],
    queryFn: async () => {
      if (!childId) return { subject: null, topic: null };

      const res = await fetch(`/api/learning/resume?childId=${childId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("aya_token") ?? ""}` },
      });

      if (!res.ok) return { subject: null, topic: null };
      return res.json();
    },
    enabled: !!childId,
    staleTime: 1000 * 60 * 5,
  });
}
