"use client";

import playAnimation from "../../../../../../../public/lottie/playButton.json";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import React, { useState, useEffect, useRef } from "react";

export interface PlayButtonSkipProps {
  audioSrc: string;
  startTime: number;
  endTime: number;
  onNextCall: () => void;
  onPrevCall: () => void;
  isNextDisabled: boolean;
  isPrevDisabled: boolean;
  title: string;
}

export function PlayButtonSkip({
  audioSrc,
  startTime,
  endTime,
  onNextCall,
  onPrevCall,
  isNextDisabled,
  isPrevDisabled,
  title,
}: PlayButtonSkipProps) {
  const defaultAudio = "/calls/example-call-yt.mp3";
  const isValidAudio = (src: string) => /\.(mp3|wav|ogg)$/i.test(src || "");
  const src = isValidAudio(audioSrc) ? audioSrc : defaultAudio;

  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lottieRef = useRef<LottieRefCurrentProps | null>(null);
  const [progress, setProgress] = useState(0); // 0..1 within the visible window
  const [duration, setDuration] = useState(0); // full audio duration in seconds
  const [dragging, setDragging] = useState(false);

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
      lottieRef.current?.pause();
    } else {
      void el.play();
      lottieRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.currentTime = Math.max(0, startTime || 0);
    } catch {}
  }, [startTime]);

  // keep progress updated and clamp playback to endTime if provided
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      const cur = el.currentTime;
      const rangeStart = Math.max(0, startTime || 0);
      const hasEnd = Number.isFinite(endTime) && endTime > rangeStart;
      if (hasEnd && cur >= endTime) {
        el.pause();
        lottieRef.current?.pause();
        setIsPlaying(false);
        setProgress(1);
        return;
      }
      const denom = Math.max(0.000001, (hasEnd ? endTime : el.duration || 0) - rangeStart);
      setProgress(Math.max(0, Math.min(1, (cur - rangeStart) / denom)));
    };

    const onLoaded = () => setDuration(el.duration || 0);

    el.addEventListener("timeupdate", onTimeUpdate);
    el.addEventListener("loadedmetadata", onLoaded);
    return () => {
      el.removeEventListener("timeupdate", onTimeUpdate);
      el.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [startTime, endTime]);

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = audioRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = x / rect.width; // 0..1
    const rangeStart = Math.max(0, startTime || 0);
    const hasEnd = Number.isFinite(endTime) && endTime > rangeStart;
    const rangeEnd = hasEnd ? endTime : duration || el.duration || rangeStart;
    const target = rangeStart + pct * Math.max(0, rangeEnd - rangeStart);
    try {
      el.currentTime = target;
    } catch {}
    if (!isPlaying) {
      // reflect UI immediately
      setProgress(pct);
    }
  };

  const handleDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    setDragging(true);
    handleSeek(e);
  };
  const handleDragMove = (e: MouseEvent) => {
    if (!dragging) return;
    const el = document.getElementById("playback-track");
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const pct = x / rect.width;
    const audio = audioRef.current;
    if (!audio) return;
    const rangeStart = Math.max(0, startTime || 0);
    const hasEnd = Number.isFinite(endTime) && endTime > rangeStart;
    const rangeEnd = hasEnd ? endTime : duration || audio.duration || rangeStart;
    const target = rangeStart + pct * Math.max(0, rangeEnd - rangeStart);
    try {
      audio.currentTime = target;
    } catch {}
    setProgress(pct);
  };
  const handleDragEnd = () => setDragging(false);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd, { once: true });
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, [dragging]);

  return (
    <div className="flex w-full flex-col items-center gap-1 py-1">
      {audioError && <div className="text-[10px] text-red-500">{audioError}</div>}

      <h2 className="max-w-full truncate text-center text-[11px] font-semibold leading-none text-foreground" title={title}>
        {title}
      </h2>

      <div className="flex items-center gap-3">
        <button
          onClick={onPrevCall}
          type="button"
          disabled={isPrevDisabled}
          className={`p-2 text-xs ${isPrevDisabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          ⏮ Prev
        </button>

        <div
          onClick={togglePlay}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              togglePlay();
            }
          }}
          role="button"
          tabIndex={0}
          className={`relative flex h-[52px] w-[52px] cursor-pointer items-center justify-center rounded-full p-2 transition-all duration-300 ${
            isPlaying ? "bg-red-500/50" : "bg-green-500"
          }`}
        >
          <Lottie
            animationData={playAnimation}
            loop
            autoplay={false}
            lottieRef={lottieRef}
            style={{ height: 36, width: 36 }}
          />
        </div>

        <button
          onClick={onNextCall}
          disabled={isNextDisabled}
          type="button"
          className={`p-2 text-xs ${isNextDisabled ? "cursor-not-allowed opacity-50" : ""}`}
        >
          ⏭ Next
        </button>
      </div>

      {/* Timeline (visible only while playing) */}
      {isPlaying && (
        <div
          id="playback-track"
          className="mt-1 h-2 w-full cursor-pointer rounded bg-gradient-to-r from-primary/40 via-primary/20 to-muted relative"
          onClick={handleSeek}
          onMouseDown={handleDragStart}
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress * 100)}
          title="Seek"
        >
          <div
            className="absolute left-0 top-0 h-full rounded bg-primary/70"
            style={{ width: `${Math.max(0, Math.min(100, progress * 100))}%` }}
          />
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full bg-primary shadow-md ring-2 ring-primary/30"
            style={{ left: `calc(${Math.max(0, Math.min(100, progress * 100))}% - 6px)` }}
          />
        </div>
      )}

      <audio
        ref={audioRef}
        src={src}
        onError={() => setAudioError("Audio file could not be loaded or is not supported.")}
        preload="auto"
        className="hidden"
      >
        <track kind="captions" srcLang="en" label="English captions" />
      </audio>
    </div>
  );
}
