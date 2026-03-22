# AYA Junior - Character Design Specification

## Overview
AYA Junior is a warm, futuristic AI girl companion for children in grades 1–4 (ages 6–10). She embodies intelligence, kindness, and encouragement in a visually safe and emotionally supportive character.

## Visual Identity

### Character Profile
- **Age appearance:** 9–11 years old
- **Personality:** Intelligent, calm, kind, encouraging, trustworthy
- **Style:** Apple + Pixar + Future Classroom
- **Design philosophy:** Premium yet warm, innovative but not robotic or scary

### Overall Aesthetic
- Clean, modern, slightly futuristic
- Soft friendly face with warm emotions
- Expressive, intelligent eyes that convey understanding and care
- Subtle futuristic accents (hair, accessories) that feel natural, not mechanical
- Premium feel through careful typography and polish, not through complexity

## Visual Elements

### Face & Expression Guidelines

#### Eyes
- Large, expressive, warm brown or soft amber
- Slightly rounded shape (friendly, approachable)
- Clear, bright highlights to convey intelligence and life
- Subtle gentle lines that can animate to show listening, thinking, joy
- Never cold, robotic, or emotionally distant

#### Mouth & Smile
- Warm, natural smile that conveys encouragement
- Soft curves, not exaggerated
- Capable of subtle variations (listening, celebrating, thinking)
- Never overly wide or cartoonish

#### Face Shape & Features
- Soft, rounded features (age-appropriate, kind)
- Smooth skin tone with subtle warm undertones
- Proportionate to age appearance (not too adult, not too young)
- Symmetrical but with subtle asymmetries for personality

#### Hair
- Medium-length, flowing but neat
- Base color: Soft dark (navy, dark plum, or rich brown)
- Subtle futuristic accent: Gentle gradient or highlights in AI-blue or soft cyan at tips/strands
- May include soft glowing particles or subtle light effects
- Style: Modern and age-appropriate, not overly styled

### Color Palette

