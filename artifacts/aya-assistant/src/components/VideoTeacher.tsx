/**
 * AYA Junior Video Teacher MVP
 *
 * Displays a short pre-recorded teacher video clip at the bottom-right of the
 * screen, above the AnimatedTeacher emoji. Falls back silently if the video
 * file does not exist — the existing chat/text/voice flow continues normally.
 */

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveVideoPath } from "@/lib/videoTeacherMap";
import type { VideoKey } from "@/lib/videoTeacherMap";

export interface VideoTeacherProps {
  /** Whether the video panel should be visible at all. */
  visible: boolean;
  /** Which clip to play. null = nothing plays. */
  videoKey: VideoKey | null;
  /** Optional subtitle shown below the video frame. */
  subtitle?: string | null;
  /** Whether to loop the clip (default false). */
  loop?: boolean;
  /** Called when the clip ends naturally (not on error/hide). */
  onEnded?: () => void;
}

export function VideoTeacher({
  visible,
  videoKey,
  subtitle,
  loop = false,
  onEnded,
}: VideoTeacherProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [isReady, setIsReady]       = useState(false);

  const resolvedSrc = videoKey ? resolveVideoPath(videoKey) : "";

  /* Reset state whenever the key or visibility changes */
  useEffect(() => {
    setLoadFailed(false);
    setIsReady(false);
  }, [videoKey, visible]);

  /* Load + play when src and visibility are ready */
  useEffect(() => {
    const el = videoRef.current;
    if (!el || !resolvedSrc || !visible) return;

    el.load();
    const playPromise = el.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        /* Autoplay blocked or file missing — handled by onError below */
      });
    }
  }, [resolvedSrc, visible]);

  const handleCanPlay = useCallback(() => setIsReady(true), []);

  const handleError = useCallback(() => {
    /* File missing or unreadable — fail silently, keep rest of app working */
    setLoadFailed(true);
  }, []);

  const handleEnded = useCallback(() => {
    onEnded?.();
  }, [onEnded]);

  /* Nothing to show: hidden, no key, or file errored */
  if (!visible || !videoKey || !resolvedSrc || loadFailed) return null;

  return (
    <AnimatePresence>
      {visible && !loadFailed && (
        <motion.div
          key={videoKey}
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: isReady ? 1 : 0, scale: isReady ? 1 : 0.9, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 12 }}
          transition={{ type: "spring", stiffness: 280, damping: 24 }}
          className="fixed bottom-[5.5rem] right-5 z-50 flex flex-col items-end gap-1.5 pointer-events-none select-none"
          aria-label="AYA Video Teacher"
        >
          {/* Video frame */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-yellow-300 bg-black w-36 h-[8.5rem] sm:w-44 sm:h-[10.5rem]">
            <video
              ref={videoRef}
              src={resolvedSrc}
              loop={loop}
              muted={false}
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              onCanPlay={handleCanPlay}
              onError={handleError}
              onEnded={handleEnded}
            />
            {/* Subtle AYA badge */}
            <div className="absolute top-1.5 left-1.5 bg-yellow-400/90 text-[9px] font-bold text-yellow-900 px-1.5 py-0.5 rounded-full leading-none">
              AYA
            </div>
          </div>

          {/* Optional subtitle */}
          {subtitle && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border-2 border-yellow-300 rounded-xl px-3 py-1.5 shadow-md max-w-[11rem] sm:max-w-[13rem]"
            >
              <p className="text-[11px] font-semibold text-gray-700 leading-snug text-center">
                {subtitle}
              </p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
