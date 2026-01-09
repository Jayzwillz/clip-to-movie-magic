import { motion } from "framer-motion";
import { Trophy, Medal } from "lucide-react";

interface MovieMatch {
  movie: {
    title: string;
    year: string;
    poster: string;
    tmdbId: number;
  };
  confidence: number;
  matchReasons: string[];
}

interface ConfidenceRankingProps {
  matches: MovieMatch[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

export function ConfidenceRanking({ matches, selectedIndex, onSelect }: ConfidenceRankingProps) {
  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-primary" />;
      case 1:
        return <Medal className="w-4 h-4 text-muted-foreground" />;
      case 2:
        return <Medal className="w-4 h-4 text-muted-foreground/60" />;
      default:
        return null;
    }
  };

  const getRankLabel = (index: number) => {
    switch (index) {
      case 0:
        return "Best Match";
      case 1:
        return "Second Guess";
      case 2:
        return "Third Guess";
      default:
        return `Match ${index + 1}`;
    }
  };

  const getRankEmoji = (index: number) => {
    switch (index) {
      case 0:
        return "🎬";
      case 1:
        return "🥈";
      case 2:
        return "🥉";
      default:
        return "🎥";
    }
  };

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">
        Identification Confidence
      </h3>
      <div className="space-y-2">
        {matches.map((match, index) => (
          <motion.button
            key={match.movie.tmdbId}
            onClick={() => onSelect(index)}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
              selectedIndex === index
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50"
            }`}
          >
            {/* Rank Icon */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-lg">{getRankEmoji(index)}</span>
            </div>

            {/* Movie Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {getRankLabel(index)}
                </span>
                {getRankIcon(index)}
              </div>
              <p className={`font-medium truncate ${
                selectedIndex === index ? "text-primary" : "text-foreground"
              }`}>
                {match.movie.title}
              </p>
            </div>

            {/* Confidence Bar */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="w-16 h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${match.confidence}%` }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`h-full rounded-full ${
                    index === 0
                      ? "bg-primary"
                      : index === 1
                      ? "bg-muted-foreground"
                      : "bg-muted-foreground/50"
                  }`}
                />
              </div>
              <span className={`text-sm font-medium w-10 text-right ${
                selectedIndex === index ? "text-primary" : "text-muted-foreground"
              }`}>
                {match.confidence}%
              </span>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
