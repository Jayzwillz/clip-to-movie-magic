import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Clock, Calendar, ExternalLink, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExplainabilityPanel } from "@/components/ExplainabilityPanel";
import { ConfidenceRanking } from "@/components/ConfidenceRanking";
import { WhereToWatch } from "@/components/WhereToWatch";
import { SimilarMovies } from "@/components/SimilarMovies";
import { SaveButton } from "@/components/SaveButton";
import { useMovieHistory } from "@/hooks/useMovieHistory";

interface MovieData {
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
}

interface MovieMatch {
  movie: MovieData;
  confidence: number;
  matchReasons: string[];
}

interface StreamingProvider {
  name: string;
  logo: string;
  link: string;
  type: "subscription" | "rent" | "buy";
}

interface SimilarMovie {
  id: number;
  title: string;
  poster: string;
  year: string;
}

interface MovieResultProps {
  movie: MovieData;
  videoThumbnail: string;
  matches?: MovieMatch[];
  streamingProviders?: StreamingProvider[];
  similarMovies?: SimilarMovie[];
  detailedReasoning?: string;
}

export function MovieResult({ 
  movie: initialMovie, 
  videoThumbnail, 
  matches = [],
  streamingProviders = [],
  similarMovies = [],
  detailedReasoning = "",
}: MovieResultProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { addToHistory } = useMovieHistory();
  
  const currentMatch = matches[selectedIndex] || { movie: initialMovie, confidence: 100, matchReasons: [] };
  const movie = currentMatch.movie;

  // Add to history on mount
  useEffect(() => {
    addToHistory({
      tmdbId: initialMovie.tmdbId,
      title: initialMovie.title,
      year: initialMovie.year,
      poster: initialMovie.poster,
      rating: initialMovie.rating,
      genres: initialMovie.genres,
      videoThumbnail,
      confidence: matches[0]?.confidence,
    });
  }, [initialMovie.tmdbId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="w-full max-w-4xl mx-auto space-y-6"
    >
      {/* Confidence Ranking */}
      {matches.length > 1 && (
        <ConfidenceRanking
          matches={matches}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
        />
      )}

      {/* Main Card */}
      <div className="card-elevated overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <motion.div
            key={movie.tmdbId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="md:w-1/3 relative"
          >
            {movie.poster ? (
              <img src={movie.poster} alt={movie.title} className="w-full h-64 md:h-full object-cover" />
            ) : (
              <div className="w-full h-64 md:h-full bg-muted flex items-center justify-center">
                <Film className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent md:bg-gradient-to-r" />
          </motion.div>

          <motion.div
            key={`content-${movie.tmdbId}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 p-6 md:p-8"
          >
            <div className="mb-4">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-gradient-gold mb-2">
                {movie.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{movie.year}</span>
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{movie.runtime}</span>
                <span className="flex items-center gap-1.5"><Star className="w-4 h-4 text-primary fill-primary" />{movie.rating}/10</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {movie.genres.map((genre) => (
                <Badge key={genre} variant="secondary" className="bg-secondary/80 text-secondary-foreground border border-border">
                  {genre}
                </Badge>
              ))}
            </div>

            <p className="text-foreground/80 leading-relaxed mb-6">{movie.plot}</p>

            <div className="flex flex-wrap gap-3">
              <SaveButton movie={{
                tmdbId: movie.tmdbId,
                title: movie.title,
                year: movie.year,
                poster: movie.poster,
                rating: movie.rating,
                genres: movie.genres,
                videoThumbnail,
              }} />
              {movie.trailer && (
                <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 glow-gold">
                  <a href={movie.trailer} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />Watch Trailer
                  </a>
                </Button>
              )}
              <Button asChild variant="outline" className="border-border hover:bg-secondary">
                <a href={`https://www.themoviedb.org/movie/${movie.tmdbId}`} target="_blank" rel="noopener noreferrer">
                  View on TMDB
                </a>
              </Button>
            </div>
          </motion.div>
        </div>

        <div className="border-t border-border p-4 bg-secondary/30">
          <p className="text-xs text-muted-foreground mb-2">Analyzed from:</p>
          <img src={videoThumbnail} alt="Video thumbnail" className="w-32 h-18 object-cover rounded-md border border-border" />
        </div>
      </div>

      {/* Explainability Panel */}
      {currentMatch.matchReasons.length > 0 && (
        <ExplainabilityPanel matchReasons={currentMatch.matchReasons} detailedReasoning={detailedReasoning} />
      )}

      {/* Where to Watch */}
      <WhereToWatch providers={streamingProviders} movieTitle={movie.title} />

      {/* Similar Movies */}
      <SimilarMovies movies={similarMovies} />
    </motion.div>
  );
}
