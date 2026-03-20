/**
 * Tests for Gamification System: Streaks, Badges, Celebrations
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import {
  calculateDailyStreak,
  countLessonsCompleted,
  evaluateNewBadges,
  generateCompletionCelebration,
  formatStreakDisplay,
  type AchievementBadge,
} from "../gamificationSystem.js";

describe("Gamification System — Streaks & Achievements", () => {
  test("daily streak increases with consecutive days", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const timestamps = [today, yesterday, twoDaysAgo];

    const streak = calculateDailyStreak(timestamps);

    assert.equal(streak, 3, "Should calculate 3-day streak from consecutive dates");
  });

  test("daily streak resets if a day is skipped", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Gap on day 2

    const timestamps = [today, yesterday, threeDaysAgo];

    const streak = calculateDailyStreak(timestamps);

    assert.equal(streak, 2, "Streak should reset after skipped day, count only last 2 consecutive");
  });

  test("daily streak resets if no activity today or yesterday", () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const fourDaysAgo = new Date(threeDaysAgo);
    fourDaysAgo.setDate(fourDaysAgo.getDate() - 1);

    const timestamps = [threeDaysAgo, fourDaysAgo];

    const streak = calculateDailyStreak(timestamps);

    assert.equal(streak, 0, "Streak should reset if no recent activity");
  });

  test("empty activity returns 0 streak", () => {
    const streak = calculateDailyStreak([]);
    assert.equal(streak, 0, "No activity should be 0 streak");
  });

  test("badge triggers: first lesson completed", () => {
    const previousBadges: AchievementBadge[] = [];

    const newBadges = evaluateNewBadges(0, 1, previousBadges);

    assert.ok(
      newBadges.some(b => b.id === "first_lesson_completed"),
      "Should award first lesson badge at 1 lesson"
    );
  });

  test("badge triggers: five day streak", () => {
    const previousBadges: AchievementBadge[] = [];

    const newBadges = evaluateNewBadges(5, 0, previousBadges);

    assert.ok(
      newBadges.some(b => b.id === "five_day_streak"),
      "Should award five day streak badge"
    );
  });

  test("badge triggers: ten lessons completed", () => {
    const previousBadges: AchievementBadge[] = [];

    const newBadges = evaluateNewBadges(0, 10, previousBadges);

    assert.ok(
      newBadges.some(b => b.id === "ten_lessons_completed"),
      "Should award ten lessons badge"
    );
  });

  test("badge triggers: fifty lessons completed", () => {
    const previousBadges: AchievementBadge[] = [];

    const newBadges = evaluateNewBadges(0, 50, previousBadges);

    assert.ok(
      newBadges.some(b => b.id === "fifty_lessons_completed"),
      "Should award fifty lessons badge"
    );
  });

  test("badges do not duplicate when already earned", () => {
    const previousBadges: AchievementBadge[] = [
      {
        id: "first_lesson_completed",
        title: "First Steps",
        icon: "🎉",
        description: "Completed your first lesson",
        earnedAt: new Date().toISOString(),
      },
    ];

    const newBadges = evaluateNewBadges(0, 5, previousBadges);

    assert.ok(
      !newBadges.some(b => b.id === "first_lesson_completed"),
      "Should not re-award first lesson badge"
    );
  });

  test("completion celebration includes XP earned", () => {
    const celebration = generateCompletionCelebration("Sofia", 30, 0, "panda");

    assert.ok(
      celebration.message.includes("30 XP"),
      "Celebration should show XP earned"
    );
    assert.ok(
      celebration.message.includes("Sofia"),
      "Celebration should include child name"
    );
  });

  test("completion celebration includes streak if active", () => {
    const celebration = generateCompletionCelebration("Sofia", 30, 5, "panda");

    assert.ok(
      celebration.message.includes("5-day streak"),
      "Celebration should show active streak"
    );
  });

  test("completion celebration adapts to character type", () => {
    const pandaCelebration = generateCompletionCelebration("Sofia", 30, 0, "panda");
    const robotCelebration = generateCompletionCelebration("Sofia", 30, 0, "robot");

    // Both should include name and XP
    assert.ok(
      pandaCelebration.message.includes("Sofia") && pandaCelebration.message.includes("30 XP"),
      "Panda celebration should include name and XP"
    );
    assert.ok(
      robotCelebration.message.includes("Sofia") && robotCelebration.message.includes("30 XP"),
      "Robot celebration should include name and XP"
    );

    // Messages should be different for different characters
    assert.notEqual(
      pandaCelebration.message,
      robotCelebration.message,
      "Different characters should produce different celebrations"
    );
  });

  test("streak display format is child-friendly", () => {
    assert.equal(formatStreakDisplay(0), "No streak yet");
    assert.equal(formatStreakDisplay(1), "1 day on fire! 🔥");
    assert.equal(formatStreakDisplay(3), "3 days! 🔥");
    assert.ok(
      formatStreakDisplay(7).includes("7 days") && formatStreakDisplay(7).includes("🔥🔥"),
      "7+ days should show multiple fire emojis"
    );
  });

  test("lesson count computation is correct", () => {
    const count = countLessonsCompleted(15);
    assert.equal(count, 15, "Should return exact lesson count");
  });

  test("badge with multiple criteria awards all eligible badges", () => {
    const previousBadges: AchievementBadge[] = [];

    // 5 day streak AND 10 lessons
    const newBadges = evaluateNewBadges(5, 10, previousBadges);

    const badgeIds = newBadges.map(b => b.id);
    assert.ok(
      badgeIds.includes("first_lesson_completed"),
      "Should include first lesson badge"
    );
    assert.ok(
      badgeIds.includes("five_day_streak"),
      "Should include five day streak badge"
    );
    assert.ok(
      badgeIds.includes("ten_lessons_completed"),
      "Should include ten lessons badge"
    );
  });

  test("each badge has required fields", () => {
    const newBadges = evaluateNewBadges(5, 10, []);

    newBadges.forEach(badge => {
      assert.ok(badge.id, "Badge should have id");
      assert.ok(badge.title, "Badge should have title");
      assert.ok(badge.icon, "Badge should have icon");
      assert.ok(badge.description, "Badge should have description");
      assert.ok(badge.earnedAt, "Badge should have earnedAt timestamp");
    });
  });

  test("streak with activity today extends streak", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const timestamps = [today, yesterday];
    const streak = calculateDailyStreak(timestamps);

    assert.equal(
      streak,
      2,
      "Activity today should extend streak from yesterday"
    );
  });
});
