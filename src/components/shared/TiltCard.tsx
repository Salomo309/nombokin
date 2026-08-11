"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  useMotionTemplate,
  useReducedMotion,
} from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  intensity?: number;
  glare?: boolean;
}

export function TiltCard({
  children,
  className,
  innerClassName,
  intensity = 8,
  glare = true,
}: TiltCardProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);

  const rotateX = useSpring(
    useTransform(py, [0, 1], [intensity, -intensity]),
    { stiffness: 220, damping: 24, mass: 0.4 }
  );
  const rotateY = useSpring(
    useTransform(px, [0, 1], [-intensity, intensity]),
    { stiffness: 220, damping: 24, mass: 0.4 }
  );

  const glareX = useTransform(px, [0, 1], ["20%", "80%"]);
  const glareY = useTransform(py, [0, 1], ["20%", "80%"]);
  const glareBackground = useMotionTemplate`radial-gradient(260px circle at ${glareX} ${glareY}, rgba(255,255,255,0.16), transparent 65%)`;

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el || reduce) return;
    const rect = el.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width);
    py.set((e.clientY - rect.top) / rect.height);
  }

  function onPointerLeave() {
    setHovered(false);
    px.set(0.5);
    py.set(0.5);
  }

  return (
    <div className={cn("rounded-xl", className)} style={{ perspective: 1400 }}>
      <motion.div
        ref={ref}
        onPointerMove={onPointerMove}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={onPointerLeave}
        style={{
          rotateX: reduce ? 0 : rotateX,
          rotateY: reduce ? 0 : rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn("relative w-full rounded-xl", innerClassName)}
      >
        {children}
        {glare && !reduce && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl"
            style={{ background: glareBackground }}
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.div>
    </div>
  );
}
