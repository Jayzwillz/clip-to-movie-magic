import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface YouTubeMetadata {
  title: string;
  description: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  captionsAvailable: boolean;
  captionsText: string;
  commentKeywords: string[];
}

interface MovieResult {
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
  movie: MovieResult;
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
  genres: string[];
}

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function getYouTubeMetadata(videoId: string): Promise<YouTubeMetadata> {
  const YOUTUBE_API_KEY = Deno.env.get("YOUTUBE_API_KEY");
  
  if (!YOUTUBE_API_KEY) {
    console.log("YouTube API key not found, falling back to oEmbed");
    return getYouTubeMetadataFallback(videoId);
  }

  try {
    const videoResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${YOUTUBE_API_KEY}`
    );
    
    if (!videoResponse.ok) {
      console.error("YouTube API error:", await videoResponse.text());
      return getYouTubeMetadataFallback(videoId);
    }

    const videoData = await videoResponse.json();
    
    if (!videoData.items || videoData.items.length === 0) {
      throw new Error("Video not found");
    }

    const snippet = videoData.items[0].snippet;
    
    const thumbnails = snippet.thumbnails;
    const thumbnail = thumbnails.maxres?.url || 
                      thumbnails.high?.url || 
                      thumbnails.medium?.url || 
                      thumbnails.default?.url ||
                      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const { captionsAvailable, captionsText } = await fetchCaptions(videoId, YOUTUBE_API_KEY);
    const commentKeywords = await fetchCommentKeywords(videoId, YOUTUBE_API_KEY);

    return {
      title: snippet.title || "",
      description: snippet.description || "",
      thumbnail,
      channelTitle: snippet.channelTitle || "",
      publishedAt: snippet.publishedAt || "",
      captionsAvailable,
      captionsText,
      commentKeywords,
    };
  } catch (error) {
    console.error("YouTube API error:", error);
    return getYouTubeMetadataFallback(videoId);
  }
}

async function getYouTubeMetadataFallback(videoId: string): Promise<YouTubeMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error("Failed to fetch video metadata");
    
    const data = await response.json();
    
    return {
      title: data.title || "",
      description: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: data.author_name || "",
      publishedAt: "",
      captionsAvailable: false,
      captionsText: "",
      commentKeywords: [],
    };
  } catch (error) {
    console.error("oEmbed error:", error);
    return {
      title: "",
      description: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: "",
      publishedAt: "",
      captionsAvailable: false,
      captionsText: "",
      commentKeywords: [],
    };
  }
}

async function fetchCaptions(videoId: string, apiKey: string): Promise<{ captionsAvailable: boolean; captionsText: string }> {
  try {
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );

    if (!captionsResponse.ok) {
      return { captionsAvailable: false, captionsText: "" };
    }

    const captionsData = await captionsResponse.json();
    
    if (!captionsData.items || captionsData.items.length === 0) {
      return { captionsAvailable: false, captionsText: "" };
    }

    return { 
      captionsAvailable: true, 
      captionsText: `[Captions available in ${captionsData.items.map((c: any) => c.snippet.language).join(", ")}]`
    };
  } catch (error) {
    console.error("Error fetching captions:", error);
    return { captionsAvailable: false, captionsText: "" };
  }
}

async function fetchCommentKeywords(videoId: string, apiKey: string): Promise<string[]> {
  try {
    const commentsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&order=relevance&key=${apiKey}`
    );

    if (!commentsResponse.ok) {
      return [];
    }

    const commentsData = await commentsResponse.json();
    
    if (!commentsData.items || commentsData.items.length === 0) {
      return [];
    }

    const commentTexts = commentsData.items.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    );

    return extractKeywordsFromComments(commentTexts);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

function extractKeywordsFromComments(comments: string[]): string[] {
  const allText = comments.join(" ").toLowerCase();
  
  const moviePatterns = [
    /(?:this is from|this movie is|the movie|from the film|scene from)\s+["']?([^"'\n.!?]+)["']?/gi,
    /["']([^"']+)["']\s+(?:movie|film)/gi,
  ];
  
  const keywords: Set<string> = new Set();
  
  for (const pattern of moviePatterns) {
    const matches = allText.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const cleaned = match[1].trim().slice(0, 50);
        if (cleaned.length > 2) {
          keywords.add(cleaned);
        }
      }
    }
  }

  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const fullText = comments.join(" ");
  const capitalizedMatches = fullText.matchAll(capitalizedPattern);
  const phraseCount = new Map<string, number>();
  
  for (const match of capitalizedMatches) {
    const phrase = match[1];
    const commonWords = ["The", "This", "That", "What", "When", "Where", "How", "Why", "I", "You", "He", "She", "It", "We", "They", "And", "But", "Or"];
    if (phrase.length > 3 && !commonWords.includes(phrase)) {
      phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
    }
  }
  
  for (const [phrase, count] of phraseCount) {
    if (count >= 2) {
      keywords.add(phrase.toLowerCase());
    }
  }

  return Array.from(keywords).slice(0, 10);
}

