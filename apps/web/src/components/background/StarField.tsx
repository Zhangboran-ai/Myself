'use client';

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  phase: number;
  speed: number;
  /** 1 = 近景（参与视差），0.4 = 远景 */
  depth: number;
  color: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  length: number;
}

const STAR_COLORS = ['#ffffff', '#cfe0ff', '#e6d9ff'];
const FRAME_MS = 1000 / 30;

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * 全局星空背景。
 * 约束：动画不进入 React 状态、DPR 上限 2、30fps 上限、
 * 页面隐藏暂停、prefers-reduced-motion 只绘制一帧静态星空。
 */
export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = motionQuery.matches;
    let width = 0;
    let height = 0;
    let dpr = 1;
    let stars: Star[] = [];
    let meteors: Meteor[] = [];
    let animationId = 0;
    let lastFrame = 0;
    let nextMeteorAt = 0;
    let scrollY = window.scrollY;

    const createStar = (depth: number): Star => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: depth === 1 ? randomBetween(0.8, 1.7) : randomBetween(0.4, 1),
      baseAlpha: depth === 1 ? randomBetween(0.4, 0.85) : randomBetween(0.18, 0.5),
      phase: Math.random() * Math.PI * 2,
      speed: randomBetween(0.35, 1.1),
      depth,
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)] ?? '#ffffff',
    });

    const setup = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const isMobile = width < 640;
      const count = isMobile ? 110 : Math.min(250, Math.floor((width * height) / 8500));
      const nearCount = Math.round(count * 0.3);

      stars = Array.from({ length: count }, (_, index) => createStar(index < nearCount ? 1 : 0.4));
      meteors = [];
      nextMeteorAt = performance.now() + randomBetween(4000, 9000);
    };

    const draw = (now: number) => {
      const elapsed = now / 1000;
      context.clearRect(0, 0, width, height);

      const parallax = reducedMotion ? 0 : scrollY * 0.03;

      for (const star of stars) {
        const alpha = reducedMotion
          ? star.baseAlpha
          : clamp(star.baseAlpha + Math.sin(elapsed * star.speed + star.phase) * 0.22, 0.06, 0.95);
        const offset = (star.y - parallax * star.depth) % height;
        const y = offset < 0 ? offset + height : offset;

        context.beginPath();
        context.arc(star.x, y, star.radius, 0, Math.PI * 2);
        context.fillStyle = star.color;
        context.globalAlpha = alpha;
        context.fill();

        if (star.depth === 1 && star.radius > 1.3) {
          context.beginPath();
          context.arc(star.x, y, star.radius * 2.6, 0, Math.PI * 2);
          context.globalAlpha = alpha * 0.12;
          context.fill();
        }
      }

      context.globalAlpha = 1;

      if (!reducedMotion) {
        if (now > nextMeteorAt) {
          meteors.push({
            x: randomBetween(width * 0.25, width * 1.05),
            y: randomBetween(-20, height * 0.45),
            vx: randomBetween(-420, -300),
            vy: randomBetween(190, 280),
            age: 0,
            life: randomBetween(0.7, 1.1),
            length: randomBetween(90, 160),
          });
          nextMeteorAt = now + randomBetween(6000, 15000);
        }

        const dt = 1 / 30;
        meteors = meteors.filter((meteor) => {
          meteor.age += dt;
          if (meteor.age > meteor.life) return false;

          meteor.x += meteor.vx * dt;
          meteor.y += meteor.vy * dt;

          const tailX = meteor.x - meteor.vx * 0.14;
          const tailY = meteor.y - meteor.vy * 0.14;
          const progress = meteor.age / meteor.life;
          const alpha = Math.sin(progress * Math.PI) * 0.8;

          const gradient = context.createLinearGradient(meteor.x, meteor.y, tailX, tailY);
          gradient.addColorStop(0, `rgba(232,238,249,${alpha})`);
          gradient.addColorStop(1, 'rgba(232,238,249,0)');

          context.beginPath();
          context.strokeStyle = gradient;
          context.lineWidth = 1.4;
          context.moveTo(meteor.x, meteor.y);
          context.lineTo(
            meteor.x - (meteor.vx / Math.hypot(meteor.vx, meteor.vy)) * meteor.length,
            meteor.y - (meteor.vy / Math.hypot(meteor.vx, meteor.vy)) * meteor.length,
          );
          context.stroke();
          return true;
        });
      }
    };

    const loop = (now: number) => {
      animationId = window.requestAnimationFrame(loop);
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      draw(now);
    };

    const start = () => {
      window.cancelAnimationFrame(animationId);
      if (reducedMotion) {
        draw(performance.now());
        return;
      }
      animationId = window.requestAnimationFrame(loop);
    };

    const handleResize = () => {
      setup();
      if (reducedMotion) draw(performance.now());
    };

    const handleVisibility = () => {
      if (document.hidden) {
        window.cancelAnimationFrame(animationId);
      } else {
        lastFrame = 0;
        start();
      }
    };

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMotionChange = (event: MediaQueryListEvent) => {
      reducedMotion = event.matches;
      meteors = [];
      start();
    };

    setup();
    start();

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibility);
    motionQuery.addEventListener('change', handleMotionChange);

    return () => {
      window.cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibility);
      motionQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 h-full w-full"
    />
  );
}
