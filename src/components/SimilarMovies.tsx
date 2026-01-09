import { motion } from "framer-motion";
import { Sparkles, Film, ExternalLink } from "lucide-react";

interface SimilarMovie {
  id: number;
  title: string;
  poster: string;
  year: string;
}

interface SimilarMoviesProps {
  movies: SimilarMovie[];
}

export function SimilarMovies({ movies }: SimilarMoviesProps) {
  if (movies.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="p-4 rounded-xl bg-secondary/30 border border-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-medium text-foreground">Similar Movies</h3>
          <p className="text-xs text-muted-foreground">
            You might also enjoy these
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {movies.map((movie, index) => (
          <motion.a
            key={movie.id}
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="group relative overflow-hidden rounded-lg border border-border bg-card"
          >
            {movie.poster ? (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full aspect-[2/3] object-cover"
              />
            ) : (
              <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                <Film className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
              <p className="text-xs font-medium text-foreground line-clamp-2">
                {movie.title}
              </p>
              <p className="text-xs text-muted-foreground">{movie.year}</p>
              <ExternalLink className="absolute top-2 right-2 w-3 h-3 text-primary" />
            </div>
          </motion.a>
        ))}
      </div>
    </motion.div>
  );
}
