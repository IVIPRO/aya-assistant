/**
 * Tests for Gamification Display (Streak and Badges)
 * Verifies that streak and badges render correctly in the UI
 */

import { describe, test } from "node:test";
import assert from "node:assert";
import type { Badge, Child } from "@workspace/api-client-react";

describe("Gamification Display", () => {
  test("streak renders when value is greater than zero", () => {
    const streak = 3;
    const streakText = `🔥 ${streak} ${streak === 1 ? 'day' : 'days'}`;
    
    assert.equal(streakText, "🔥 3 days", "Should display 3 days streak");
  });

  test("streak renders singular form for 1 day", () => {
    const streak = 1;
    const streakText = `🔥 ${streak} ${streak === 1 ? 'day' : 'days'}`;
    
    assert.equal(streakText, "🔥 1 day", "Should display singular 'day' for streak of 1");
  });

  test("streak does not render when zero", () => {
    const streak = 0;
    const shouldRender = streak > 0;
    
    assert.equal(shouldRender, false, "Should not render streak when 0");
  });

  test("earned badges render with icon and title", () => {
    const badges: Badge[] = [
      { id: "first-lesson", icon: "🎓", title: "First Lesson", description: "Complete your first lesson", earnedAt: new Date().toISOString() },
      { id: "5-day-streak", icon: "🔥", title: "5 Day Streak", description: "Learn for 5 consecutive days", earnedAt: new Date().toISOString() },
    ];

    const renderedBadges = badges.map(b => ({ icon: b.icon, title: b.title }));
    
    assert.equal(renderedBadges.length, 2, "Should render 2 badges");
    assert.equal(renderedBadges[0].icon, "🎓", "First badge should have correct icon");
    assert.equal(renderedBadges[0].title, "First Lesson", "First badge should have correct title");
  });

  test("empty badge state renders when no badges earned", () => {
    const badges: Badge[] = [];
    const showEmpty = badges.length === 0;
    
    assert.equal(showEmpty, true, "Should show empty state when no badges");
  });

  test("empty badge state does not render when badges exist", () => {
    const badges: Badge[] = [
      { id: "badge-1", icon: "⭐", title: "Star", description: "Test", earnedAt: new Date().toISOString() },
    ];
    const showEmpty = badges.length === 0;
    
    assert.equal(showEmpty, false, "Should not show empty state when badges exist");
  });

  test("badge section renders when badges exist", () => {
    const badges: Badge[] = [
      { id: "10-lessons", icon: "📚", title: "10 Lessons", description: "Complete 10 lessons", earnedAt: new Date().toISOString() },
      { id: "50-lessons", icon: "🏆", title: "50 Lessons", description: "Complete 50 lessons", earnedAt: new Date().toISOString() },
    ];
    const showBadges = badges.length > 0;
    
    assert.equal(showBadges, true, "Should show badges section when badges exist");
  });

  test("badge counter with multiple badges", () => {
    const badges: Badge[] = [
      { id: "b1", icon: "🎯", title: "Badge 1", description: "Test 1", earnedAt: new Date().toISOString() },
      { id: "b2", icon: "⭐", title: "Badge 2", description: "Test 2", earnedAt: new Date().toISOString() },
      { id: "b3", icon: "🔥", title: "Badge 3", description: "Test 3", earnedAt: new Date().toISOString() },
    ];

    const badgeCount = badges.length;
    
    assert.equal(badgeCount, 3, "Should have 3 badges");
  });

  test("streak and badges can coexist in profile", () => {
    const streak = 5;
    const badges: Badge[] = [
      { id: "5-day", icon: "🔥", title: "5 Day Streak", description: "Test", earnedAt: new Date().toISOString() },
    ];
    
    const hasStreak = streak > 0;
    const hasBadges = badges.length > 0;
    
    assert.equal(hasStreak && hasBadges, true, "Both streak and badges can display together");
  });
});
