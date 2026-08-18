"use client";

import { SmartImage } from "@/components/ui/SmartImage";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { getAllEvents } from "@/data/events";
import type { EventItem } from "@/types";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function useInView(threshold = 0.16) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView();
  const show = reduced || inView;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: show ? "translate3d(0,0,0)" : "translate3d(0,36px,0)",
        transition: `opacity 1.1s ${EASE} ${delay}s, transform 1.1s ${EASE} ${delay}s`,
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}

function LineReveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const { ref, inView } = useInView(0.2);
  const show = reduced || inView;

  return (
    <div ref={ref} className={`overflow-hidden ${className}`}>
      <div
        style={{
          transform: show ? "translate3d(0,0,0)" : "translate3d(0,110%,0)",
          transition: `transform 1.25s ${EASE} ${delay}s`,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Grain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] opacity-[0.05] mix-blend-overlay"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundSize: "180px 180px",
      }}
    />
  );
}

function formatEventDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function EventCard({ ev, index }: { ev: EventItem; index: number }) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLAnchorElement>(null);
  const raf = useRef(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, x: 50, y: 50, active: false });

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLAnchorElement>) => {
      if (reduced) return;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() => {
        setTilt({
          rx: (0.5 - py) * 9,
          ry: (px - 0.5) * 12,
          x: px * 100,
          y: py * 100,
          active: true,
        });
      });
    },
    [reduced],
  );

  const onLeave = useCallback(() => {
    cancelAnimationFrame(raf.current);
    setTilt({ rx: 0, ry: 0, x: 50, y: 50, active: false });
  }, []);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const lift = tilt.active && !reduced;

  return (
    <Reveal delay={0.1 + index * 0.12} className="h-full">
      <div className="h-full" style={{ perspective: "1200px" }}>
        <Link
          ref={ref}
          href={`/events/${ev.slug}`}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
          className="group relative grid h-full min-h-[240px] overflow-hidden rounded-sm md:min-h-[260px] md:grid-cols-2"
          style={{
            transform: lift
              ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(14px) scale(1.015)`
              : "rotateX(0deg) rotateY(0deg) translateZ(0) scale(1)",
            transition: `transform 0.7s ${EASE}, box-shadow 0.7s ${EASE}`,
            transformStyle: "preserve-3d",
            willChange: "transform",
            background: `
              #0e0e0e padding-box,
              linear-gradient(
                135deg,
                ${lift ? "rgba(232,201,122,0.95)" : "rgba(201,168,76,0.7)"} 0%,
                rgba(201,168,76,0.2) 40%,
                rgba(255,255,255,0.1) 55%,
                ${lift ? "rgba(232,201,122,0.85)" : "rgba(201,168,76,0.5)"} 100%
              ) border-box
            `,
            border: "1px solid transparent",
            boxShadow: lift
              ? "0 28px 56px -22px rgba(0,0,0,0.9), 0 0 44px rgba(201,168,76,0.22)"
              : "0 12px 28px -18px rgba(0,0,0,0.75)",
          }}
        >
          {/* Image panel */}
          <div className="relative min-h-[180px] overflow-hidden md:min-h-full">
            <SmartImage
              src={ev.image}
              alt={ev.title}
              fill
              className="object-cover"
              style={{
                transform: lift
                  ? `scale(1.06) translate3d(${(tilt.x - 50) * 0.04}px, ${(tilt.y - 50) * 0.03}px, 0)`
                  : "scale(1)",
                transition: `transform 0.7s ${EASE}`,
              }}
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div
              aria-hidden
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, transparent 40%, rgba(14,14,14,0.55) 100%), linear-gradient(to top, rgba(14,14,14,0.35), transparent 50%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: lift ? 1 : 0,
                transition: `opacity 0.5s ${EASE}`,
                background: `radial-gradient(280px circle at ${tilt.x}% ${tilt.y}%, rgba(232,201,122,0.35), transparent 55%)`,
              }}
            />
            <p className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.28em] text-[var(--gold-bright)] md:hidden">
              {formatEventDate(ev.date)}
            </p>
          </div>

          {/* Solid text panel — sharp, equal structure */}
          <div className="relative flex flex-col justify-center bg-[#0e0e0e] p-6 md:p-7">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]">
              {formatEventDate(ev.date)} · {ev.seatsAvailable} seats left
            </p>
            <h3
              className="mt-3 font-display text-xl leading-snug md:text-2xl"
              style={{
                color: lift ? "var(--gold-bright)" : "var(--cream)",
                transform: lift
                  ? `translate3d(${(tilt.x - 50) * 0.04}px, ${(tilt.y - 50) * 0.03}px, 0)`
                  : undefined,
                transition: `transform 0.7s ${EASE}, color 0.5s ${EASE}`,
              }}
            >
              {ev.title}
            </h3>
            <span
              aria-hidden
              className="mt-3 block h-px origin-left bg-gradient-to-r from-[var(--gold-bright)] via-[var(--gold)] to-transparent"
              style={{
                transform: lift || reduced ? "scaleX(1)" : "scaleX(0.3)",
                transition: `transform 0.7s ${EASE}`,
              }}
            />
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[var(--cream)]/90">
              {ev.description}
            </p>
            <div className="mt-5 flex items-center justify-between gap-3">
              <p className="text-sm text-[var(--gold)]">
                From ${ev.price}
                <span className="text-[var(--muted)]"> / seat</span>
              </p>
              <span
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[var(--gold)]"
                style={{
                  transform: lift ? "translate3d(4px,0,0)" : "translate3d(0,0,0)",
                  transition: `transform 0.7s ${EASE}`,
                }}
              >
                Reserve
                <span aria-hidden className="text-[var(--gold-bright)]">
                  →
                </span>
              </span>
            </div>
          </div>
        </Link>
      </div>
    </Reveal>
  );
}

export function HomeEvents() {
  const featured = getAllEvents().slice(0, 2);

  return (
    <section className="relative overflow-hidden py-24 md:py-28">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 80% 0%, rgba(201,168,76,0.06), transparent 50%), #060606",
        }}
      />
      <Grain />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-16 top-8 h-[300px] w-[300px] rounded-full blur-3xl premium-breathe md:h-[400px] md:w-[400px]"
        style={{
          background:
            "radial-gradient(circle, rgba(201,168,76,0.26) 0%, rgba(201,168,76,0.08) 42%, transparent 70%)",
        }}
      />

      <div className="relative z-[2] mx-auto max-w-7xl px-3 sm:px-4 md:px-8">
        <div className="mb-12 max-w-3xl md:mb-14">
          <Reveal>
            <p className="text-[10px] uppercase tracking-[0.32em] text-[var(--gold)]">
              Events
            </p>
          </Reveal>
          <LineReveal delay={0.08} className="mt-4">
            <h2 className="font-display text-4xl leading-[1.1] text-[var(--cream)] md:text-5xl lg:text-[3.25rem]">
              Taste with us
            </h2>
          </LineReveal>
          <Reveal delay={0.18}>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[var(--muted)] md:text-base">
              Whiskey evenings, Champagne salons, festivals, and private launches.
            </p>
          </Reveal>
        </div>

        <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-5 md:grid-cols-2 md:gap-6">
          {featured.map((ev, i) => (
            <EventCard key={ev.id} ev={ev} index={i} />
          ))}
        </div>

        <Reveal delay={0.28}>
          <div className="mt-10">
            <Link
              href="/events"
              className="inline-flex h-11 items-center justify-center rounded-sm px-6 text-xs tracking-[0.2em] uppercase text-[var(--gold)] transition-colors duration-500 hover:bg-[var(--gold)]/10"
              style={{
                boxShadow: "inset 0 0 0 1px rgba(201,168,76,0.55)",
                transitionTimingFunction: EASE,
              }}
            >
              All events
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
