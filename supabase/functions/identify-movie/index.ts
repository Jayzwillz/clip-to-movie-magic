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
  // Using oEmbed API (no API key needed)
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  
  try {
    const response = await fetch(oembedUrl);
    if (!response.ok) throw new Error("Failed to fetch video metadata");
    
    const data = await response.json();
    
    return {
      title: data.title || "",
      description: "",  // oEmbed doesn't provide description
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: data.author_name || "",
    };
  } catch (error) {
    console.error("oEmbed error:", error);
    // Fallback with just the thumbnail
    return {
      title: "",
      description: "",
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelTitle: "",
    };
  }
}

async function identifyMovieWithAI(metadata: YouTubeMetadata): Promise<{ movieTitle: string; reasoning: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const prompt = `You are a movie identification expert. Based on the following video metadata from YouTube, identify the most likely movie being shown in this clip.

Video Title: ${metadata.title}
Channel: ${metadata.channelTitle}
Thumbnail URL: ${metadata.thumbnail}

Analyze the video title, channel name, and any contextual clues to determine which movie this clip is from. Consider:
- Common patterns like "Movie Name - Scene Name" or "Movie (Year) - Clip"
- Channel names that might indicate official movie channels
- Keywords that suggest specific movies

Respond with a JSON object containing:
1. "movieTitle": The exact movie title (just the title, no year)
2. "reasoning": A brief explanation (1-2 sentences) of why you identified this movie

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
  
  // Parse JSON from response (handle potential markdown code blocks)
  let jsonStr = content.trim();
  if (jsonStr.startsWith("```")) {
    jsonStr = jsonStr.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
  }
  
  const result = JSON.parse(jsonStr);
  return {
    movieTitle: result.movieTitle,
    reasoning: result.reasoning,
  };
}

async function getMovieFromTMDB(movieTitle: string): Promise<MovieResult | null> {
  const TMDB_API_KEY = Deno.env.get("TMDB_API_KEY");
  if (!TMDB_API_KEY) throw new Error("TMDB_API_KEY is not configured");

  // Search for the movie
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
  
  // Get detailed movie info
  const detailsUrl = `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}&append_to_response=videos`;
  const detailsResponse = await fetch(detailsUrl);
  
  if (!detailsResponse.ok) {
    console.error("TMDB details error:", await detailsResponse.text());
    return null;
  }

  const details = await detailsResponse.json();
  
  // Find official trailer
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

    // Extract video ID
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
    console.log("Metadata:", metadata);

    // Use AI to identify the movie
    const aiResult = await identifyMovieWithAI(metadata);
    console.log("AI identified:", aiResult.movieTitle);

    // Get movie details from TMDB
    const movieData = await getMovieFromTMDB(aiResult.movieTitle);
    
    if (!movieData) {
      return new Response(
        JSON.stringify({ 
          error: "Could not find movie information. The AI suggested: " + aiResult.movieTitle,
          aiReasoning: aiResult.reasoning 
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    movieData.aiReasoning = aiResult.reasoning;

    return new Response(
      JSON.stringify({ movie: movieData, videoThumbnail: metadata.thumbnail }),
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
