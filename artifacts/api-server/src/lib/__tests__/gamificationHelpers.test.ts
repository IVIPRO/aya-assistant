/**
 * Tests for Phase 1 Gamification Helpers
 * Validates streak calculation and badge eligibility from existing progress data
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import {
  calculateStreakFromProgress,
  getEligibleBadges,
  formatStreakDisplay,
  formatBadgeDisplay,
  BADGES,
  type BadgeDefinition,
} from "../gamificationHelpers.js";

describe("Gamification Helpers — Phase 1 (existing data only)", () => {
  test("streak from consecutive daily activity", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const dates = [today, yesterday, twoDaysAgo];
    const streak = calculateStreakFromProgress(dates);

    assert.equal(streak, 3, "Should return 3-day streak from consecutive dates");
  });

  test("streak breaks when day is skipped", () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const dates = [today, yesterday, threeDaysAgo];
    const streak = calculateStreakFromProgress(dates);

    // streak should be 2 (today and yesterday only)
    assert.equal(
      streak,
      2,
      "Streak should reset after skipped day, count only recent consecutive"
    );
  });

  test("streak is 0 when no recent activity", () => {
    const threeWeeksAgo = new Date();
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
    const fourWeeksAgo = new Date(threeWeeksAgo);
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 1);

    const dates = [threeWeeksAgo, fourWeeksAgo];
    const streak = calculateStreakFromProgress(dates);

    assert.equal(streak, 0, "Streak should reset if no recent activity");
  });

  test("empty progress returns 0 streak", () => {
    const streak = calculateStreakFromProgress([]);
    assert.equal(streak, 0, "No activity should be 0 streak");
  });

  test("single day of activity returns 1", () => {
    const today = new Date();
    const streak = calculateStreakFromProgress([today]);

    assert.equal(streak, 1, "Single day activity should be 1-day streak");
  });

  test("badge: first lesson at 1 lesson", () => {
    const badges = getEligibleBadges(1, 0);
    const badgeIds = badges.map(b => b.id);

    assert.ok(
      badgeIds.includes("first_lesson"),
      "Should award first lesson badge at 1 lesson"
    );
  });

  test("badge: five day streak", () => {
    const badges = getEligibleBadges(0, 5);
    const badgeIds = badges.map(b => b.id);

    assert.ok(
      badgeIds.includes("five_day_streak"),
      "Should award 5-day streak badge"
    );
  });

  test("badge: ten lessons", () => {
    const badges = getEligibleBadges(10, 0);
    const badgeIds = badges.map(b => b.id);

    assert.ok(
      badgeIds.includes("ten_lessons"),
      "Should award ten lessons badge"
    );
  });

  test("badge: fifty lessons", () => {
    const badges = getEligibleBadges(50, 0);
    const badgeIds = badges.map(b => b.id);

    assert.ok(
      badgeIds.includes("fifty_lessons"),
      "Should award fifty lessons badge"
    );
  });

  test("no badges below thresholds", () => {
    const badges = getEligibleBadges(0, 0);

    assert.equal(badges.length, 0, "Should return no badges below thresholds");
  });

  test("multiple badges awarded when criteria met", () => {
    const badges = getEligibleBadges(50, 5);

    const badgeIds = badges.map(b => b.id);
    assert.ok(badgeIds.includes("first_lesson"));
    assert.ok(badgeIds.includes("five_day_streak"));
    assert.ok(badgeIds.includes("ten_lessons"));
    assert.ok(badgeIds.includes("fifty_lessons"));
    assert.equal(
      badges.length,
      4,
      "Should return all 4 badges when all thresholds met"
    );
  });

  test("streak display format is readable", () => {
    assert.equal(formatStreakDisplay(0), "No streak");
    assert.equal(formatStreakDisplay(1), "1 day 🔥");
    assert.equal(formatStreakDisplay(3), "3 days 🔥");
    assert.ok(
      formatStreakDisplay(7).includes("7 days"),
      "7+ days should show multiple fire emoji"
    );
  });

  test("badge display includes icon and title", () => {
    const badge = BADGES.FIRST_LESSON;
    const display = formatBadgeDisplay(badge);

    assert.ok(
      display.includes(badge.icon),
      "Display should include badge icon"
    );
    assert.ok(
      display.includes(badge.title),
      "Display should include badge title"
    );
  });

  test("badge definitions have required fields", () => {
    Object.values(BADGES).forEach((badge: BadgeDefinition) => {
      assert.ok(badge.id, "Badge must have id");
      assert.ok(badge.title, "Badge must have title");
      assert.ok(badge.icon, "Badge must have icon");
      assert.ok(typeof badge.threshold === "number", "Badge must have threshold");
      assert.ok(badge.description, "Badge must have description");
    });
  });

  test("activity with same-day timestamps counts as one day", () => {
    const today = new Date();
    const morning = new Date(today);
    morning.setHours(8, 0, 0, 0);
    const afternoon = new Date(today);
    afternoon.setHours(14, 0, 0, 0);
    const evening = new Date(today);
    evening.setHours(20, 0, 0, 0);

    const streak = calculateStreakFromProgress([morning, afternoon, evening]);

    assert.equal(
      streak,
      1,
      "Multiple activities on same day should count as 1-day streak"
    );
  });
});
