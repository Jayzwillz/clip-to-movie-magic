import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Bookmark, Trash2, Clock, Film, X, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMovieHistory } from "@/hooks/useMovieHistory";

export function HistoryModal() {
  const [open, setOpen] = useState(false);
  const {
    history,
    saved,
    collections,
    removeFromHistory,
    unsaveMovie,
    clearHistory,
  } = useMovieHistory();

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getCollectionMovies = (collectionId: string) => {
    const collection = collections.find((c) => c.id === collectionId);
    if (!collection) return [];
    return saved.filter((s) => collection.movieIds.includes(s.id));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-border hover:border-primary/50 gap-2"
        >
          <History className="w-4 h-4" />
          <span className="hidden sm:inline">History</span>
          {(history.length > 0 || saved.length > 0) && (
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs">
              {history.length + saved.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <History className="w-5 h-5 text-primary" />
            Your Movie Library
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="history" className="mt-4">
          <TabsList className="w-full bg-secondary/50">
            <TabsTrigger value="history" className="flex-1 gap-2">
              <Clock className="w-4 h-4" />
              History ({history.length})
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex-1 gap-2">
              <Bookmark className="w-4 h-4" />
              Saved ({saved.length})
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex-1 gap-2">
              <FolderOpen className="w-4 h-4" />
              Collections
            </TabsTrigger>
          </TabsList>

          {/* History Tab */}
          <TabsContent value="history" className="mt-4 max-h-[50vh] overflow-y-auto">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No identification history yet</p>
                <p className="text-sm">Movies you identify will appear here</p>
              </div>
            ) : (
              <>
                <div className="flex justify-end mb-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {history.map((movie) => (
                      <motion.div
                        key={movie.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border group"
                      >
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-12 h-18 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-18 bg-muted rounded flex items-center justify-center">
                            <Film className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {movie.title}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {movie.year} • {movie.rating}/10
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(movie.savedAt)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromHistory(movie.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </>
            )}
          </TabsContent>

          {/* Saved Tab */}
          <TabsContent value="saved" className="mt-4 max-h-[50vh] overflow-y-auto">
            {saved.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No saved movies yet</p>
                <p className="text-sm">Click the save button to add movies</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {saved.map((movie) => (
                    <motion.div
                      key={movie.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="relative group"
                    >
                      <a
                        href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt={movie.title}
                            className="w-full aspect-[2/3] object-cover rounded-lg border border-border"
                          />
                        ) : (
                          <div className="w-full aspect-[2/3] bg-muted rounded-lg border border-border flex items-center justify-center">
                            <Film className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                          <p className="text-sm font-medium text-foreground line-clamp-2">
                            {movie.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{movie.year}</p>
                        </div>
                      </a>
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => unsaveMovie(movie.tmdbId)}
                        className="absolute top-2 right-2 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="mt-4 max-h-[50vh] overflow-y-auto">
            <div className="space-y-4">
              {collections.map((collection) => {
                const collectionMovies = getCollectionMovies(collection.id);
                return (
                  <div key={collection.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                    <h3 className="font-medium text-foreground mb-3">
                      {collection.name}
                      <span className="ml-2 text-sm text-muted-foreground">
                        ({collectionMovies.length})
                      </span>
                    </h3>
                    {collectionMovies.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No movies in this collection
                      </p>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {collectionMovies.map((movie) => (
                          <a
                            key={movie.id}
                            href={`https://www.themoviedb.org/movie/${movie.tmdbId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0"
                          >
                            {movie.poster ? (
                              <img
                                src={movie.poster}
                                alt={movie.title}
                                className="w-16 h-24 object-cover rounded border border-border hover:border-primary transition-colors"
                              />
                            ) : (
                              <div className="w-16 h-24 bg-muted rounded border border-border flex items-center justify-center">
                                <Film className="w-6 h-6 text-muted-foreground" />
                              </div>
                            )}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
