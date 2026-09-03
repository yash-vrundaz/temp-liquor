"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { SITE } from "@/lib/utils";

const TOC = [
  { id: "summary", label: "Summary" },
  { id: "challenge", label: "Challenge" },
  { id: "research", label: "Research" },
  { id: "insights", label: "Insights" },
  { id: "artifacts", label: "Artifacts" },
  { id: "scope", label: "Scope" },
  { id: "roadmap", label: "Roadmap" },
  { id: "recommend", label: "Recommend" },
] as const;

const META = [
  { label: "Client", value: SITE.name },
  { label: "Engagement", value: "Immersive commerce prototype" },
  { label: "Phase", value: "01 — Research & prototype" },
  { label: "Status", value: "Ready for review" },
  { label: "Date", value: "July 2026" },
  { label: "Focus", value: "3D showroom · AR · multi-branch" },
] as const;

const METHODS = [
  {
    title: "Competitive pattern scan",
    detail:
      "Reviewed premium spirits digital experiences — photography-led catalogs, CGI bottle viewers, and walkable brand showrooms — to separate must-have proofs from later polish.",
  },
  {
    title: "Retail journey mapping",
    detail:
      "Mapped discover → browse → inspect → place (AR) → choose branch → checkout for a local liquor shopper, to find where immersion actually changes the decision.",
  },
  {
    title: "Feasibility spikes",
    detail:
      "Built constrained prototypes for showroom walking, bottle inspection, AR preview, and branch stock — enough fidelity for stakeholder judgment without production systems.",
  },
  {
    title: "Asset strategy workshop",
    detail:
      "Defined a photo-first merchandising rule and a swap path for production bottle models, so CGI spend can follow validation instead of preceding it.",
  },
] as const;

const INSIGHTS = [
  {
    id: "01",
    title: "Immersion is a differentiator — only if photography still leads",
    body: "High-end liquor commerce wins trust with studio product imagery. 3D and AR earn their place when they help customers inspect presence and place a bottle in real space, not when they replace the catalog.",
    action: "Keep PLP photo-led. Put interactive 3D on product detail, showroom shelves, and AR preview.",
    image: "/products/market/buffalo-trace-bourbon.jpg",
    contain: true,
  },
  {
    id: "02",
    title: "A showroom proves the concept before denser CGI environments",
    body: "Brand walkable stores succeed on atmosphere, shelf density, and click-to-product. Full physics and photoreal interiors are Phase 3 spend — not Phase 1 proof.",
    action: "Validate aisle walk + shelf open + add intent before commissioning denser store shells.",
    image: "/store/downtown-shelves.jpg",
    contain: false,
  },
  {
    id: "03",
    title: "AR must be platform-native to feel real on phones",
    body: "Customers expect “view in your space” via the same paths used by major brands. Prototype models can be temporary; the delivery architecture cannot.",
    action: "Ship AR preview now with replaceable models. Commission branded assets after direction is approved.",
    image: "/products/market/makers-mark-bourbon.jpg",
    contain: true,
  },
  {
    id: "04",
    title: "Local stock and pickup belong in the first prototype",
    body: "Neighborhood liquor retail converts on branch truth, events, and pickup — not only shipping. Multi-store UX is core product, not an afterthought.",
    action: "Prototype three NY branches with local inventory and fulfillment before live payments.",
    image: "/store/downtown-interior.jpg",
    contain: false,
  },
] as const;

const JOURNEY = [
  { step: "01", label: "Discover", note: "Brand atmosphere" },
  { step: "02", label: "Browse", note: "Photo catalog" },
  { step: "03", label: "Inspect", note: "3D detail" },
  { step: "04", label: "Place", note: "AR in space" },
  { step: "05", label: "Locate", note: "Branch stock" },
  { step: "06", label: "Commit", note: "Checkout mock" },
] as const;

const ARTIFACTS = [
  {
    title: "Brand atmosphere",
    caption: "Mood and lighting reference for the digital flagship",
    image: "/hero-maison-bar.png",
    contain: false,
  },
  {
    title: "Shelf density",
    caption: "Visual benchmark for showroom aisle credibility",
    image: "/store/bar-wall.jpg",
    contain: false,
  },
  {
    title: "Product photography",
    caption: "Catalog standard — photography before 3D",
    image: "/products/market/don-julio-blanco.jpg",
    contain: true,
  },
  {
    title: "Store presence",
    caption: "Multi-location retail story for branch UX",
    image: "/store/uptown-maison.jpg",
    contain: false,
  },
  {
    title: "Tasting / events",
    caption: "In-person ritual that digital must support",
    image: "/store/uptown-wine-room.jpg",
    contain: false,
  },
  {
    title: "Cellar prestige",
    caption: "Premium destination cues for loyalty & VIP",
    image: "/store/uptown-cellar.jpg",
    contain: false,
  },
] as const;

