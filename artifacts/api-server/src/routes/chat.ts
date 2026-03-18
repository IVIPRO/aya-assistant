import { Router, type IRouter } from "express";
import { db, chatMessagesTable, memoriesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { SendChatMessageBody } from "@workspace/api-zod";
import { requireAuth, getUser } from "../lib/auth";
import { getAIResponse } from "../lib/aiResponses";

const router: IRouter = Router();

router.get("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const module = req.query.module as string;
  const childIdStr = req.query.childId as string | undefined;

  if (!module) {
    res.status(400).json({ error: "module is required" });
    return;
  }

  let whereClause = and(eq(chatMessagesTable.userId, userId), eq(chatMessagesTable.module, module));

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(whereClause)
    .orderBy(chatMessagesTable.createdAt);

  res.json(messages);
});

router.post("/chat/messages", requireAuth, async (req, res): Promise<void> => {
  const { userId } = getUser(req);
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { module, content, childId } = parsed.data;

  const [userMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "user", content })
    .returning();

  const aiContent = getAIResponse(module, content);

  const [assistantMsg] = await db
    .insert(chatMessagesTable)
    .values({ userId, childId: childId ?? null, module, role: "assistant", content: aiContent })
    .returning();

  await db.insert(memoriesTable).values({
    userId,
    childId: childId ?? null,
    type: "conversation_summary",
    content: `User asked: "${content.slice(0, 100)}" in ${module} module.`,
    module,
  });

  res.status(201).json({ userMessage: userMsg, assistantMessage: assistantMsg });
});

export default router;
