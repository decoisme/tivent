# UI Animations with GSAP

## Overview

Tivent uses GSAP (GreenSock Animation Platform) to create smooth, professional animations throughout the platform. These animations enhance user experience by providing visual feedback, guiding attention, and making the interface feel more responsive and polished.

## Installation

GSAP is already installed in the project:

```bash
npm install gsap
```

## Animation Library

All animations are centralized in `src/lib/animations.ts` for consistency and reusability.

### Available Animations

#### 1. **Fade Animations**

```typescript
// Fade in from bottom
animations.fadeIn(element, duration, delay);

// Fade out to top
animations.fadeOut(element, duration);
```

**Use cases:**
- Page content loading
- Modal appearances
- Toast notifications

#### 2. **Scale Animations**

```typescript
// Scale in with bounce
animations.scaleIn(element, duration, delay);

// Scale out
animations.scaleOut(element, duration);
```

**Use cases:**
- Button clicks
- Card appearances
- Success confirmations

#### 3. **Slide Animations**

```typescript
// Slide from left
animations.slideInFromLeft(element, duration, delay);

// Slide from right
animations.slideInFromRight(element, duration, delay);

// Slide from top
animations.slideInFromTop(element, duration, delay);

// Slide from bottom
animations.slideInFromBottom(element, duration, delay);
```

**Use cases:**
- Sidebars
- Notifications
- Modal panels

#### 4. **Stagger Animations**

```typescript
// Stagger fade in for lists
animations.staggerFadeIn(elements, duration, stagger);

// Stagger scale in
animations.staggerScaleIn(elements, duration, stagger);
```

**Use cases:**
- List items
- Grid cards
- Navigation menus

#### 5. **Hover Effects**

```typescript
// Scale on hover
animations.hoverScale(element, scale);

// Reset after hover
animations.hoverReset(element);
```

**Use cases:**
- Interactive cards
- Buttons
- Clickable elements

#### 6. **Special Effects**

```typescript
// Pulse animation
animations.pulse(element, scale, duration);

// Shake animation (error indication)
animations.shake(element, intensity);

// Bounce animation
animations.bounce(element, height);

// Rotate animation
animations.rotate(element, degrees, duration);
```

**Use cases:**
- Error states
- Loading indicators
- Attention grabbers

#### 7. **State Animations**

```typescript
// Success animation
animations.success(element);

// Error animation
animations.error(element);

// Loading animation (infinite)
animations.loading(element);
```

**Use cases:**
- Form submissions
- Transaction states
- API responses

#### 8. **Counter Animation**

```typescript
// Animate numbers
animations.counter(element, from, to, duration);
```

**Use cases:**
- Statistics display
- Dashboard metrics
- Score counters

#### 9. **Progress Animation**

```typescript
// Animate progress bar
animations.progressBar(element, progress, duration);
```

**Use cases:**
- Upload progress
- Transaction confirmation
- Multi-step forms

## React Hooks

Custom hooks simplify animation usage in React components.

### 1. useAnimateOnMount

Automatically animates element when component mounts:

```typescript
import { useAnimateOnMount } from '@/hooks/useGSAP';

function MyComponent() {
  const ref = useAnimateOnMount('fadeIn', 0.8);
  
  return <div ref={ref}>Content</div>;
}
```

**Parameters:**
- `animationType`: Type of animation
- `duration`: Animation duration (seconds)
- `delay`: Delay before animation starts

### 2. useStaggerAnimation

Animates list items with stagger effect:

```typescript
import { useStaggerAnimation } from '@/hooks/useGSAP';

function MyList() {
  const ref = useStaggerAnimation('staggerFadeIn', 0.5, 0.1);
  
  return (
    <div ref={ref}>
      <div className="stagger-item">Item 1</div>
      <div className="stagger-item">Item 2</div>
      <div className="stagger-item">Item 3</div>
    </div>
  );
}
```

**Note:** Child elements must have `className="stagger-item"`.

### 3. useHoverAnimation

Adds hover animations automatically:

```typescript
import { useHoverAnimation } from '@/hooks/useGSAP';

function Card() {
  const ref = useHoverAnimation(1.05); // Scale to 105%
  
  return <div ref={ref}>Hover me!</div>;
}
```

### 4. useCounterAnimation

Animates numbers counting up:

```typescript
import { useCounterAnimation } from '@/hooks/useGSAP';

function StatCard() {
  const ref = useCounterAnimation(1243, 2, 0);
  
  return <span ref={ref}>0</span>; // Counts from 0 to 1243
}
```

### 5. useScrollAnimation

Triggers animation when element enters viewport:

```typescript
import { useScrollAnimation } from '@/hooks/useGSAP';

function Section() {
  const ref = useScrollAnimation('fadeIn', 0.1);
  
  return <div ref={ref}>Scroll to reveal</div>;
}
```

### 6. useLoadingAnimation

Infinite loading animation:

```typescript
import { useLoadingAnimation } from '@/hooks/useGSAP';

function LoadingSpinner({ isLoading }) {
  const ref = useLoadingAnimation(isLoading);
  
  return <div ref={ref}>Loading...</div>;
}
```

### 7. useFloatAnimation

Gentle floating effect:

```typescript
import { useFloatAnimation } from '@/hooks/useGSAP';

function FloatingIcon() {
  const ref = useFloatAnimation(10); // Float distance in pixels
  
  return <div ref={ref}>🎫</div>;
}
```

### 8. useAnimationTrigger

Manual animation triggering:

```typescript
import { useAnimationTrigger } from '@/hooks/useGSAP';

function Button() {
  const { trigger } = useAnimationTrigger();
  const ref = useRef(null);
  
  const handleClick = () => {
    trigger(ref.current, 'pulse');
  };
  
  return <button ref={ref} onClick={handleClick}>Click me</button>;
}
```

