'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useInView } from 'motion/react';

type Type = 'curved' | 'slide';
type Dir = 'top' | 'bottom' | 'left' | 'right';

export interface TransitionProps {
  intro?: React.ReactNode | ((triggerExit: () => void) => React.ReactNode);
  children: React.ReactNode;
  introDuration?: number;
  transitionDuration?: number;
  type?: Type;
  direction?: Dir;
  className?: string;
  skip?: boolean;
  autoExit?: boolean;
  trigger?: boolean;
  onFinished?: () => void;
}

const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export const Transition: React.FC<TransitionProps> = ({
  intro,
  children,
  introDuration = 0.5, // Reduced for faster navigation
  transitionDuration = 0.8,
  type = 'curved',
  direction = 'right', // User requested curve derecha
  className = 'bg-[#FDE910]', // BURÓ Yellow
  skip = true,
  autoExit = true,
  trigger,
  onFinished,
}) => {
  const [showIntro, setShowIntro] = useState(!skip);
  const [animating, setAnimating] = useState(false);
  const [progress, setProgress] = useState(0);

  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: '-100px', once: true });

  const rafRef = useRef<number | null>(null);
  const timersRef = useRef<number[]>([]);

  const propsRef = useRef({ transitionDuration, onFinished });
  useEffect(() => {
    propsRef.current = { transitionDuration, onFinished };
  }, [transitionDuration, onFinished]);

  const [triggerExit] = useState(() => {
    return () => {
      setAnimating(true);
      let startTime: number | null = null;

      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = (now - startTime) / 1000;
        const raw = Math.min(elapsed / propsRef.current.transitionDuration, 1);
        const eased = easeInOutCubic(raw);
        setProgress(eased);

        if (raw < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setAnimating(false);
          setShowIntro(false);
          setProgress(0);
          rafRef.current = null;
          propsRef.current.onFinished?.();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    };
  });

  const startTransition = triggerExit;

  useEffect(() => {
    if (skip) {
      onFinished?.();
      return;
    }

    if (inView && autoExit) {
      const t = window.setTimeout(
        () => startTransition(),
        introDuration * 1000,
      );
      timersRef.current.push(t);
    }

    const currentTimers = timersRef.current;
    return () => {
      currentTimers.forEach(clearTimeout);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [skip, inView, introDuration, autoExit, onFinished, startTransition]);

  useEffect(() => {
    if (!autoExit && trigger && showIntro) {
      startTransition();
    }
  }, [trigger, autoExit, showIntro, startTransition]);

  const getCurvedClip = (p: number) => {
    const startRadius = 160;
    const radius = Math.max(0, startRadius * (1 - p));
    switch (direction) {
      case 'top':
        return `circle(${radius}% at 50% 0%)`;
      case 'bottom':
        return `circle(${radius}% at 50% 100%)`;
      case 'left':
        return `circle(${radius}% at 0% 50%)`;
      case 'right':
      default:
        return `circle(${radius}% at 100% 50%)`;
    }
  };

  const getSlideTransform = (p: number) => {
    const pct = Math.round(p * 100);
    switch (direction) {
      case 'bottom':
        return `translateY(${pct}%)`;
      case 'top':
        return `translateY(${-pct}%)`;
      case 'left':
        return `translateX(${-pct}%)`;
      case 'right':
      default:
        return `translateX(${pct}%)`;
    }
  };

  return (
    <div ref={ref} className='relative w-full min-h-full'>
      <div className='relative z-0 w-full min-h-full'>{children}</div>

      {showIntro && (
        <div
          className='fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none'
          aria-hidden={!showIntro ? undefined : true}
        >
          <div
            className='absolute inset-0 pointer-events-auto'
            style={
              type === 'curved'
                ? {
                    clipPath: getCurvedClip(progress),
                    transition: animating ? undefined : 'none',
                  }
                : { transform: getSlideTransform(progress) }
            }
          >
            <div className={`absolute inset-0 ${className}`} />
            <div className='absolute inset-0 flex items-center justify-center'>
              {intro && (typeof intro === 'function' ? intro(triggerExit) : intro)}
              {!intro && (
                <div className="flex flex-col items-center gap-6">
                  <div className="size-20 bg-[#11171D] text-[#FDE910] flex items-center justify-center font-black text-4xl rounded-2xl shadow-2xl">B</div>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-[#11171D]">Loading Workspace</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transition;
