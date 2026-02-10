import { Play } from "lucide-react";

function Video() {
  return (
    <section className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            See KeywordsDB in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how to find profitable keywords in under 60 seconds.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="relative aspect-video overflow-hidden rounded-xl border bg-card shadow-lg ring-1 ring-primary/10">
            {/* Replace the src with your actual video embed URL */}
            {/* <iframe
              className="absolute inset-0 h-full w-full"
              src="https://www.youtube.com/embed/YOUR_VIDEO_ID"
              title="KeywordsDB Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            /> */}

            {/* Placeholder until video is ready */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-linear-to-br from-muted/50 to-muted/80">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/30 transition-transform hover:scale-110">
                <Play className="h-7 w-7 fill-primary-foreground text-primary-foreground ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">Video coming soon</p>
            </div>
          </div>
        </div>

        {/* Video script plan (for your reference, not rendered) */}
        {/* 
          0-10s: Hook — "Finding profitable keywords shouldn't cost $99/mo"
          10-25s: Type a keyword, results stream in real-time
          25-40s: Add filters — volume 1K-10K, CPC > $2, sort by competition
          40-55s: Highlight data — "300M keywords from real Google Ads data"
          55-70s: Show speed — switch searches, instant results
          70-85s: Pricing — "Start free, then just $9/mo"
          85-90s: CTA — "Try 10 searches free at keywordsdb.com"
        */}
      </div>
    </section>
  );
}

export default Video;
