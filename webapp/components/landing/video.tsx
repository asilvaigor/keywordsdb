"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function Video() {
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState >= 3) setReady(true);
    if (video.duration) setDuration(video.duration);

    const onCanPlay = () => setReady(true);
    const onTimeUpdate = () => setProgress(video.currentTime);
    const onDurationChange = () => setDuration(video.duration);
    const onLoadedMetadata = () => setDuration(video.duration);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("durationchange", onDurationChange);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("durationchange", onDurationChange);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const revealControls = () => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  };

  const hideControls = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setShowControls(false);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const handleVideoClick = () => {
    revealControls();
    togglePlay();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Number(e.target.value);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.play();
  };

  const progressPercent = duration ? (progress / duration) * 100 : 0;

  return (
    <section className="py-20 md:py-28 bg-muted/20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            See KeywordsDB in action
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Watch how to find profitable keywords in under 90 seconds.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <fieldset
            className="relative overflow-hidden rounded-xl"
            onMouseEnter={revealControls}
            onMouseLeave={hideControls}
            onMouseMove={revealControls}
            onTouchStart={revealControls}
          >
            <div
              className="relative w-full"
              style={{ aspectRatio: "1664 / 1080" }}
            >
              {!ready && (
                <Skeleton className="absolute inset-0 h-full w-full rounded-xl" />
              )}
              <video
                ref={videoRef}
                className={cn(
                  "absolute inset-0 h-full w-full cursor-pointer",
                  !ready && "hidden",
                )}
                src="https://cdn.keywordsdb.com/landing.mp4"
                autoPlay
                loop
                muted
                playsInline
                onClick={handleVideoClick}
              />
            </div>

            <div
              className={cn(
                "absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent px-3 pb-3 pt-8 transition-all duration-200",
                showControls
                  ? "translate-y-0 opacity-100"
                  : "translate-y-1 opacity-0",
              )}
            >
              {/* Progress bar with invisible range input overlay for seeking */}
              <div className="relative">
                <Progress value={progressPercent} aria-label="Video progress" />
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  step={0.1}
                  value={progress}
                  onChange={handleSeek}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  aria-label="Seek video"
                />
              </div>

              <div className="mt-1 flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="h-8 w-8 text-white hover:bg-white/10 hover:text-primary"
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRestart}
                  className="h-8 w-8 text-white hover:bg-white/10 hover:text-primary"
                  aria-label="Restart"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <span className="ml-auto text-xs text-white/80 tabular-nums">
                  {formatTime(progress)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </fieldset>
        </div>
      </div>
    </section>
  );
}

export default Video;