// Enhanced AI identification to return top 3 matches with confidence and reasons
async function identifyMoviesWithAI(metadata: YouTubeMetadata): Promise<{ matches: Array<{ movieTitle: string; confidence: number; reasons: string[] }>; detailedReasoning: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const contextParts: string[] = [];
  
  contextParts.push(`Video Title: ${metadata.title}`);
  contextParts.push(`Channel: ${metadata.channelTitle}`);
  
  if (metadata.publishedAt) {
    contextParts.push(`Published: ${metadata.publishedAt}`);
  }
  
  if (metadata.description) {
    const truncatedDesc = metadata.description.slice(0, 1000);
    contextParts.push(`Description: ${truncatedDesc}`);
  }
  
  contextParts.push(`Thumbnail URL: ${metadata.thumbnail}`);
  
  if (metadata.captionsAvailable) {
    contextParts.push(`Captions: ${metadata.captionsText}`);
  }
  
  if (metadata.commentKeywords.length > 0) {
    contextParts.push(`Keywords from comments: ${metadata.commentKeywords.join(", ")}`);
  }

  const prompt = `You are a movie identification expert. Based on the following video metadata from YouTube, identify the TOP 3 most likely movies this clip could be from, ranked by confidence.

${contextParts.join("\n")}

Analyze all available information carefully. Consider:
- The video title often contains the movie name
- Channel names that might indicate official movie channels
- Keywords from the description and comments
- Publication date may hint at the movie's era
- Comment keywords often mention the movie name directly

Respond with a JSON object containing:
1. "matches": An array of exactly 3 objects, each with:
   - "movieTitle": The exact movie title (just the title, no year)
   - "confidence": A percentage (integer 1-100) of how confident you are. The sum should be close to 100.
   - "reasons": An array of 2-4 short strings explaining why this movie matches (e.g., "Title mentions 'The Flash'", "Comments reference 'Barry Allen'", "Channel is official Warner Bros")
2. "detailedReasoning": A human-readable paragraph (3-4 sentences) explaining your analysis process and key evidence

The first match should be your best guess with highest confidence.
Only respond with valid JSON, no additional text.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You are a movie identification expert. Always respond with valid JSON only." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AI API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded. Please try again in a moment.");
    }
    if (response.status === 402) {
      throw new Error("AI service payment required. Please check your account.");
    }
    throw new Error("Failed to identify movie with AI");
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  
  if (!content) throw new Error("No response from AI");
  
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  }
  
  const result = JSON.parse(jsonStr);
  return {
    matches: result.matches,
    detailedReasoning: result.detailedReasoning,
  };
}

async function getMovieFromTMDB(movieTitle: string): Promise<MovieResult | null> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY is not configured");

  const searchUrl = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(movieTitle)}`;
  const searchResponse = await fetch(searchUrl);
  
  if (!searchResponse.ok) {
    console.error("TMDB search error:", await searchResponse.text());
    return null;
  }

  const searchData = await searchResponse.json();
  
  if (!searchData.results || searchData.results.length === 0) {
    return null;
  }

  const movie = searchData.results[0];
  
  const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
  const detailsResponse = await fetch(detailsUrl);
  
  if (!detailsResponse.ok) {
    console.error("TMDB details error:", await detailsResponse.text());
    return null;
  }

  const details = await detailsResponse.json();
  
  let trailer: string | null = null;
  if (details.videos?.results) {
    const officialTrailer = details.videos.results.find(
      (v: any) => v.type === "Trailer" && v.site === "YouTube"
    );
    if (officialTrailer) {
      trailer = `https://www.youtube.com/watch?v=${officialTrailer.key}`;
    }
  }

  const posterUrl = details.poster_path 
    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
    : "";

  return {
    title: details.title,
    year: details.release_date ? details.release_date.split("-")[0] : "Unknown",
    poster: posterUrl,
    plot: details.overview || "No plot available.",
    rating: details.vote_average ? details.vote_average.toFixed(1) : "N/A",
    runtime: details.runtime ? `${details.runtime} min` : "Unknown",
    genres: details.genres?.map((g: any) => g.name) || [],
    trailer,
    tmdbId: details.id,
    aiReasoning: "",
  };
}

