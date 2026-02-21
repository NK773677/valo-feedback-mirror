"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

interface YouTubePlayerProps {
  videoId: string;
  onReady: (player: any) => void;
  onStateChange?: (state: number) => void;
  isZoomed?: boolean;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export default function YouTubePlayer({ videoId, onReady, onStateChange, isZoomed = false }: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [apiReady, setApiReady] = useState(false);

  // ... (省略されるが既存のコードの続き)

  // コールバックをrefに保存して、useEffectの依存配列から除外する
  // これにより、親の再レンダーでプレイヤーが再生成されるのを防ぐ
  const onReadyRef = useRef(onReady);
  const onStateChangeRef = useRef(onStateChange);
  useEffect(() => { onReadyRef.current = onReady; }, [onReady]);
  useEffect(() => { onStateChangeRef.current = onStateChange; }, [onStateChange]);

  // APIスクリプトの読み込み
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const id = "youtube-api-script";
    if (!document.getElementById(id)) {
      const tag = document.createElement("script");
      tag.id = id;
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const checkYT = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setApiReady(true);
        clearInterval(checkYT);
      }
    }, 100);

    return () => clearInterval(checkYT);
  }, []);

  // プレイヤーの初期化 — videoId と apiReady のみに依存
  useEffect(() => {
    if (!apiReady || !videoId || !containerRef.current) return;

    // 既存のプレイヤーを破棄
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {
        // ignore
      }
      playerRef.current = null;
    }

    // 新しいDOM要素を作成（YT.Playerは渡された要素をiframeで置換するため）
    const el = document.createElement("div");
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(el);

    playerRef.current = new window.YT.Player(el, {
      height: "100%",
      width: "100%",
      videoId,
      playerVars: {
        autoplay: 1,
        controls: 1,
        rel: 0,
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.origin,
      },
      events: {
        onReady: (event: any) => {
          onReadyRef.current(event.target);
        },
        onStateChange: (event: any) => {
          onStateChangeRef.current?.(event.data);
        },
      },
    });

    return () => {
      if (playerRef.current && typeof playerRef.current.destroy === "function") {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, [apiReady, videoId]); // ← onReady, onStateChange を除外！

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black shadow-2xl">
      <div
        ref={containerRef}
        className="h-full w-full transition-transform duration-500 ease-in-out"
        style={{
          transform: isZoomed ? "scale(3)" : "scale(1)",
          transformOrigin: "100% 100%",
        }}
      />
    </div>
  );
}
