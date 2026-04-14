import { motion } from 'framer-motion';

export const Greeting = () => {
  return (
    <div
      key="overview"
      className="mx-auto mb-10 flex size-full max-w-4xl flex-col justify-center px-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="second-brain-panel overflow-hidden rounded-[32px] px-6 py-8 text-left md:px-10 md:py-10"
      >
        <div className="mb-4 text-[11px] uppercase tracking-[0.34em] text-[#c4ab84]">
          Second Brain
        </div>
        <div className="second-brain-title max-w-2xl text-4xl font-semibold text-[#f7eedf] md:text-5xl">
          Build a living memory from notes, sources, and hard-won decisions.
        </div>
        <div className="mt-4 max-w-2xl text-sm leading-6 text-[#cfbea6] md:text-base">
          Read from your source library, distill the signal, and keep the markdown vault tidy enough to trust later.
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-[#e7d7bf]">
          <span className="rounded-full border border-[#4f4336] bg-[#241c16] px-3 py-1.5">
            Summaries
          </span>
          <span className="rounded-full border border-[#4f4336] bg-[#241c16] px-3 py-1.5">
            Cross-links
          </span>
          <span className="rounded-full border border-[#4f4336] bg-[#241c16] px-3 py-1.5">
            Decision memory
          </span>
          <span className="rounded-full border border-[#4f4336] bg-[#241c16] px-3 py-1.5">
            Source tracking
          </span>
        </div>
      </motion.div>
    </div>
  );
};
