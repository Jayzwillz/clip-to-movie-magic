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
    // Fetch video details
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
    
    // Get highest resolution thumbnail
    const thumbnails = snippet.thumbnails;
    const thumbnail = thumbnails.maxres?.url || 
                      thumbnails.high?.url || 
                      thumbnails.medium?.url || 
                      thumbnails.default?.url ||
                      `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // Fetch captions availability
    const { captionsAvailable, captionsText } = await fetchCaptions(videoId, YOUTUBE_API_KEY);

    // Fetch comments and extract keywords
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
  // Using oEmbed API as fallback (no API key needed)
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
    // Check for available captions
    const captionsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${apiKey}`
    );

    if (!captionsResponse.ok) {
      console.log("Captions API returned error, likely disabled for this video");
      return { captionsAvailable: false, captionsText: "" };
    }

    const captionsData = await captionsResponse.json();
    
    if (!captionsData.items || captionsData.items.length === 0) {
      return { captionsAvailable: false, captionsText: "" };
    }

    // Captions exist but downloading requires OAuth, so we just note availability
    // The YouTube Data API doesn't allow downloading captions with just an API key
    // We would need OAuth to actually download caption content
    const englishCaption = captionsData.items.find(
      (item: any) => item.snippet.language === "en" || item.snippet.language?.startsWith("en")
    );
    
    return { 
      captionsAvailable: true, 
      captionsText: englishCaption 
        ? `[Captions available in ${captionsData.items.map((c: any) => c.snippet.language).join(", ")}]`
        : `[Captions available in ${captionsData.items.map((c: any) => c.snippet.language).join(", ")}]`
    };
  } catch (error) {
    console.error("Error fetching captions:", error);
    return { captionsAvailable: false, captionsText: "" };
  }
}

async function fetchCommentKeywords(videoId: string, apiKey: string): Promise<string[]> {
  try {
    // Fetch top comments
    const commentsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=50&order=relevance&key=${apiKey}`
    );

    if (!commentsResponse.ok) {
      console.log("Comments API returned error, likely disabled for this video");
      return [];
    }

    const commentsData = await commentsResponse.json();
    
    if (!commentsData.items || commentsData.items.length === 0) {
      return [];
    }

    // Extract all comment texts
    const commentTexts = commentsData.items.map(
      (item: any) => item.snippet.topLevelComment.snippet.textDisplay
    );

    // Extract keywords from comments
    const keywords = extractKeywordsFromComments(commentTexts);
    
    return keywords;
  } catch (error) {
    console.error("Error fetching comments:", error);
    return [];
  }
}

function extractKeywordsFromComments(comments: string[]): string[] {
  const allText = comments.join(" ").toLowerCase();
  
  // Common movie-related terms to look for
  const moviePatterns = [
    /(?:this is from|this movie is|the movie|from the film|scene from)\s+["']?([^"'\n.!?]+)["']?/gi,
    /["']([^"']+)["']\s+(?:movie|film)/gi,
    /(?:love this scene|best scene|favorite scene|iconic scene)/gi,
  ];
  
  const keywords: Set<string> = new Set();
  
  // Look for movie mentions
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

  // Extract frequent capitalized phrases (potential movie titles)
  const capitalizedPattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
  const fullText = comments.join(" ");
  const capitalizedMatches = fullText.matchAll(capitalizedPattern);
  const phraseCount = new Map<string, number>();
  
  for (const match of capitalizedMatches) {
    const phrase = match[1];
    // Filter common words
    const commonWords = ["The", "This", "That", "What", "When", "Where", "How", "Why", "I", "You", "He", "She", "It", "We", "They", "And", "But", "Or"];
    if (phrase.length > 3 && !commonWords.includes(phrase)) {
      phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
    }
  }
  
  // Add frequently mentioned phrases
  for (const [phrase, count] of phraseCount) {
    if (count >= 2) {
      keywords.add(phrase.toLowerCase());
    }
  }

  return Array.from(keywords).slice(0, 10);
}

async function identifyMovieWithAI(metadata: YouTubeMetadata): Promise<{ movieTitle: string; reasoning: string }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const contextParts: string[] = [];
  
  contextParts.push(`Video Title: ${metadata.title}`);
  contextParts.push(`Channel: ${metadata.channelTitle}`);
  
  if (metadata.publishedAt) {
    contextParts.push(`Published: ${metadata.publishedAt}`);
  }
  
  if (metadata.description) {
    // Truncate description if too long
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

  const prompt = `You are a movie identification expert. Based on the following video metadata from YouTube, identify the most likely movie being shown in this clip.

${contextParts.join("\n")}

Analyze all available information to determine which movie this clip is from. Consider:
- The video title often contains the movie name
- Channel names that might indicate official movie channels
- Keywords from the description and comments
- Publication date may hint at the movie's era
- Comment keywords often mention the movie name directly

Respond with a JSON object containing:
1. "movieTitle": The exact movie title (just the title, no year)
2. "reasoning": A brief explanation (2-3 sentences) of why you identified this movie, citing the specific evidence from the metadata

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

    // Get YouTube metadata using YouTube Data API v3
    const metadata = await getYouTubeMetadata(videoId);
    console.log("Metadata fetched:", {
      title: metadata.title,
      channel: metadata.channelTitle,
      captionsAvailable: metadata.captionsAvailable,
      commentKeywords: metadata.commentKeywords.length,
    });

    // Use AI to identify the movie with enriched metadata
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