#### Primary Face Tones
- Skin: Warm peachy or light caramel with soft undertones
- Eyes: Warm brown (#8B6F47) or soft amber (#D4A373)
- Hair: Dark navy (#1A3A52) or rich brown (#3D2817) with AI-blue accent (#4A90E2)

#### Futuristic Accents
- Primary AI-blue: #4A90E2 (trustworthy, tech, calm)
- Secondary accent: Soft cyan (#60D5E8) (light, modern, inviting)
- Glow/light effects: Soft white (#F8F8F8) or warm gold (#FFD700)

#### Consistency with AYA Brand
- Primary brand green (#10B981) can appear in clothing/accessories
- Secondary brand blue (#3B82F6) complements futuristic elements
- Warm gold (#FBBF24) for celebration, achievement
- Neutral grays/whites for balance and premium feel

### Clothing & Accessories

#### Outfit Style
- Modern, clean, age-appropriate
- Mix of comfort and futuristic elements
- Premium but not intimidating

#### Recommended Elements
- **Top:** Modern tunic or fitted top in soft neutrals (cream, light gray) or brand green
  - Small glowing accents or tech details (subtle lines, soft light patterns)
  - Comfortable, not restrictive

- **Bottom:** Simple modern pants, skirt, or leggings in coordinating color
  - Neutral or brand-color accents

- **Accessories:** 
  - Small glowing pendant or jewelry suggesting tech/AI (not bulky)
  - Light traces or aura suggesting AI presence (soft glow around figure)
  - Optional: subtle data visualization accents (small glowing particles, light streams)

#### Do NOT Include
- Heavy robotics or mechanical parts
- Scary futuristic elements
- Overly complex details that distract from face
- Adult styling or proportions
- Dark or ominous colors
- Elements that feel cold or corporate

### Animation Behavior Guidelines

#### Emotional States
- **Neutral/Listening:** Gentle, alert, warm presence
- **Happy/Celebrating:** Warm smile, soft eye highlights, subtle upward energy
- **Thinking/Processing:** Slight head tilt, thoughtful expression, gentle glow
- **Encouraging/Supportive:** Open, warm smile, leaning slightly forward in concern
- **Proud of Child:** Bright smile, warm eyes, celebratory but not over-the-top

#### Movement Principles
- Smooth, natural movements inspired by real children and Pixar animation
- Avoid jerky or robotic transitions
- Subtle breathing or idle movements to feel alive
- Responsive to child's actions (acknowledging, reacting)
- Never sudden or startling

#### Idle Animation
- Gentle, breathing-like subtle movement
- Soft eye blinks (natural frequency, not staring)
- Occasional gentle head tilt or shoulder shift
- Optional: subtle AI glow pulsing very gently

#### Expression Transition
- Smooth morphing between emotions (0.3-0.5s duration typically)
- No jarring expression changes
- Eyes and mouth work together to convey emotion

### Sizing Guidelines

#### In UI Contexts
- **Listening Mode Modal:** Avatar height 200-300px (portrait orientation)
- **World Map Companion:** Avatar height 150-200px (as accent/guide)
- **Lesson Viewer Companion:** Avatar height 120-160px (sidebar position)
- **Mobile:** Responsive scaling, minimum 100px for clarity

#### Proportions
- Head: ~1/3 of total height (age-appropriate)
- Eyes: Large relative to face (~1/6 of head width each)
- Body: Balanced, approachable posture (slight forward lean = engagement)

## Design Do's & Don'ts

### Do
✅ Create a warm, friendly character kids feel safe talking to  
✅ Use soft, rounded shapes and smooth curves  
✅ Include subtle futuristic elements (glow, AI-blue accents, light effects)  
✅ Make eyes expressive and life-like  
✅ Use warm color palette with pops of brand color  
✅ Keep proportions age-appropriate and relatable  
✅ Ensure all animations are smooth and natural  
✅ Test facial expressions for emotional clarity  
✅ Maintain consistent design across all contexts (mobile, tablet, desktop)  
✅ Balance premium feel with approachability  

### Don't
❌ Make character look robotic or mechanical  
❌ Use cold, dark, or scary colors  
❌ Create overly cartoonish or unrealistic proportions  
❌ Add heavy tech elements that feel overwhelming  
❌ Use jerky or unnatural animations  
❌ Make eyes look dead, cold, or emotionally distant  
❌ Simplify design too much (loses personality)  
❌ Overcomplicate with unnecessary details  
❌ Use expressions that could feel condescending  
❌ Create a character that feels corporate or impersonal  

## Implementation Phases

### Phase 1: Design Foundation (Current)
- ✅ Design specification complete
- Character design sketches / digital mockup
- Color palette finalized
- Expression guidelines documented

### Phase 2: Avatar Creation
- Generate base avatar image (illustration or AI-generated)
- Create expression variants (neutral, happy, thinking, celebrating)
- Test sizing and proportions across UI contexts
- Refine colors and details based on feedback

### Phase 3: Animation
- Idle breathing animation
- Expression transition animations
- Responsive listening/acknowledgment states
- Glow and accent animations

### Phase 4: Integration
- Replace emoji placeholder with full avatar
- Add expression switching logic to components
- Integrate with chat/lesson response system
- Mobile responsiveness testing

### Phase 5: Enhancement (Future)
- Lip sync with audio
- Gesture animations for encouragement
- Personalization based on child preferences
- Advanced AI expression state management

## Technical Considerations

### Current State
- Placeholder: `characterEmoji="🐼"` in ListeningMode.tsx
- SVG or PNG images recommended for avatar

### Where AYA Junior Appears
1. **Listening Mode Modal** (`ListeningMode.tsx`) - Primary companion
2. **World Map** (`pages/junior/world.tsx`) - Guide/intro companion
3. **Lesson Viewer** (`pages/junior/lesson-viewer.tsx`) - Educational support
4. **Mission Play** (`MissionPlay.tsx`) - Encouragement during missions
5. **Chat Responses** (AI responses) - Contextual emoji/avatar support

### File Structure
```
artifacts/aya-assistant/
├── docs/
│   └── AYA_JUNIOR_DESIGN_SPEC.md (this file)
├── src/
│   ├── assets/
│   │   └── aya-junior/ (future avatar images)
│   │       ├── aya-neutral.svg
│   │       ├── aya-happy.svg
│   │       ├── aya-thinking.svg
│   │       └── aya-celebrating.svg
│   ├── components/
│   │   ├── AYAAvatar.tsx (future component)
│   │   └── AYAExpression.tsx (future expression manager)
│   └── constants/
│       └── ayaDesignTokens.ts (colors, sizes, animations)
```

## Brand Alignment

AYA Junior's design strengthens the AYA brand by:
- Embodying the mission: making learning enjoyable and emotionally safe
- Using brand colors (green, blue, gold) in thoughtful, non-intrusive ways
- Representing premium, innovative education technology
- Creating an emotional connection with children
- Establishing a consistent visual language across platforms

---

**Next Steps:**
1. Create character design mockups based on this spec
2. Validate with focus group of target age (6–10 years old)
3. Implement SVG or illustration of avatar
4. Begin animation framework development
5. Integrate into Listening Mode component
