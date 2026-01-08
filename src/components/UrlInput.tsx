import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Youtube, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
}

export function UrlInput({ onSubmit, isLoading, error }: UrlInputProps) {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit(url.trim());
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    return /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(url);
  };

  const showUrlWarning = url.length > 0 && !isValidYouTubeUrl(url);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="relative">
        {/* Input Container */}
        <div className="relative group">
          {/* Glow Effect */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 via-gold-glow/50 to-primary/50 rounded-2xl blur opacity-20 group-hover:opacity-40 group-focus-within:opacity-60 transition-opacity duration-300" />
          
          {/* Input */}
          <div className="relative flex items-center bg-card rounded-xl border border-border overflow-hidden">
            <div className="flex items-center pl-4 text-muted-foreground">
              <Youtube className="w-5 h-5" />
            </div>
            <Input
              type="url"
              placeholder="Paste a YouTube video link..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="flex-1 border-0 bg-transparent text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 py-6 px-4 text-base"
            />
            <div className="pr-2">
              <Button
                type="submit"
                disabled={isLoading || !url.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-5 rounded-lg glow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-4 h-4 mr-2" />
                Identify
              </Button>
            </div>
          </div>
        </div>

        {/* URL Warning */}
        {showUrlWarning && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3 text-sm text-gold-dim"
          >
            <AlertCircle className="w-4 h-4" />
            Please enter a valid YouTube URL
          </motion.p>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
          >
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          </motion.div>
        )}
      </form>

      {/* Helper Text */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-muted-foreground mt-4"
      >
        Supports YouTube videos, shorts, and embeds
      </motion.p>
    </motion.div>
  );
}
