import gsap from 'gsap';

/**
 * Animation presets using GSAP
 */

export const animations = {
  // Fade animations
  fadeIn: (element: HTMLElement | null, duration = 0.6, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration, delay, ease: 'power2.out' }
    );
  },

  fadeOut: (element: HTMLElement | null, duration = 0.4) => {
    if (!element) return;
    return gsap.to(element, {
      opacity: 0,
      y: -20,
      duration,
      ease: 'power2.in',
    });
  },

  // Scale animations
  scaleIn: (element: HTMLElement | null, duration = 0.5, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: 'back.out(1.4)' }
    );
  },

  scaleOut: (element: HTMLElement | null, duration = 0.3) => {
    if (!element) return;
    return gsap.to(element, {
      scale: 0.8,
      opacity: 0,
      duration,
      ease: 'back.in(1.4)',
    });
  },

  // Slide animations
  slideInFromLeft: (element: HTMLElement | null, duration = 0.6, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { x: -100, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: 'power3.out' }
    );
  },

  slideInFromRight: (element: HTMLElement | null, duration = 0.6, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { x: 100, opacity: 0 },
      { x: 0, opacity: 1, duration, delay, ease: 'power3.out' }
    );
  },

  slideInFromTop: (element: HTMLElement | null, duration = 0.6, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration, delay, ease: 'power3.out' }
    );
  },

  slideInFromBottom: (element: HTMLElement | null, duration = 0.6, delay = 0) => {
    if (!element) return;
    gsap.fromTo(
      element,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration, delay, ease: 'power3.out' }
    );
  },

  // Stagger animations for lists
  staggerFadeIn: (
    elements: HTMLElement[] | NodeListOf<Element>,
    duration = 0.5,
    stagger = 0.1
  ) => {
    if (!elements || elements.length === 0) return;
    gsap.fromTo(
      elements,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration,
        stagger,
        ease: 'power2.out',
      }
    );
  },

  staggerScaleIn: (
    elements: HTMLElement[] | NodeListOf<Element>,
    duration = 0.5,
    stagger = 0.1
  ) => {
    if (!elements || elements.length === 0) return;
    gsap.fromTo(
      elements,
      { scale: 0.5, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration,
        stagger,
        ease: 'back.out(1.2)',
      }
    );
  },

  // Hover animations
  hoverScale: (element: HTMLElement | null, scale = 1.05) => {
    if (!element) return;
    gsap.to(element, {
      scale,
      duration: 0.3,
      ease: 'power2.out',
    });
  },

  hoverReset: (element: HTMLElement | null) => {
    if (!element) return;
    gsap.to(element, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out',
    });
  },

  // Pulse animation
  pulse: (element: HTMLElement | null, scale = 1.1, duration = 0.8) => {
    if (!element) return;
    gsap.to(element, {
      scale,
      duration: duration / 2,
      repeat: 1,
      yoyo: true,
      ease: 'power2.inOut',
    });
  },

  // Shake animation
  shake: (element: HTMLElement | null, intensity = 10) => {
    if (!element) return;
    gsap.to(element, {
      x: intensity,
      duration: 0.1,
      repeat: 5,
      yoyo: true,
      ease: 'power2.inOut',
    });
  },

  // Bounce animation
  bounce: (element: HTMLElement | null, height = 20) => {
    if (!element) return;
    gsap.to(element, {
      y: -height,
      duration: 0.4,
      repeat: 1,
      yoyo: true,
      ease: 'power2.out',
    });
  },

  // Rotate animation
  rotate: (element: HTMLElement | null, degrees = 360, duration = 1) => {
    if (!element) return;
    gsap.to(element, {
      rotation: degrees,
      duration,
      ease: 'power2.inOut',
    });
  },

  // Success animation (scale + fade)
  success: (element: HTMLElement | null) => {
    if (!element) return;
    const timeline = gsap.timeline();
    timeline
      .fromTo(
        element,
        { scale: 0, opacity: 0 },
        { scale: 1.2, opacity: 1, duration: 0.3, ease: 'back.out(2)' }
      )
      .to(element, { scale: 1, duration: 0.2, ease: 'power2.out' });
    return timeline;
  },

  // Error animation (shake + red tint)
  error: (element: HTMLElement | null) => {
    if (!element) return;
    const timeline = gsap.timeline();
    timeline
      .to(element, {
        x: 10,
        duration: 0.1,
        repeat: 5,
        yoyo: true,
        ease: 'power2.inOut',
      })
      .to(element, { x: 0, duration: 0.1 });
    return timeline;
  },

  // Loading animation (infinite pulse)
  loading: (element: HTMLElement | null) => {
    if (!element) return;
    return gsap.to(element, {
      scale: 1.1,
      opacity: 0.7,
      duration: 0.8,
      repeat: -1,
      yoyo: true,
      ease: 'power2.inOut',
    });
  },

  // Counter animation
  counter: (
    element: HTMLElement | null,
    from: number,
    to: number,
    duration = 1
  ) => {
    if (!element) return;
    const obj = { value: from };
    gsap.to(obj, {
      value: to,
      duration,
      ease: 'power2.out',
      onUpdate: () => {
        element.textContent = Math.round(obj.value).toString();
      },
    });
  },

  // Progress bar animation
  progressBar: (element: HTMLElement | null, progress: number, duration = 1) => {
    if (!element) return;
    gsap.to(element, {
      width: `${progress}%`,
      duration,
      ease: 'power2.out',
    });
  },

  // Page transition
  pageTransitionIn: (element: HTMLElement | null) => {
    if (!element) return;
    const timeline = gsap.timeline();
    timeline
      .set(element, { opacity: 0, y: 50 })
      .to(element, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
    return timeline;
  },

  pageTransitionOut: (element: HTMLElement | null) => {
    if (!element) return;
    return gsap.to(element, {
      opacity: 0,
      y: -50,
      duration: 0.4,
      ease: 'power3.in',
    });
  },

  // Card flip animation
  flipCard: (element: HTMLElement | null, duration = 0.6) => {
    if (!element) return;
    const timeline = gsap.timeline();
    timeline
      .to(element, { rotationY: 90, duration: duration / 2, ease: 'power2.in' })
      .to(element, { rotationY: 0, duration: duration / 2, ease: 'power2.out' });
    return timeline;
  },

  // Gradient animation
  gradientShift: (element: HTMLElement | null) => {
    if (!element) return;
    return gsap.to(element, {
      backgroundPosition: '200% center',
      duration: 3,
      repeat: -1,
      ease: 'linear',
    });
  },

  // Float animation (infinite)
  float: (element: HTMLElement | null, distance = 10) => {
    if (!element) return;
    return gsap.to(element, {
      y: -distance,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: 'power1.inOut',
    });
  },

  // Kill all animations on element
  kill: (element: HTMLElement | null) => {
    if (!element) return;
    gsap.killTweensOf(element);
  },
};

/**
 * Timeline builder for complex animations
 */
export const createTimeline = (options?: gsap.TimelineVars) => {
  return gsap.timeline(options);
};

/**
 * Utility to animate multiple elements in sequence
 */
export const animateSequence = (
  animationsList: Array<{
    element: HTMLElement | null;
    animation: keyof typeof animations;
    delay?: number;
  }>
) => {
  const timeline = gsap.timeline();
  animationsList.forEach(({ element, animation: animType, delay = 0 }) => {
    if (element) {
      const animFn = animations[animType];
      if (typeof animFn === 'function') {
        timeline.add(() => (animFn as any)(element), delay);
      }
    }
  });
  return timeline;
};
