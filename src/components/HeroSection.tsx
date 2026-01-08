import { motion } from "framer-motion";
import { Film, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center mb-12"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        className="inline-flex items-center gap-3 mb-6"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-gold-glow flex items-center justify-center glow-gold">
            <Film className="w-7 h-7 text-primary-foreground" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-1 rounded-2xl border border-primary/30"
          />
        </div>
        <h1 className="font-display text-5xl md:text-6xl font-bold text-gradient-gold">
          Clipit
        </h1>
      </motion.div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-4"
      >
        Identify any movie from a YouTube clip
      </motion.p>

      {/* Feature Pills */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap justify-center gap-3"
      >
        {["AI-Powered", "Instant Results", "TMDB Verified"].map((feature, i) => (
          <motion.span
            key={feature}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.1 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/50 border border-border text-sm text-muted-foreground"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            {feature}
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}
