import { useAuth } from "@/hooks/use-auth";
import { useListChildren, useGetFamily, getGetFamilyQueryKey, getListChildrenQueryKey } from "@workspace/api-client-react";
import { translations, resolveLang, LangCode, UITranslations } from "@/lib/i18n";

export function useI18n(): { t: UITranslations; lang: LangCode } {
  const { activeChildId } = useAuth();
  const { data: family } = useGetFamily({ query: { queryKey: getGetFamilyQueryKey(), retry: false } });
  const { data: children = [] } = useListChildren({
    query: { queryKey: getListChildrenQueryKey(), enabled: !!family },
  });

  const activeChild = children.find(c => c.id === activeChildId) ?? children[0] ?? null;
  const language =
    activeChild?.language ??
    (family as { language?: string } | undefined)?.language ??
    null;
  const lang = resolveLang(language);

  return { t: translations[lang], lang };
}
