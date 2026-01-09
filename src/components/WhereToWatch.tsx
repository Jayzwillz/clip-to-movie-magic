import { motion } from "framer-motion";
import { Tv, ExternalLink } from "lucide-react";

interface StreamingProvider {
  name: string;
  logo: string;
  link: string;
  type: "subscription" | "rent" | "buy";
}

interface WhereToWatchProps {
  providers: StreamingProvider[];
  movieTitle: string;
}

export function WhereToWatch({ providers, movieTitle }: WhereToWatchProps) {
  if (providers.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-secondary/30 border border-border">
        <div className="flex items-center gap-3 mb-2">
          <Tv className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium text-foreground">Where to Watch</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Streaming availability information is not available for this movie in your region.
        </p>
      </div>
    );
  }

  const subscriptionProviders = providers.filter((p) => p.type === "subscription");
  const rentProviders = providers.filter((p) => p.type === "rent" || p.type === "buy");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-secondary/30 border border-border"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Tv className="w-4 h-4 text-primary" />
        </div>
        <h3 className="font-medium text-foreground">Where to Watch</h3>
      </div>

      <div className="space-y-4">
        {/* Subscription Services */}
        {subscriptionProviders.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Stream</p>
            <div className="flex flex-wrap gap-2">
              {subscriptionProviders.map((provider, index) => (
                <motion.a
                  key={provider.name}
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-6 h-6 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {provider.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              ))}
            </div>
          </div>
        )}

        {/* Rent/Buy Services */}
        {rentProviders.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground mb-2">Rent or Buy</p>
            <div className="flex flex-wrap gap-2">
              {rentProviders.map((provider, index) => (
                <motion.a
                  key={provider.name}
                  href={provider.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.05 }}
                  className="group flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary/50 transition-all"
                >
                  <img
                    src={provider.logo}
                    alt={provider.name}
                    className="w-6 h-6 rounded object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <span className="text-sm font-medium text-foreground">
                    {provider.name}
                  </span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        Availability may vary by region. Data from JustWatch via TMDB.
      </p>
    </motion.div>
  );
}
