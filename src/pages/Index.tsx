import { useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { UrlInput } from "@/components/UrlInput";
import { LoadingState } from "@/components/LoadingState";
import { MovieResult } from "@/components/MovieResult";
import { supabase } from "@/integrations/supabase/client";

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

interface IdentifyResponse {
  movie?: MovieData;
  videoThumbnail?: string;
  error?: string;
  aiReasoning?: string;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ movie: MovieData; videoThumbnail: string } | null>(null);

  const handleIdentify = async (videoUrl: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke<IdentifyResponse>(
        "identify-movie",
        { body: { videoUrl } }
      );

      if (functionError) {
        throw new Error(functionError.message || "Failed to identify movie");
      }

      if (data?.error) {
        setError(data.error);
        return;
      }

      if (data?.movie && data?.videoThumbnail) {
        setResult({
          movie: data.movie,
          videoThumbnail: data.videoThumbnail,
        });
      } else {
        setError("Could not identify the movie from this video. Please try a different clip.");
      }
    } catch (err) {
      console.error("Error:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        <HeroSection />

        {!result ? (
          <>
            <UrlInput
              onSubmit={handleIdentify}
              isLoading={isLoading}
              error={error}
            />
            {isLoading && <LoadingState />}
          </>
        ) : (
          <div className="space-y-8">
            <MovieResult movie={result.movie} videoThumbnail={result.videoThumbnail} />
            <div className="text-center">
              <button
                onClick={handleReset}
                className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
              >
                Identify another movie
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-24 text-center text-sm text-muted-foreground">
          <p>Powered by AI & TMDB</p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
