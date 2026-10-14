import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  CirclePlay,
  Layers3,
  Search,
  ScanLine,
  Sparkles,
  Upload
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import FabricCard from '../components/fabric/FabricCard';
import { categories, fabrics } from '../data/fabrics';

const capabilities = [
  {
    icon: ScanLine,
    label: '01 / Repeat analysis',
    title: 'Find the rhythm',
    description: 'Estimate horizontal and vertical repeat periods from the image itself.',
    detail: 'Pixel-correlation heuristic'
  },
  {
    icon: Layers3,
    label: '02 / Tile reconstruction',
    title: 'Build a repeat preview',
    description: 'Inspect a candidate tile and see it repeated across the original dimensions.',
    detail: 'Classical image processing'
  },
  {
    icon: BrainCircuit,
    label: '03 / Color extraction',
    title: 'Read the palette',
    description: 'Explore the dominant colors calculated from the uploaded fabric sample.',
    detail: 'KMeans color clustering'
  }
];

const workflow = [
  { number: '01', title: 'Bring a sample', copy: 'Upload a clear JPG, PNG, or WebP textile image.' },
  { number: '02', title: 'Study its structure', copy: 'The analysis estimates periodicity and extracts a compact color palette.' },
  { number: '03', title: 'Review the output', copy: 'Compare the source, candidate tile, and repeated preview side by side.' }
];

const threads = [
  { left: '8%', top: '19%', delay: 0 },
  { left: '19%', top: '74%', delay: 1.4 },
  { left: '38%', top: '10%', delay: 2.2 },
  { left: '56%', top: '82%', delay: 0.7 },
  { left: '72%', top: '16%', delay: 1.9 },
  { left: '91%', top: '62%', delay: 0.3 }
];

