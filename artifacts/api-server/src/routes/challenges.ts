import { Router } from "express";
import { and, eq, or } from "drizzle-orm";
import { db, childrenTable, friendChallengesTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router = Router();

/* List challenges for current child (creator or opponent) */
router.get("/challenges", requireAuth, async (req, res): Promise<void> => {
  const { childId } = req.query;
  const numChildId = typeof childId === "string" ? parseInt(childId, 10) : undefined;

  if (!numChildId || numChildId <= 0) {
    res.status(400).json({ error: "Invalid childId" });
    return;
  }

  try {
    /* Verify child belongs to family */
    const child = await db
      .select()
      .from(childrenTable)
      .where(eq(childrenTable.id, numChildId))
      .limit(1);

    if (!child.length) {
      res.status(404).json({ error: "Child not found" });
      return;
    }

    /* Get all challenges (creator or opponent) */
    const challenges = await db
      .select()
      .from(friendChallengesTable)
      .where(
        or(
          eq(friendChallengesTable.creatorStudentId, numChildId),
          eq(friendChallengesTable.opponentStudentId, numChildId)
        )
      );

    res.json(challenges);
  } catch (err) {
    console.error("[CHALLENGES_FETCH_ERROR]", err);
    res.status(500).json({ error: "Failed to fetch challenges" });
  }
});

/* Create challenge */
router.post("/challenges", requireAuth, async (req, res): Promise<void> => {
  const { creatorStudentId, opponentStudentId, topic, tasksTotal } = req.body;

  if (!creatorStudentId || !opponentStudentId || !topic) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (creatorStudentId === opponentStudentId) {
    res.status(400).json({ error: "Cannot challenge yourself" });
    return;
  }

  try {
    /* Verify both children exist */
    const creator = await db
      .select()
      .from(childrenTable)
      .where(eq(childrenTable.id, creatorStudentId))
      .limit(1);

    const opponent = await db
      .select()
      .from(childrenTable)
      .where(eq(childrenTable.id, opponentStudentId))
      .limit(1);

    if (!creator.length || !opponent.length) {
      res.status(404).json({ error: "One or both children not found" });
      return;
    }

    /* Create challenge */
    const [challenge] = await db
      .insert(friendChallengesTable)
      .values({
        creatorStudentId,
        opponentStudentId,
        topic,
        tasksTotal: tasksTotal || 10,
      })
      .returning();

    console.log(
      `[CHALLENGE_CREATED] id=${challenge.id} creator=${creatorStudentId} opponent=${opponentStudentId} topic=${topic}`
    );

    res.status(201).json(challenge);
  } catch (err) {
    console.error("[CHALLENGE_CREATE_ERROR]", err);
    res.status(500).json({ error: "Failed to create challenge" });
  }
});

/* Accept challenge */
router.post("/challenges/:id/accept", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const challengeId = parseInt(id, 10);

  if (!challengeId || challengeId <= 0) {
    res.status(400).json({ error: "Invalid challenge ID" });
    return;
  }

  try {
    const challenge = await db
      .select()
      .from(friendChallengesTable)
      .where(eq(friendChallengesTable.id, challengeId))
      .limit(1);

    if (!challenge.length) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    if (challenge[0].status !== "pending") {
      res.status(400).json({ error: "Challenge is not pending" });
      return;
    }

    const updated = await db
      .update(friendChallengesTable)
      .set({
        status: "accepted",
        acceptedAt: new Date(),
      })
      .where(eq(friendChallengesTable.id, challengeId))
      .returning();

    console.log(`[CHALLENGE_ACCEPTED] id=${challengeId}`);

    res.json(updated[0]);
  } catch (err) {
    console.error("[CHALLENGE_ACCEPT_ERROR]", err);
    res.status(500).json({ error: "Failed to accept challenge" });
  }
});

/* Complete challenge task (increment counter) */
router.post("/challenges/:id/task-complete", requireAuth, async (req, res): Promise<void> => {
  const { id } = req.params;
  const { childId } = req.body;
  const challengeId = parseInt(id, 10);

  if (!challengeId || challengeId <= 0 || !childId) {
    res.status(400).json({ error: "Invalid challenge ID or child ID" });
    return;
  }

  try {
    const challenge = await db
      .select()
      .from(friendChallengesTable)
      .where(eq(friendChallengesTable.id, challengeId))
      .limit(1);

    if (!challenge.length) {
      res.status(404).json({ error: "Challenge not found" });
      return;
    }

    const c = challenge[0];
    if (c.status === "completed") {
      res.status(400).json({ error: "Challenge already completed" });
      return;
    }

    /* Determine if this is creator or opponent */
    let tasksCompletedCreator = c.tasksCompletedCreator;
    let tasksCompletedOpponent = c.tasksCompletedOpponent;

    if (childId === c.creatorStudentId) {
      tasksCompletedCreator = Math.min(c.tasksCompletedCreator + 1, c.tasksTotal);
    } else if (childId === c.opponentStudentId) {
      tasksCompletedOpponent = Math.min(c.tasksCompletedOpponent + 1, c.tasksTotal);
    } else {
      res.status(403).json({ error: "Not part of this challenge" });
      return;
    }

    /* Check if challenge complete */
    const isComplete = tasksCompletedCreator >= c.tasksTotal || tasksCompletedOpponent >= c.tasksTotal;
    const winner = isComplete
      ? tasksCompletedCreator > tasksCompletedOpponent
        ? c.creatorStudentId
        : tasksCompletedOpponent > tasksCompletedCreator
        ? c.opponentStudentId
        : null
      : null;

    const updated = await db
      .update(friendChallengesTable)
      .set({
        tasksCompletedCreator,
        tasksCompletedOpponent,
        ...(isComplete && {
          status: "completed",
          completedAt: new Date(),
          winner,
        }),
      })
      .where(eq(friendChallengesTable.id, challengeId))
      .returning();

    console.log(
      `[CHALLENGE_TASK_COMPLETE] id=${challengeId} childId=${childId} completed=${
        tasksCompletedCreator >= c.tasksTotal || tasksCompletedOpponent >= c.tasksTotal
      } winner=${winner ?? "none"}`
    );

    res.json(updated[0]);
  } catch (err) {
    console.error("[CHALLENGE_TASK_COMPLETE_ERROR]", err);
    res.status(500).json({ error: "Failed to complete task" });
  }
});

export default router;
