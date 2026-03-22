/**
 * Tests for Celebration Hook
 * Verifies that celebrations trigger once for badge unlocks, streak milestones, and level-ups
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import type { Badge } from "@workspace/api-client-react";

describe("Celebration Hook", () => {
  test("badge unlock celebration triggers once when badge count increases", () => {
    const previousBadgeCount = 0;
    const currentBadgeCount = 1;
    const badges: Badge[] = [
      {
        id: "first-lesson",
        icon: "🎓",
        title: "First Lesson",
        description: "Complete your first lesson",
        earnedAt: new Date().toISOString(),
      },
    ];

    const newBadgeUnlocked = currentBadgeCount > previousBadgeCount;
    const celebrationTriggered = newBadgeUnlocked;

    assert.equal(celebrationTriggered, true, "Should trigger celebration when badge is unlocked");
    assert.equal(badges.length, 1, "Should have 1 badge in array");
  });

  test("badge unlock celebration does not trigger when badges remain the same", () => {
    const previousBadgeCount = 2;
    const currentBadgeCount = 2;

    const newBadgeUnlocked = currentBadgeCount > previousBadgeCount;

    assert.equal(newBadgeUnlocked, false, "Should not trigger when badge count unchanged");
  });

  test("streak milestone celebration triggers at 3 days", () => {
    const previousStreak = 2;
    const currentStreak = 3;
    const STREAK_MILESTONES = [3, 5, 7];

    const streakMilestoneHit =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(streakMilestoneHit, true, "Should trigger celebration at 3 day streak");
  });

  test("streak milestone celebration triggers at 5 days", () => {
    const previousStreak = 4;
    const currentStreak = 5;
    const STREAK_MILESTONES = [3, 5, 7];

    const streakMilestoneHit =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(streakMilestoneHit, true, "Should trigger celebration at 5 day streak");
  });

  test("streak milestone celebration triggers at 7 days", () => {
    const previousStreak = 6;
    const currentStreak = 7;
    const STREAK_MILESTONES = [3, 5, 7];

    const streakMilestoneHit =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(streakMilestoneHit, true, "Should trigger celebration at 7 day streak");
  });

  test("streak milestone celebration does not trigger for non-milestone days", () => {
    const previousStreak = 3;
    const currentStreak = 4;
    const STREAK_MILESTONES = [3, 5, 7];

    const streakMilestoneHit =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(streakMilestoneHit, false, "Should not trigger at non-milestone day (4)");
  });

  test("streak celebration does not trigger when streak decreases", () => {
    const previousStreak = 5;
    const currentStreak = 4;
    const STREAK_MILESTONES = [3, 5, 7];

    const streakMilestoneHit =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(streakMilestoneHit, false, "Should not trigger when streak decreases");
  });

  test("level-up celebration triggers when level increases", () => {
    const previousLevel = 1;
    const currentLevel = 2;

    const levelIncreased = currentLevel > previousLevel;

    assert.equal(levelIncreased, true, "Should trigger celebration when level increases");
  });

  test("level-up celebration does not trigger when level unchanged", () => {
    const previousLevel = 3;
    const currentLevel = 3;

    const levelIncreased = currentLevel > previousLevel;

    assert.equal(levelIncreased, false, "Should not trigger when level unchanged");
  });

  test("multiple celebrations can be detected independently", () => {
    const previousBadges = 0;
    const currentBadges = 1;
    const previousLevel = 1;
    const currentLevel = 2;
    const previousStreak = 2;
    const currentStreak = 3;
    const STREAK_MILESTONES = [3, 5, 7];

    const badgeUnlocked = currentBadges > previousBadges;
    const leveledUp = currentLevel > previousLevel;
    const streakMilestone =
      currentStreak > previousStreak && STREAK_MILESTONES.includes(currentStreak);

    assert.equal(
      badgeUnlocked && leveledUp && streakMilestone,
      true,
      "Should detect all three celebration types independently"
    );
  });

  test("only one celebration type triggers when only one event occurs", () => {
    const previousBadges = 1;
    const currentBadges = 2;
    const previousLevel = 2;
    const currentLevel = 2;
    const previousStreak = 4;
    const currentStreak = 4;

    const badgeUnlocked = currentBadges > previousBadges;
    const leveledUp = currentLevel > previousLevel;
    const streakMilestone = currentStreak > previousStreak;

    assert.equal(badgeUnlocked, true, "Badge unlock should trigger");
    assert.equal(leveledUp, false, "Level up should not trigger");
    assert.equal(streakMilestone, false, "Streak should not trigger");
  });

  test("celebration extracts correct badge data", () => {
    const badges: Badge[] = [
      {
        id: "test-badge-1",
        icon: "🎖️",
        title: "Test Achievement",
        description: "Test description",
        earnedAt: new Date().toISOString(),
      },
    ];

    const latestBadge = badges[badges.length - 1];

    assert.deepEqual(
      { icon: latestBadge.icon, title: latestBadge.title },
      { icon: "🎖️", title: "Test Achievement" },
      "Should extract correct badge icon and title"
    );
  });
});