function HomePage() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<(typeof categories)[number]>('All');
  const [guideOpen, setGuideOpen] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  useEffect(() => {
    if (!guideOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setGuideOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [guideOpen]);

  const filteredFabrics = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return fabrics.filter((item) => {
      const matchesQuery =
        item.name.toLowerCase().includes(lowerQuery) ||
        item.category.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery) ||
        item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery));
      return matchesQuery && (selectedCategory === 'All' || item.category === selectedCategory);
    });
  }, [query, selectedCategory]);

  const rise = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 22 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.65 } }
  };

  return (
    <div className="weaveai-home overflow-hidden bg-[#070B19] text-[#F4F5FF]">
      <section className="weaveai-hero relative isolate min-h-[680px] overflow-hidden border-b border-white/[0.08] lg:min-h-[740px]">
        <div className="weaveai-grid absolute inset-0 -z-20" aria-hidden="true" />
        <div className="weaveai-glow weaveai-glow-blue absolute -left-40 top-12 -z-10 h-[28rem] w-[28rem] rounded-full" aria-hidden="true" />
        <div className="weaveai-glow weaveai-glow-violet absolute -right-36 top-24 -z-10 h-[30rem] w-[30rem] rounded-full" aria-hidden="true" />
        {threads.map((thread, index) => (
          <motion.span
            key={index}
            className="weaveai-thread absolute -z-10 hidden h-24 w-px origin-top sm:block"
            style={{ left: thread.left, top: thread.top }}
            animate={reduceMotion ? undefined : { rotate: [0, 13, -9, 0], opacity: [0.12, 0.4, 0.18] }}
            transition={{ duration: 8 + index % 3, delay: thread.delay, repeat: Infinity, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        ))}

        <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-5 py-16 sm:px-8 lg:min-h-[740px] lg:grid-cols-[1.02fr_0.98fr] lg:gap-8 lg:px-10 lg:py-20">
          <div className="relative z-10 max-w-2xl">
            <motion.div
              variants={{
                hidden: { opacity: 0, y: reduceMotion ? 0 : 12 },
                visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.55 } }
              }}
              initial="hidden"
              animate="visible"
              className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-white/[0.045] px-3.5 py-2 text-[11px] font-medium tracking-[0.1em] text-cyan-100/90 shadow-[0_0_28px_rgba(71,134,255,0.08)]"
            >
              <Sparkles className="h-3.5 w-3.5 text-cyan-300" aria-hidden="true" />
              AN OPEN, LOCAL TEXTILE RESEARCH TOOL
            </motion.div>

            <motion.h1
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.13, delayChildren: 0.08 } }
              }}
              className="font-sans text-[clamp(3.1rem,7vw,6.45rem)] font-semibold leading-[0.94] tracking-[-0.075em] text-white"
            >
              {['Patterns', 'have a', 'language.'].map((word, index) => (
                <motion.span
                  key={word}
                  variants={{
                    hidden: { opacity: 0, y: reduceMotion ? 0 : 28, filter: reduceMotion ? 'blur(0px)' : 'blur(8px)' },
                    visible: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] } }
                  }}
                  className={`block ${index === 2 ? 'weaveai-gradient-text' : ''}`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.55 }}
              className="mt-7 max-w-xl text-[15px] leading-7 text-slate-300 sm:text-base"
            >
              WeaveAI turns a fabric photograph into a study of its repeating structure—so the
              craft behind every motif can be seen, tested, and preserved.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.6, delay: reduceMotion ? 0 : 0.7 }}
              className="mt-3 max-w-lg text-xs leading-6 text-slate-400"
            >
              A transparent image-processing baseline for academic exploration. No trained
              generative model or prediction is claimed.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, delay: reduceMotion ? 0 : 0.8 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/upload"
                className="weaveai-button-primary group inline-flex min-h-12 items-center gap-2.5 rounded-full px-5 text-sm font-semibold text-white"
              >
                <Upload className="h-4 w-4" aria-hidden="true" />
                Analyze a fabric
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[0.035] px-5 text-sm font-medium text-slate-200 transition hover:border-cyan-200/40 hover:bg-white/[0.08]"
              >
                <CirclePlay className="h-4 w-4 text-cyan-200" aria-hidden="true" />
                See the workflow
              </button>
            </motion.div>

            <motion.a
              href="#approach"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 1.15 }}
              className="mt-12 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-slate-400 transition hover:text-cyan-200"
            >
              Explore the approach <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
            </motion.a>
          </div>

          <motion.div
            initial={{ opacity: 0, x: reduceMotion ? 0 : 24, scale: reduceMotion ? 1 : 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.9, delay: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[570px]"
          >
            <div className="weaveai-image-halo absolute -inset-5 rounded-[2rem] blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#11182B] p-2 shadow-[0_30px_100px_rgba(0,0,0,0.46)]">
              <div className="relative aspect-[1.08/0.94] overflow-hidden rounded-[1.15rem]">
                <img
                  src="/fabric-library/ai-reconstruction-example.jpg"
                  alt="Reference photograph of a traditional textile sample, not a generated reconstruction"
                  className="absolute inset-0 h-full w-full object-cover"
                  {...{ fetchpriority: 'high' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#080C19]/95 via-[#080C19]/10 to-[#080C19]/15" />
                <div className="absolute inset-0 opacity-35" aria-hidden="true">
                  <div className="weaveai-scanline absolute inset-x-0 top-0 h-24" />
                  <svg viewBox="0 0 600 520" className="h-full w-full" fill="none">
                    <path d="M70 90H530M70 170H530M70 250H530M70 330H530M70 410H530M110 50V460M205 50V460M300 50V460M395 50V460M490 50V460" stroke="#8FEAFF" strokeOpacity=".28" strokeWidth="1" strokeDasharray="4 8" />
                    <path d="M205 170H395V330H205V170Z" stroke="#B9A0FF" strokeOpacity=".95" strokeWidth="2" />
                    <path d="M300 170V330M205 250H395" stroke="#63E5FF" strokeOpacity=".95" strokeWidth="2" />
                    <circle cx="205" cy="170" r="4" fill="#8FEAFF" />
                    <circle cx="395" cy="330" r="4" fill="#B9A0FF" />
                  </svg>
                </div>
                <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-[#080C19]/60 px-3 py-1.5 text-[10px] font-medium tracking-wide text-white/90 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_#67e8f9]" />
                  REFERENCE TEXTILE
                </div>
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-cyan-200">Pattern study / 001</p>
                    <p className="mt-1 font-serif text-2xl text-white sm:text-3xl">A closer look at the weave</p>
                  </div>
                  <div className="hidden rounded-xl border border-white/15 bg-[#080C19]/60 px-3 py-2 text-right backdrop-blur-md sm:block">
                    <p className="text-[9px] uppercase tracking-wider text-slate-400">Analysis</p>
                    <p className="mt-0.5 text-xs text-white">Repeat + palette</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between px-3 py-3 text-[10px] tracking-wide text-slate-400 sm:px-4">
                <span>REAL IMAGE · LOCAL ANALYSIS</span>
                <span className="text-cyan-200/80">NO GENERATED SAMPLE</span>
              </div>
            </div>
            <div className="absolute -bottom-4 -left-3 hidden rounded-2xl border border-white/10 bg-[#11182B]/90 px-4 py-3 shadow-xl backdrop-blur-xl sm:block lg:-left-8">
              <p className="text-[9px] uppercase tracking-[0.16em] text-slate-400">What the baseline measures</p>
              <p className="mt-1 text-xs font-medium text-white">Spatial repetition · pixel evidence</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="approach" className="relative border-b border-white/[0.07] bg-[#090E1D] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            className="mb-10 max-w-2xl"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">A closer look at the method</p>
            <h2 className="mt-4 font-sans text-3xl font-semibold tracking-[-0.045em] text-white sm:text-5xl">
              Image evidence, not black-box promises.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-slate-400">
              Each result comes from a visible, reproducible step in the current research baseline.
            </p>
          </motion.div>

          <div className="grid gap-3 md:grid-cols-3">
            {capabilities.map(({ icon: Icon, label, title, description, detail }, index) => (
              <motion.article
                key={title}
                variants={rise}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.18 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.1 }}
                className="weaveai-glass-card group rounded-2xl p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/25 hover:bg-white/[0.065]"
              >
                <div className="flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-200/15 bg-cyan-200/[0.07] text-cyan-200">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </div>
                  <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-slate-500">{label}</span>
                </div>
                <h3 className="mt-7 font-serif text-2xl text-white">{title}</h3>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-slate-400">{description}</p>
                <p className="mt-5 border-t border-white/[0.08] pt-4 text-[10px] uppercase tracking-[0.15em] text-cyan-100/65">
                  {detail}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden border-b border-white/[0.07] bg-[#070B19] px-5 py-20 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200">From photo to pattern</p>
            <h2 className="mt-4 font-sans text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
              Three steps.<br />A clearer textile story.
            </h2>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="mt-7 inline-flex items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-white"
            >
              Explore the workflow <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </motion.div>

          <div className="divide-y divide-white/[0.09]">
            {workflow.map((step, index) => (
              <motion.div
                key={step.number}
                variants={rise}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.35 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.08 }}
                className="grid gap-3 py-5 sm:grid-cols-[3rem_1fr] sm:gap-5"
              >
                <span className="font-mono text-xs text-cyan-200/70">{step.number}</span>
                <div>
                  <h3 className="text-base font-medium text-white">{step.title}</h3>
                  <p className="mt-1.5 max-w-lg text-sm leading-6 text-slate-400">{step.copy}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="fabric-search" className="bg-[#090E1D] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={rise}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">Reference library</p>
              <h2 className="mt-3 font-sans text-3xl font-semibold tracking-[-0.045em] text-white sm:text-4xl">
                Textiles worth a closer look.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Browse the bundled reference gallery. Reference cards are illustrative archive entries,
                not results produced by the reconstruction algorithm.
              </p>
            </div>
            <Link to="/gallery" className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-cyan-200 transition hover:text-white">
              Open the gallery <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </motion.div>

          <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-white/[0.09] bg-white/[0.035] p-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Search textile collection</span>
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-xl bg-transparent py-2.5 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus-visible:ring-2 focus-visible:ring-cyan-300/50"
                placeholder="Search patterns, weave types..."
              />
            </label>
            <div aria-label="Filter fabrics by category" className="flex max-w-full gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  aria-pressed={selectedCategory === category}
                  onClick={() => setSelectedCategory(category)}
                  className={`shrink-0 rounded-full border px-3 py-2 text-[11px] font-medium transition ${
                    selectedCategory === category
                      ? 'border-cyan-200/40 bg-cyan-200/10 text-cyan-100'
                      : 'border-white/[0.09] bg-white/[0.025] text-slate-400 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          <motion.div layout className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <AnimatePresence mode="popLayout">
              {filteredFabrics.length > 0 ? (
                filteredFabrics.map((item, index) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: reduceMotion ? 0 : -8 }}
                    transition={{ duration: reduceMotion ? 0 : 0.25, delay: reduceMotion ? 0 : index * 0.035 }}
                    className="weaveai-reference-card overflow-hidden rounded-xl"
                  >
                    <FabricCard item={item} />
                  </motion.div>
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="col-span-full rounded-2xl border border-dashed border-white/15 bg-white/[0.025] p-10 text-center text-sm text-slate-400"
                >
                  No textile matches your search. Try another category or keyword.
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {guideOpen && (
          <motion.div
            className="fixed inset-0 z-[100] grid place-items-center bg-[#030611]/80 p-4 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setGuideOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="guide-title"
              className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#10182B] p-6 shadow-2xl sm:p-8"
              initial={{ y: reduceMotion ? 0 : 16, scale: reduceMotion ? 1 : 0.98 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: reduceMotion ? 0 : 10, scale: reduceMotion ? 1 : 0.98 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-200">The current research baseline</p>
                  <h2 id="guide-title" className="mt-2 font-serif text-3xl text-white">From sample to study</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  aria-label="Close workflow guide"
                  className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-300"
                >
                  ×
                </button>
              </div>
              <ol className="mt-6 space-y-4 text-sm leading-6 text-slate-300">
                {workflow.map((step) => (
                  <li key={step.number} className="flex gap-3">
                    <span className="font-mono text-cyan-200">{step.number}</span>
                    <span><strong className="text-white">{step.title}.</strong> {step.copy}</span>
                  </li>
                ))}
              </ol>
              <p className="mt-5 rounded-xl border border-violet-200/10 bg-violet-200/[0.04] p-3 text-xs leading-5 text-violet-100/75">
                Repeat detection uses image correlations and seam checks. It is classical image processing,
                not a trained generative AI model.
              </p>
              <Link to="/upload" onClick={() => setGuideOpen(false)} className="weaveai-button-primary mt-6 inline-flex min-h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold text-white">
                Upload a sample <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HomePage;