const IN_SCOPE = [
  "Stakeholder-ready frontend prototype",
  "Brand landing, catalog, and product detail",
  "Walkable showroom and AR preview",
  "Branch inventory and checkout simulation",
  "Events and favourites for demo narrative",
  "Visual system aligned to Sam’s mood",
] as const;

const OUT_OF_SCOPE = [
  "Production auth, CMS, inventory APIs",
  "Commissioned photoreal models per SKU",
  "Legal age-gate / geofence enforcement",
  "Full assortment in every category",
] as const;

const PHASES = [
  {
    phase: "01",
    name: "Prototype",
    status: "Complete",
    when: "Now",
    outcome: "Prove immersion, AR path, and multi-branch story without backend risk.",
    work: [
      "Clickable experience surfaces",
      "Photo-first + 3D/AR spikes",
      "Three-branch inventory mock",
      "Visual direction locked",
    ],
  },
  {
    phase: "02",
    name: "Depth",
    status: "Next",
    when: "Next cycle",
    outcome: "Fill assortment gaps and raise artifact fidelity where demos feel thin.",
    work: [
      "Category fill (wine, gin, rum…)",
      "Aligned bottle models per SKU",
      "Stronger branch / cart resolve",
      "Loyalty & events polish",
    ],
  },
  {
    phase: "03",
    name: "Platform",
    status: "Vision",
    when: "Production",
    outcome: "Replace mocks with live commerce, content ops, and brand-grade assets.",
    work: [
      "Auth, orders, inventory sync",
      "CMS for catalog & locations",
      "Studio-commissioned bottles",
      "Clubs, gifting, analytics",
    ],
  },
] as const;

const RECOMMENDATIONS = [
  {
    n: "01",
    title: "Approve Phase 1 as the product direction",
    detail:
      "Confirm cinematic brand, showroom, AR preview, and multi-branch stock as the differentiators before increasing assortment or CGI spend.",
  },
  {
    n: "02",
    title: "Choose one Phase 2 primary investment",
    detail:
      "Either fill empty categories first, or commission photoreal hero bottles first. Doing both at equal priority blurs the next review.",
  },
  {
    n: "03",
    title: "Name production owners early",
    detail:
      "Inventory truth, merchandising content, and alcohol-retail payment compliance should have named owners before Phase 3 architecture.",
  },
] as const;

function fade(reduce: boolean | null, delay = 0) {
  if (reduce) return {};
  return {
    initial: { opacity: 0, y: 16 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-40px" },
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as const },
  };
}