// Fetch streaming providers from TMDB
async function getStreamingProviders(tmdbId: number): Promise<StreamingProvider[]> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  if (!TMDB_API_KEY) return [];

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/watch/providers?api_key=${TMDB_API_KEY}`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    // Try to get US providers, fallback to first available region
    const regionData = data.results?.US || Object.values(data.results || {})[0] as any;
    
    if (!regionData) return [];

    const providers: StreamingProvider[] = [];
    const seen = new Set<string>();

    // Add subscription (flatrate) providers
    if (regionData.flatrate) {
      for (const p of regionData.flatrate.slice(0, 4)) {
        if (!seen.has(p.provider_name)) {
          seen.add(p.provider_name);
          providers.push({
            name: p.provider_name,
            logo: `https://image.tmdb.org/t/p/original${p.logo_path}`,
            link: regionData.link || "",
            type: "subscription",
          });
        }
      }
    }

    // Add rent providers
    if (regionData.rent) {
      for (const p of regionData.rent.slice(0, 2)) {
        if (!seen.has(p.provider_name)) {
          seen.add(p.provider_name);
          providers.push({
            name: p.provider_name,
            logo: `https://image.tmdb.org/t/p/original${p.logo_path}`,
            link: regionData.link || "",
            type: "rent",
          });
        }
      }
    }

    return providers.slice(0, 6);
  } catch (error) {
    console.error("Error fetching streaming providers:", error);
    return [];
  }
}

// Fetch similar movies from TMDB
async function getSimilarMovies(tmdbId: number): Promise<SimilarMovie[]> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  if (!TMDB_API_KEY) return [];

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${tmdbId}/similar?api_key=${TMDB_API_KEY}&page=1`
    );
    
    if (!response.ok) return [];
    
    const data = await response.json();
    
    return (data.results || []).slice(0, 6).map((m: any) => ({
      id: m.id,
      title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w200${m.poster_path}` : "",
      year: m.release_date ? m.release_date.split("-")[0] : "Unknown",
      genres: [], // Genre info not included in similar endpoint
    }));
  } catch (error) {
    console.error("Error fetching similar movies:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();
    
    if (!videoUrl) {
      return new Response(
        JSON.stringify({ error: "Video URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      return new Response(
        JSON.stringify({ error: "Invalid YouTube URL. Please provide a valid YouTube video link." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Processing video:", videoId);

    // Get YouTube metadata
    const metadata = await getYouTubeMetadata(videoId);
    console.log("Metadata fetched:", {
      title: metadata.title,
      channel: metadata.channelTitle,
      captionsAvailable: metadata.captionsAvailable,
      commentKeywords: metadata.commentKeywords.length,
    });

    // Use AI to identify top 3 movies with confidence
    const aiResult = await identifyMoviesWithAI(metadata);
    console.log("AI identified matches:", aiResult.matches.map(m => m.movieTitle));

    // Get TMDB data for all matches in parallel
    const moviePromises = aiResult.matches.map(async (match) => {
      const movieData = await getMovieFromTMDB(match.movieTitle);
      if (!movieData) return null;
      
      movieData.aiReasoning = aiResult.detailedReasoning;
      
      return {
        movie: movieData,
        confidence: match.confidence,
        matchReasons: match.reasons,
      } as MovieMatch;
    });

    const allMatches = (await Promise.all(moviePromises)).filter((m): m is MovieMatch => m !== null);
    
    if (allMatches.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Could not find movie information. The AI suggested: " + aiResult.matches[0]?.movieTitle,
          aiReasoning: aiResult.detailedReasoning 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const bestMatch = allMatches[0];

    // Fetch streaming providers and similar movies for the best match
    const [streamingProviders, similarMovies] = await Promise.all([
      getStreamingProviders(bestMatch.movie.tmdbId),
      getSimilarMovies(bestMatch.movie.tmdbId),
    ]);

    return new Response(
      JSON.stringify({ 
        movie: bestMatch.movie, 
        videoThumbnail: metadata.thumbnail,
        matches: allMatches,
        streamingProviders,
        similarMovies,
        detailedReasoning: aiResult.detailedReasoning,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
