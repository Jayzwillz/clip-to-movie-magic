import { useState, useEffect, useCallback } from "react";

export interface SavedMovie {
  id: string;
  tmdbId: number;
  title: string;
  year: string;
  poster: string;
  rating: string;
  genres: string[];
  savedAt: number;
  videoThumbnail?: string;
  confidence?: number;
}

export interface MovieCollection {
  id: string;
  name: string;
  createdAt: number;
  movieIds: string[];
}

interface MovieHistoryState {
  history: SavedMovie[];
  saved: SavedMovie[];
  collections: MovieCollection[];
}

const STORAGE_KEY = "clipit-movie-data";

const defaultState: MovieHistoryState = {
  history: [],
  saved: [],
  collections: [
    { id: "watch-later", name: "Watch Later", createdAt: Date.now(), movieIds: [] },
    { id: "found-from-clips", name: "Found from Clips", createdAt: Date.now(), movieIds: [] },
  ],
};

function loadState(): MovieHistoryState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Error loading movie history:", error);
  }
  return defaultState;
}

function saveState(state: MovieHistoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Error saving movie history:", error);
  }
}

export function useMovieHistory() {
  const [state, setState] = useState<MovieHistoryState>(loadState);

  // Persist state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Add to history (auto-track identified movies)
  const addToHistory = useCallback((movie: Omit<SavedMovie, "id" | "savedAt">) => {
    setState((prev) => {
      const id = `${movie.tmdbId}-${Date.now()}`;
      const newMovie: SavedMovie = { ...movie, id, savedAt: Date.now() };
      
      // Prevent duplicates - check if same movie was added in last 5 seconds
      const recentDuplicate = prev.history.find(
        (h) => h.tmdbId === movie.tmdbId && Date.now() - h.savedAt < 5000
      );
      if (recentDuplicate) return prev;

      return {
        ...prev,
        history: [newMovie, ...prev.history].slice(0, 50), // Keep last 50
      };
    });
  }, []);

  // Save a movie
  const saveMovie = useCallback((movie: Omit<SavedMovie, "id" | "savedAt">) => {
    setState((prev) => {
      // Check if already saved
      if (prev.saved.some((s) => s.tmdbId === movie.tmdbId)) {
        return prev;
      }

      const id = `saved-${movie.tmdbId}`;
      const newMovie: SavedMovie = { ...movie, id, savedAt: Date.now() };

      return {
        ...prev,
        saved: [newMovie, ...prev.saved],
      };
    });
  }, []);

  // Unsave a movie
  const unsaveMovie = useCallback((tmdbId: number) => {
    setState((prev) => ({
      ...prev,
      saved: prev.saved.filter((s) => s.tmdbId !== tmdbId),
      // Also remove from all collections
      collections: prev.collections.map((c) => ({
        ...c,
        movieIds: c.movieIds.filter((id) => !id.includes(`${tmdbId}`)),
      })),
    }));
  }, []);

  // Check if movie is saved
  const isMovieSaved = useCallback(
    (tmdbId: number) => state.saved.some((s) => s.tmdbId === tmdbId),
    [state.saved]
  );

  // Add movie to collection
  const addToCollection = useCallback((collectionId: string, movieId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId && !c.movieIds.includes(movieId)
          ? { ...c, movieIds: [...c.movieIds, movieId] }
          : c
      ),
    }));
  }, []);

  // Remove movie from collection
  const removeFromCollection = useCallback((collectionId: string, movieId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.map((c) =>
        c.id === collectionId
          ? { ...c, movieIds: c.movieIds.filter((id) => id !== movieId) }
          : c
      ),
    }));
  }, []);

  // Create new collection
  const createCollection = useCallback((name: string) => {
    const id = `collection-${Date.now()}`;
    setState((prev) => ({
      ...prev,
      collections: [
        ...prev.collections,
        { id, name, createdAt: Date.now(), movieIds: [] },
      ],
    }));
    return id;
  }, []);

  // Delete collection
  const deleteCollection = useCallback((collectionId: string) => {
    setState((prev) => ({
      ...prev,
      collections: prev.collections.filter((c) => c.id !== collectionId),
    }));
  }, []);

  // Remove from history
  const removeFromHistory = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.id !== id),
    }));
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    setState((prev) => ({
      ...prev,
      history: [],
    }));
  }, []);

  return {
    history: state.history,
    saved: state.saved,
    collections: state.collections,
    addToHistory,
    saveMovie,
    unsaveMovie,
    isMovieSaved,
    addToCollection,
    removeFromCollection,
    createCollection,
    deleteCollection,
    removeFromHistory,
    clearHistory,
  };
}
