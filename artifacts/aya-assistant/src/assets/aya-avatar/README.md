# AYA Junior Avatar Assets

SVG avatar illustrations for AYA Junior character with 5 emotional expressions.

## Files

### Expression Variants

1. **aya-neutral.svg**
   - Calm, ready-to-help expression
   - Neutral mouth (straight smile)
   - Warm brown eyes
   - Default state for Listening Mode

2. **aya-happy.svg**
   - Big warm smile with happy closed eyes
   - Celebratory glow accent
   - Golden tech accent on chest
   - Used for positive feedback, celebrations

3. **aya-thinking.svg**
   - Thoughtful expression with head tilt
   - Eyes looking upward (contemplative)
   - Thinking bubbles (subtle indicators)
   - Used during lesson interactions, processing

4. **aya-encouraging.svg**
   - Warm supportive expression
   - Caring eyes with warm amber iris color
   - Open posture, leaning forward
   - Golden glow rays
   - Used for guidance and encouragement

5. **aya-celebrating.svg**
   - Bright celebratory expression
   - Big happy smile with celebratory closed eyes
   - Stars/celebration sparkles
   - Enhanced golden/celebration glow
   - Used for achievement recognition, celebrations

## Design Specifications

### Colors Used
- **Skin**: #F5D5B8 (warm peachy tone)
- **Hair**: #1A3A52 (navy dark)
- **Hair Accents**: #4A90E2 (AI-blue), #60D5E8 (soft cyan)
- **Eyes**: #8B6F47 (warm brown), #D4A373 (warm amber)
- **Clothing**: #10B981 (brand green)
- **Tech Accents**: #4A90E2, #60D5E8, #FFD700, #FBBF24 (gold)
- **Glow**: #F8F8F8 (soft white), #60D5E8, #FFD700

### Dimensions
- ViewBox: 256x256 (square format, responsive)
- Can scale to any size via CSS
- Optimized for mobile and desktop

### Visual Style
- SVG-based (scalable, lightweight)
- Soft, rounded shapes (Pixar-like aesthetics)
- Subtle futuristic glow effects
- Warm color palette safe for children
- Consistent character across all expressions

## Usage

### In React Components

```tsx
import { AYAAvatar } from "@/components/AYAAvatar";

// Using the component (Phase 2 implementation)
<AYAAvatar size="md" expression="happy" animated />
```

### Direct SVG Import

```tsx
import ayaNeutralSvg from "@/assets/aya-avatar/aya-neutral.svg";

<img src={ayaNeutralSvg} alt="AYA Avatar" width={200} height={200} />
```

### Styling via CSS

```css
.aya-avatar {
  width: 200px;
  height: 200px;
  display: block;
}

.aya-avatar-large {
  width: 400px;
  height: 400px;
}

.aya-avatar-small {
  width: 100px;
  height: 100px;
}
```

## Integration Roadmap

### Phase 2A: Update AYAAvatar Component
- Replace emoji placeholder with SVG imports
- Map expressions to file paths
- Add CSS-in-JS sizing
- Support width/height props

### Phase 2B: Component Integration
- Update ListeningMode.tsx to use new avatar
- Add to World Map (guide character)
- Add to Lesson Viewer (support character)
- Add to Mission Play (celebration)

### Phase 3: Animation
- Add CSS animations for idle breathing
- Expression transition animations
- Glow pulse effects
- Celebration sparkle animations

### Phase 4: Enhancement
- Lip-sync with audio (future)
- Gesture animations
- Personalization (name, outfit variants)
- Advanced state management

## Notes for Animators

Each SVG is structured for animation:
- Facial features (eyes, mouth) are separate elements
- Hair and accents can be animated independently
- Glow circles and rays can pulse/animate
- Body can translate for posture changes
- Use `transform: translate()` for movement
- Use `@keyframes` for smooth transitions

Example animation structure:
```css
@keyframes breathing {
  0%, 100% { transform: scaleY(1); }
  50% { transform: scaleY(1.05); }
}

@keyframes eyeGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
```

## Assets Roadmap

Current: Static SVG illustrations
Future considerations:
- Alternative outfit variants
- Seasonal themed versions
- Customizable appearance options
- Animated sprite sheets (if performance requires)

---

**Last Updated:** March 22, 2026
**Status:** Phase 1 Complete - SVG Assets Ready for Integration
**Next Step:** Phase 2A - Update AYAAvatar component to use SVG files