## Implementation Examples

### Homepage with Animations

```typescript
import { useAnimateOnMount, useStaggerAnimation, useCounterAnimation } from '@/hooks/useGSAP';

export default function Home() {
  // Animate hero on load
  const heroRef = useAnimateOnMount('fadeIn', 0.8);
  
  // Stagger feature cards
  const cardsRef = useStaggerAnimation('staggerScaleIn', 0.5, 0.15);
  
  // Animate stats counters
  const ticketsRef = useCounterAnimation(1243, 2, 0);
  const eventsRef = useCounterAnimation(42, 1.5, 0);
  
  return (
    <div>
      <div ref={heroRef}>
        <h1>Welcome to Tivent</h1>
      </div>
      
      <div ref={cardsRef}>
        <div className="stagger-item">Card 1</div>
        <div className="stagger-item">Card 2</div>
        <div className="stagger-item">Card 3</div>
      </div>
      
      <div>
        <span ref={ticketsRef}>0</span> Tickets Sold
        <span ref={eventsRef}>0</span> Active Events
      </div>
    </div>
  );
}
```

### Button with Success Animation

```typescript
import { useAnimationTrigger } from '@/hooks/useGSAP';

function SubmitButton() {
  const { trigger } = useAnimationTrigger();
  const buttonRef = useRef(null);
  
  const handleSubmit = async () => {
    try {
      await submitForm();
      trigger(buttonRef.current, 'success');
    } catch (error) {
      trigger(buttonRef.current, 'error');
    }
  };
  
  return (
    <button ref={buttonRef} onClick={handleSubmit}>
      Submit
    </button>
  );
}
```

### List with Scroll Animation

```typescript
import { useScrollAnimation } from '@/hooks/useGSAP';

function EventList({ events }) {
  return (
    <div>
      {events.map((event, index) => {
        const ref = useScrollAnimation('slideInFromLeft', 0.1);
        
        return (
          <div key={event.id} ref={ref} style={{ transitionDelay: `${index * 0.1}s` }}>
            {event.name}
          </div>
        );
      })}
    </div>
  );
}
```

## Best Practices

### 1. **Duration Guidelines**

- **Quick interactions**: 0.2-0.3s (hover, clicks)
- **Normal animations**: 0.4-0.6s (page transitions, modals)
- **Slow reveals**: 0.8-1.2s (hero sections, important content)
- **Counters**: 1-2s (statistics, metrics)

### 2. **Easing Functions**

GSAP provides many easing options:

```typescript
ease: 'power2.out'    // Smooth deceleration
ease: 'back.out(1.4)' // Bounce effect
ease: 'elastic.out'   // Elastic bounce
ease: 'linear'        // Constant speed
```

### 3. **Stagger Timing**

For list animations:
- Small lists (< 5 items): 0.05-0.1s stagger
- Medium lists (5-15 items): 0.1-0.15s stagger
- Large lists (> 15 items): 0.05s stagger

### 4. **Performance**

- **Kill animations**: Always cleanup animations in useEffect return
- **Avoid layout thrashing**: Animate transform and opacity (GPU-accelerated)
- **Reduce motion**: Respect `prefers-reduced-motion` media query
- **Limit simultaneous animations**: Don't animate 100+ elements at once

### 5. **Accessibility**

Respect user preferences:

```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  animations.fadeIn(element);
} else {
  // Show immediately without animation
  element.style.opacity = '1';
}
```

## Animation Patterns

### Pattern 1: Page Entrance

```typescript
const timeline = gsap.timeline();
timeline
  .add(() => animations.fadeIn(header))
  .add(() => animations.slideInFromLeft(sidebar), '-=0.4')
  .add(() => animations.staggerFadeIn(cards, 0.3, 0.1), '-=0.2');
```

### Pattern 2: Success Feedback

```typescript
const timeline = gsap.timeline();
timeline
  .add(() => animations.success(icon))
  .add(() => animations.fadeIn(message), '-=0.3')
  .add(() => animations.slideOutToTop(notification), '+=2');
```

### Pattern 3: Loading State

```typescript
// Start loading
const loadingAnim = animations.loading(spinner);

// When done
loadingAnim.kill();
animations.success(successIcon);
```

## Debugging

### Enable GSAP DevTools (Development Only)

```typescript
import { GSDevTools } from 'gsap/GSDevTools';

if (process.env.NODE_ENV === 'development') {
  GSDevTools.create();
}
```

### Log Timeline Progress

```typescript
const timeline = gsap.timeline({
  onUpdate: () => console.log('Progress:', timeline.progress()),
  onComplete: () => console.log('Animation complete'),
});
```

## Common Issues

### Issue 1: Animation Not Running

**Cause:** Element not yet in DOM
**Solution:** Use useEffect or wait for ref

```typescript
useEffect(() => {
  if (ref.current) {
    animations.fadeIn(ref.current);
  }
}, []);
```

### Issue 2: Animation Stuttering

**Cause:** Too many simultaneous animations
**Solution:** Stagger or reduce complexity

```typescript
// Bad: All at once
elements.forEach(el => animations.fadeIn(el));

// Good: Staggered
animations.staggerFadeIn(elements, 0.3, 0.1);
```

### Issue 3: Animation Not Cleaning Up

**Cause:** Missing cleanup in useEffect
**Solution:** Kill animations on unmount

```typescript
useEffect(() => {
  const anim = animations.float(ref.current);
  
  return () => {
    anim.kill();
  };
}, []);
```

## Resources

- **GSAP Docs**: https://greensock.com/docs/
- **Easing Visualizer**: https://greensock.com/ease-visualizer/
- **GSAP Forums**: https://greensock.com/forums/

---

**Last Updated**: 2024
**Version**: 1.0.0
