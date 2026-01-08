import { motion } from "framer-motion";
import { Film } from "lucide-react";

const loadingMessages = [
  "Analyzing video metadata...",
  "Identifying movie scenes...",
  "Consulting the film database...",
  "Almost there...",
];

export function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16"
    >
      {/* Film Reel Animation */}
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 rounded-full border-4 border-primary/30 flex items-center justify-center"
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full border-4 border-dashed border-primary flex items-center justify-center"
          >
            <Film className="w-8 h-8 text-primary" />
          </motion.div>
        </motion.div>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse-slow" />
      </div>

      {/* Loading Text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <motion.p
          key={Math.random()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-lg font-medium text-foreground mb-2"
        >
          Identifying your movie...
        </motion.p>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-sm text-muted-foreground"
        >
          This may take a few seconds
        </motion.p>
      </motion.div>

      {/* Progress Dots */}
      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-primary"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
