import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMovieHistory, SavedMovie, MovieCollection } from "@/hooks/useMovieHistory";

interface SaveButtonProps {
  movie: Omit<SavedMovie, "id" | "savedAt">;
}

export function SaveButton({ movie }: SaveButtonProps) {
  const { saveMovie, unsaveMovie, isMovieSaved, addToCollection, collections, saved } = useMovieHistory();
  const [justSaved, setJustSaved] = useState(false);
  const isSaved = isMovieSaved(movie.tmdbId);

  const handleSave = () => {
    if (isSaved) {
      unsaveMovie(movie.tmdbId);
    } else {
      saveMovie(movie);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    }
  };

  const handleAddToCollection = (collectionId: string) => {
    const movieId = `saved-${movie.tmdbId}`;
    // Make sure movie is saved first
    if (!isSaved) {
      saveMovie(movie);
    }
    addToCollection(collectionId, movieId);
  };

  const savedMovie = saved.find((s) => s.tmdbId === movie.tmdbId);

  return (
    <div className="flex items-center gap-2">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant={isSaved ? "default" : "outline"}
          size="sm"
          onClick={handleSave}
          className={`relative overflow-hidden ${
            isSaved
              ? "bg-primary text-primary-foreground"
              : "border-border hover:border-primary/50"
          }`}
        >
          <AnimatePresence mode="wait">
            {justSaved ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </motion.div>
            ) : (
              <motion.div
                key="heart"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1.5"
              >
                <Heart className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
                <span>{isSaved ? "Saved" : "Save"}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      {/* Add to Collection Dropdown */}
      {isSaved && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="border-border">
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover border-border">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              Add to Collection
            </div>
            <DropdownMenuSeparator className="bg-border" />
            {collections.map((collection) => {
              const isInCollection = savedMovie && collection.movieIds.includes(savedMovie.id);
              return (
                <DropdownMenuItem
                  key={collection.id}
                  onClick={() => handleAddToCollection(collection.id)}
                  className={`cursor-pointer ${isInCollection ? "text-primary" : ""}`}
                >
                  <span className="flex items-center gap-2">
                    {isInCollection && <Check className="w-3 h-3" />}
                    {collection.name}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
