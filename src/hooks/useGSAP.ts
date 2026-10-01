import { useEffect, useRef } from 'react';
import { animations } from '@/lib/animations';
import gsap from 'gsap';

/**
 * Hook to animate element on mount
 */
export function useAnimateOnMount(
  animationType: keyof typeof animations = 'fadeIn',
  duration = 0.6,
  delay = 0
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const anim = animations[animationType] as any;
      if (typeof anim === 'function') {
        anim(ref.current, duration, delay);
      }
    }
  }, [animationType, duration, delay]);

  return ref;
}

/**
 * Hook to animate list items with stagger
 */
export function useStaggerAnimation(
  animationType: 'staggerFadeIn' | 'staggerScaleIn' = 'staggerFadeIn',
  duration = 0.5,
  stagger = 0.1
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const children = ref.current.querySelectorAll('.stagger-item');
      if (children.length > 0) {
        animations[animationType](children, duration, stagger);
      }
    }
  }, [animationType, duration, stagger]);

  return ref;
}

/**
 * Hook for hover animations
 */
export function useHoverAnimation(scale = 1.05) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleMouseEnter = () => {
      animations.hoverScale(element, scale);
    };

    const handleMouseLeave = () => {
      animations.hoverReset(element);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [scale]);

  return ref;
}

/**
 * Hook for counter animation
 */
export function useCounterAnimation(
  value: number,
  duration = 1,
  initialValue = 0
) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      animations.counter(ref.current, initialValue, value, duration);
    }
  }, [value, duration, initialValue]);

  return ref;
}

/**
 * Hook for scroll-triggered animations
 */
export function useScrollAnimation(
  animationType: keyof typeof animations = 'fadeIn',
  threshold = 0.1
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const anim = animations[animationType] as any;
            if (typeof anim === 'function') {
              anim(entry.target as HTMLElement);
            }
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [animationType, threshold]);

  return ref;
}

/**
 * Hook for loading animation
 */
export function useLoadingAnimation(isLoading: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (ref.current) {
      if (isLoading) {
        animationRef.current = animations.loading(ref.current) || null;
      } else {
        if (animationRef.current) {
          animationRef.current.kill();
          gsap.to(ref.current, {
            scale: 1,
            opacity: 1,
            duration: 0.3,
          });
        }
      }
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [isLoading]);

  return ref;
}

/**
 * Hook for float animation
 */
export function useFloatAnimation(distance = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const animationRef = useRef<gsap.core.Tween | null>(null);

  useEffect(() => {
    if (ref.current) {
      animationRef.current = animations.float(ref.current, distance) || null;
    }

    return () => {
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [distance]);

  return ref;
}

/**
 * Hook to trigger animation manually
 */
export function useAnimationTrigger() {
  const trigger = (
    element: HTMLElement | null,
    animationType: keyof typeof animations,
    ...args: any[]
  ) => {
    if (element) {
      const anim = animations[animationType] as any;
      if (typeof anim === 'function') {
        return anim(element, ...args);
      }
    }
  };

  return { trigger };
}
