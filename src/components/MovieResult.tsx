import { motion } from "framer-motion";
import { Star, Clock, Calendar, ExternalLink, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MovieResultProps {
  movie: {
    title: string;
    year: string;
    poster: string;
    plot: string;
    rating: string;
    runtime: string;
    genres: string[];
    trailer: string | null;
    tmdbId: number;
    aiReasoning: string;
  };
  videoThumbnail: string;
}

export function MovieResult({ movie, videoThumbnail }: MovieResultProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto"
    >
      {/* AI Reasoning Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20"
      >
        <div className="flex items-start gap-3">
          <Film className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-primary mb-1">AI Analysis</p>
            <p className="text-sm text-muted-foreground">{movie.aiReasoning}</p>
          </div>
        </div>
      </motion.div>

      {/* Main Card */}
      <div className="card-elevated overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Poster */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="md:w-1/3 relative"
          >
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-64 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-64 md:h-full bg-muted flex items-center justify-center">
                <Film className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent md:bg-gradient-to-r" />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-1 p-6 md:p-8"
          >
            {/* Title & Year */}
            <div className="mb-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
                {movie.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {movie.year}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {movie.runtime}
                </span>
                <span className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  {movie.rating}/10
                </span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((genre) => (
                <Badge
                  key={genre}
                  variant="secondary"
                  className="bg-secondary/80 text-secondary-foreground border border-border"
                >
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Plot */}
            <p className="text-foreground/80 leading-relaxed mb-6">
              {movie.plot}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              {movie.trailer && (
                <Button
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold"
                >
                  <a href={movie.trailer} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Watch Trailer
                  </a>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                className="border-border hover:bg-secondary"
              >
                <a
                  href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on TMDB
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Video Thumbnail Preview */}
        <div className="border-t border-border p-4 bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-2">Analyzed from:</p>
          <img
            src={videoThumbnail}
            alt="Video thumbnail"
            className="w-32 h-18 object-cover rounded-md border border-border"
          />
        </div>
      </div>
    </motion.div>
  );
}