export function PrototypePresentation() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-screen bg-[#0a0908] text-[#f2ebe0]">
      {/* Masthead */}
      <header className="border-b border-[#c9a962]/20">
        <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-4 px-6 py-5 md:px-10">
          <div>
            <p className="font-display text-[1.35rem] tracking-[0.02em] text-[#f2ebe0]">
              {SITE.name}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.28em] text-[#c9a962]">
              Research &amp; prototype brief
            </p>
          </div>
          <p className="hidden text-right text-[11px] leading-relaxed text-[#9a9488] sm:block">
            Document · R&amp;D-01
            <br />
            Confidential · Stakeholder review
          </p>
        </div>
      </header>

      {/* TOC */}
      <nav
        aria-label="Sections"
        className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0a0908]/94 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[1120px] gap-0.5 overflow-x-auto px-6 py-2 md:px-10">
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-[#9a9488] transition hover:text-[#f2ebe0]"
            >
              {item.label}
            </a>
          ))}
        </div>
      </nav>

      {/* Cover */}
      <section className="relative min-h-[78vh] overflow-hidden border-b border-white/[0.06]">
        <Image
          src="/store/uptown-maison.jpg"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#0a0908]/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0908] via-[#0a0908]/50 to-[#0a0908]/30" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0908]/85 via-[#0a0908]/35 to-transparent" />

        <div className="relative mx-auto flex min-h-[78vh] max-w-[1120px] flex-col justify-end px-6 pb-16 pt-24 md:px-10 md:pb-20">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-3xl"
          >
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#c9a962]">
              Agency research brief
            </p>
            <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] text-[#f2ebe0]">
              Immersive liquor commerce —
              <em className="not-italic text-[#e4c878]"> what to prove before we build</em>
            </h1>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.8] text-[#c4bbae] md:text-base">
              A structured R&amp;D brief for {SITE.name}: the business challenge, the research
              methods, the insights that shaped Phase 1, and the phased investment from prototype
              to platform.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Project meta strip */}
      <section className="border-b border-white/[0.06] bg-[#0e0d0b]">
        <div className="mx-auto grid max-w-[1120px] grid-cols-2 gap-px bg-white/[0.06] sm:grid-cols-3 lg:grid-cols-6">
          {META.map((m) => (
            <div key={m.label} className="bg-[#0e0d0b] px-5 py-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a7340]">{m.label}</p>
              <p className="mt-2 text-[13px] leading-snug text-[#f2ebe0]">{m.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Executive summary */}
      <section id="summary" className="scroll-mt-16 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">
                01 · Summary
              </p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[#f2ebe0]">
                Executive summary
              </h2>
            </div>
            <div className="space-y-6 text-[15px] leading-[1.85] text-[#a39c90]">
              <p className="text-lg leading-[1.7] text-[#e8e0d4]">
                Generic e-commerce will not differentiate a multi-location liquor retailer.
                Customers expect cinematic brand presence, credible product imagery, the ability to
                inspect bottles in 3D / AR, and clarity on which store can fulfill them.
              </p>
              <p>
                Phase 1 is a frontend prototype that isolates those risks. It does not claim to be
                a finished commerce platform. It is a research instrument: stakeholders can judge
                direction, depth, and investment priorities before backend, CGI, and catalog scale
                spend.
              </p>
              <div className="grid gap-4 border-t border-white/[0.08] pt-8 sm:grid-cols-3">
                {[
                  { k: "Risk reduced", v: "Wrong immersion bet" },
                  { k: "Validated now", v: "Showroom · AR · branches" },
                  { k: "Deferred", v: "APIs · full CGI · CMS" },
                ].map((item) => (
                  <div key={item.k}>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-[#8a7340]">{item.k}</p>
                    <p className="mt-2 text-sm text-[#f2ebe0]">{item.v}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Challenge */}
      <section id="challenge" className="scroll-mt-16 border-b border-white/[0.06] bg-[#0e0d0b]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="grid gap-12 lg:grid-cols-[240px_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">
                02 · Challenge
              </p>
              <h2 className="mt-4 font-display text-3xl leading-tight text-[#f2ebe0]">
                The problem we set out to answer
              </h2>
            </div>
            <div>
              <blockquote className="border-l-2 border-[#c9a962] pl-6 font-display text-2xl leading-snug text-[#f2ebe0] md:text-[1.85rem]">
                How do we prove an immersive, multi-branch liquor experience is worth building —
                before we fund production systems and studio assets?
              </blockquote>
              <div className="mt-10 grid gap-6 md:grid-cols-2">
                {[
                  {
                    t: "Business constraint",
                    d: "Immersive 3D and AR are expensive to get wrong. Stakeholder confidence must come before CGI and platform budgets.",
                  },
                  {
                    t: "User need",
                    d: "Shoppers want trust (real photos), presence (inspect / place), and locality (which store has it, pickup vs delivery).",
                  },
                  {
                    t: "Brand need",
                    d: "Sam’s must feel like a destination maison online — not a generic dark-mode catalog with bottle thumbnails.",
                  },
                  {
                    t: "Prototype job",
                    d: "Make the end-to-end story clickable enough to approve or redirect Phase 2 investment with clarity.",
                  },
                ].map((c) => (
                  <div key={c.t} className="border border-white/[0.07] bg-[#0a0908]/50 p-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#c9a962]">{c.t}</p>
                    <p className="mt-3 text-sm leading-relaxed text-[#a39c90]">{c.d}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Research methods */}
      <section id="research" className="scroll-mt-16 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">03 · Research</p>
            <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
              How we investigated
            </h2>
            <p className="mt-4 text-[15px] leading-[1.8] text-[#a39c90]">
              Methods chosen to answer investment questions — not to produce academic research
              theater.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-px overflow-hidden border border-white/[0.08] bg-white/[0.08] md:grid-cols-2">
            {METHODS.map((m, i) => (
              <motion.div
                key={m.title}
                {...fade(reduce, i * 0.04)}
                className="bg-[#0a0908] p-7 md:p-8"
              >
                <p className="font-display text-4xl text-[#c9a962]/35">
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-3 font-display text-xl text-[#f2ebe0]">{m.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#a39c90]">{m.detail}</p>
              </motion.div>
            ))}
          </div>

          {/* Journey */}
          <motion.div {...fade(reduce)} className="mt-16">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#8a7340]">
              Primary journey under test
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {JOURNEY.map((j) => (
                <div
                  key={j.step}
                  className="border border-white/[0.08] px-4 py-5 text-center"
                >
                  <p className="text-[10px] tracking-[0.18em] text-[#c9a962]">{j.step}</p>
                  <p className="mt-2 font-display text-lg text-[#f2ebe0]">{j.label}</p>
                  <p className="mt-1 text-[11px] text-[#9a9488]">{j.note}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Insights */}
      <section id="insights" className="scroll-mt-16 border-b border-white/[0.06] bg-[#0e0d0b]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">04 · Insights</p>
            <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
              What we learned — and what it changed
            </h2>
          </motion.div>

          <div className="mt-14 space-y-8">
            {INSIGHTS.map((insight) => (
              <motion.article
                key={insight.id}
                {...fade(reduce)}
                className="grid overflow-hidden border border-white/[0.08] lg:grid-cols-[1fr_320px]"
              >
                <div className="flex flex-col justify-center p-7 md:p-10">
                  <p className="text-[11px] tracking-[0.22em] text-[#c9a962]">
                    Insight {insight.id}
                  </p>
                  <h3 className="mt-3 font-display text-2xl leading-snug text-[#f2ebe0] md:text-[1.65rem]">
                    {insight.title}
                  </h3>
                  <p className="mt-4 text-[15px] leading-[1.8] text-[#a39c90]">{insight.body}</p>
                  <p className="mt-6 bg-[#c9a962]/10 px-4 py-3 text-sm leading-relaxed text-[#e4c878]">
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[#c9a962]">
                      Decision{" "}
                    </span>
                    <span className="mt-1 block text-[#f2ebe0]/95">{insight.action}</span>
                  </p>
                </div>
                <div className="relative min-h-[220px] bg-[#12110f] lg:min-h-full">
                  <Image
                    src={insight.image}
                    alt=""
                    fill
                    className={insight.contain ? "object-contain p-10" : "object-cover"}
                    sizes="320px"
                  />
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Artifacts / evidence board */}
      <section id="artifacts" className="scroll-mt-16 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">
                05 · Artifacts
              </p>
              <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
                Evidence board
              </h2>
              <p className="mt-4 text-[15px] leading-[1.8] text-[#a39c90]">
                Reference imagery that informed mood, density, photography standard, and branch
                story. These are research artifacts — not page destinations.
              </p>
            </div>
          </motion.div>

          <div className="mt-12 columns-1 gap-4 sm:columns-2 lg:columns-3">
            {ARTIFACTS.map((a, i) => (
              <motion.figure
                key={a.title}
                {...fade(reduce, i * 0.03)}
                className="mb-4 break-inside-avoid overflow-hidden border border-white/[0.07] bg-[#12110f]"
              >
                <div
                  className={`relative ${
                    i % 3 === 1 ? "aspect-[4/5]" : i % 3 === 2 ? "aspect-square" : "aspect-[16/11]"
                  }`}
                >
                  <Image
                    src={a.image}
                    alt={a.caption}
                    fill
                    className={a.contain ? "object-contain p-8" : "object-cover"}
                    sizes="(max-width: 640px) 100vw, 33vw"
                  />
                </div>
                <figcaption className="border-t border-white/[0.06] px-4 py-3">
                  <p className="text-sm text-[#f2ebe0]">{a.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-[#9a9488]">{a.caption}</p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </section>

      {/* Scope */}
      <section id="scope" className="scroll-mt-16 border-b border-white/[0.06] bg-[#0e0d0b]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">06 · Scope</p>
            <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
              What Phase 1 includes — and deliberately excludes
            </h2>
          </motion.div>

          <div className="mt-12 grid gap-5 lg:grid-cols-2">
            <motion.div {...fade(reduce)} className="border border-[#c9a962]/35 p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#c9a962]">In scope</p>
              <ul className="mt-6 space-y-4">
                {IN_SCOPE.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 border-b border-white/[0.06] pb-4 text-sm leading-relaxed text-[#e8e0d4] last:border-0 last:pb-0"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#c9a962]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
            <motion.div {...fade(reduce)} className="border border-white/[0.08] p-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#9a9488]">Out of scope</p>
              <ul className="mt-6 space-y-4">
                {OUT_OF_SCOPE.map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 border-b border-white/[0.06] pb-4 text-sm leading-relaxed text-[#9a9488] last:border-0 last:pb-0"
                  >
                    <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#4a453c]" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section id="roadmap" className="scroll-mt-16 border-b border-white/[0.06]">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">07 · Roadmap</p>
            <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
              Phased investment
            </h2>
            <p className="mt-4 text-[15px] leading-[1.8] text-[#a39c90]">
              Each phase has a single job. Completing Phase 1 unlocks informed decisions about
              depth and platform spend.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-4 lg:grid-cols-3">
            {PHASES.map((p, i) => (
              <motion.article
                key={p.phase}
                {...fade(reduce, i * 0.06)}
                className={`flex flex-col border p-7 ${
                  p.status === "Complete"
                    ? "border-[#c9a962]/45 bg-[#c9a962]/[0.06]"
                    : "border-white/[0.08]"
                }`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="font-display text-5xl text-[#c9a962]/40">{p.phase}</p>
                  <span
                    className={`text-[10px] uppercase tracking-[0.18em] ${
                      p.status === "Complete"
                        ? "text-[#6d9b7a]"
                        : p.status === "Next"
                          ? "text-[#e4c878]"
                          : "text-[#9a9488]"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-2xl text-[#f2ebe0]">{p.name}</h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-[#8a7340]">
                  {p.when}
                </p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#a39c90]">{p.outcome}</p>
                <ul className="mt-6 space-y-2 border-t border-white/[0.08] pt-5">
                  {p.work.map((w) => (
                    <li key={w} className="text-[13px] text-[#d8d0c4]">
                      — {w}
                    </li>
                  ))}
                </ul>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Recommendations */}
      <section id="recommend" className="scroll-mt-16">
        <div className="mx-auto max-w-[1120px] px-6 py-20 md:px-10 md:py-24">
          <motion.div {...fade(reduce)} className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#c9a962]">
              08 · Recommend
            </p>
            <h2 className="mt-4 font-display text-3xl text-[#f2ebe0] md:text-4xl">
              Ask of the client
            </h2>
            <p className="mt-4 text-[15px] leading-[1.8] text-[#a39c90]">
              Three decisions unlock Phase 2 cleanly.
            </p>
          </motion.div>

          <ol className="mt-12 space-y-0 border-t border-white/[0.08]">
            {RECOMMENDATIONS.map((r, i) => (
              <motion.li
                key={r.n}
                {...fade(reduce, i * 0.05)}
                className="grid gap-4 border-b border-white/[0.08] py-8 md:grid-cols-[88px_1fr] md:gap-10"
              >
                <span className="font-display text-4xl text-[#c9a962]">{r.n}</span>
                <div>
                  <h3 className="font-display text-xl text-[#f2ebe0] md:text-2xl">{r.title}</h3>
                  <p className="mt-3 max-w-2xl text-[15px] leading-[1.8] text-[#a39c90]">
                    {r.detail}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>

          <motion.div
            {...fade(reduce)}
            className="mt-16 flex flex-wrap items-center justify-between gap-6 border border-white/[0.08] bg-[#0e0d0b] px-6 py-6 md:px-8"
          >
            <div>
              <p className="font-display text-xl text-[#f2ebe0]">Ready when you are</p>
              <p className="mt-1 text-sm text-[#9a9488]">
                Review this brief, then explore the live prototype for hands-on context.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center border border-[#c9a962]/50 px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-[#c9a962] transition hover:bg-[#c9a962]/10"
            >
              Open live storefront
            </Link>
          </motion.div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] bg-[#070706]">
        <div className="mx-auto flex max-w-[1120px] flex-col gap-2 px-6 py-8 text-[11px] text-[#6f6a62] md:flex-row md:justify-between md:px-10">
          <p>
            {SITE.name} · R&amp;D-01 · Prototype research brief
          </p>
          <p>Confidential · Must be 21+ · Simulated commerce only</p>
        </div>
      </footer>
    </div>
  );
}
