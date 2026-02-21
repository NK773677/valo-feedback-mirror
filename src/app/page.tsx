"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import YouTubePlayer from "@/components/YouTubePlayer";
import LogSidebar, { LogEntry } from "@/components/LogSidebar";
import { Play, Pause, RotateCcw, FastForward, Link as LinkIcon, Video, Search } from "lucide-react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [player, setPlayer] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [memoInput, setMemoInput] = useState("");
  const [isFaceZoomed, setIsFaceZoomed] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Focus tracking for shortcuts
  const isInputFocused = useRef(false);

  useEffect(() => {
    setIsClient(true);
    // Load from LocalStorage
    try {
      const savedUrl = localStorage.getItem("valo_feedback_url");
      const savedLogs = localStorage.getItem("valo_feedback_logs");
      if (savedUrl) {
        setUrl(savedUrl);
        const id = extractVideoId(savedUrl);
        if (id) setVideoId(id);
      }
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("valo_feedback_url", url);
      localStorage.setItem("valo_feedback_logs", JSON.stringify(logs));
    }
  }, [url, logs, isClient]);

  // Beforeunload listener
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (logs.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [logs]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInInput = target.tagName === "INPUT";      // URL入力欄
      const isInTextArea = target.tagName === "TEXTAREA"; // メモ欄

      // 左右矢印キー → メモ欄でも動画シーク（URL入力欄のみカーソル移動を優先）
      if (e.code === "ArrowLeft" && !isInInput) {
        e.preventDefault();
        seek(-5);
        return;
      }
      if (e.code === "ArrowRight" && !isInInput) {
        e.preventDefault();
        seek(5);
        return;
      }

      // 以下のショートカットは入力中は無効
      if (isInInput || isInTextArea) return;

      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, isPlaying]);

  const handlePlayerReady = useCallback((p: any) => {
    setPlayer(p);
  }, []);

  const handleStateChange = useCallback((state: number) => {
    setIsPlaying(state === 1);
  }, []);

  const extractVideoId = (url: string) => {
    if (!url) return null;
    const trimmed = url.trim();
    // More robust regex covering live, shorts, embed, v, watch?v=, and youtu.be
    const pattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/live\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/;
    const match = trimmed.match(pattern);
    return match ? match[1] : null;
  };

  const togglePlay = () => {
    if (!player || typeof player.pauseVideo !== "function") return;
    if (isPlaying) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  };

  const seek = (seconds: number) => {
    if (!player || typeof player.getCurrentTime !== "function") return;
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
  };

  const addLog = () => {
    if (!player || typeof player.getCurrentTime !== "function" || !memoInput.trim()) return;
    const currentTime = player.getCurrentTime();
    const newLog: LogEntry = {
      id: Date.now().toString(),
      timestamp: currentTime,
      text: memoInput.trim(),
    };

    setLogs((prev) => {
      const updated = [...prev, newLog];
      // タイムスタンプ順にソート
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
    setMemoInput("");
  };

  const importLogs = (newEntries: Omit<LogEntry, "id">[]) => {
    setLogs((prev) => {
      const updated = [
        ...prev,
        ...newEntries.map((e) => ({ ...e, id: Math.random().toString(36).substr(2, 9) })),
      ];
      return updated.sort((a, b) => a.timestamp - b.timestamp);
    });
  };

  const deleteLog = (id: string) => {
    if (confirm("このログを削除しますか？")) {
      setLogs((prev) => prev.filter((log) => log.id !== id));
    }
  };

  const handleLogClick = (timestamp: number) => {
    if (player) {
      player.seekTo(timestamp, true);
      player.playVideo();
    }
  };

  const copyLogs = () => {
    const formatTime = (seconds: number) => {
      const min = Math.floor(seconds / 60);
      const sec = Math.floor(seconds % 60);
      return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };
    const prompt = "以下は振り返りメモです。各行のタイムスタンプと行数はそのまま維持し、要約せず、メモ本文のみを自然で読みやすい日本語に整形してください。\n\n";
    const logText = logs
      .map((log) => `[${formatTime(log.timestamp)}] ${log.text}`)
      .join("\n");
    navigator.clipboard.writeText(prompt + logText);
    alert("ログをクリップボードにコピーしました！");
  };

  const clearLogs = () => {
    if (confirm("すべてのログを削除しますか？")) {
      setLogs([]);
    }
  };

  if (!isClient) return null;

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded bg-rose-600 p-1">
              <Video size={20} className="text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tighter text-white">
              Valo-Feedback Mirror
            </h1>
          </div>
          <div className="flex w-full max-w-md items-center gap-2 px-4">
            <div className="relative w-full">
              <LinkIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  const val = e.target.value;
                  setUrl(val);
                  const id = extractVideoId(val);
                  if (id) {
                    setVideoId(id);
                  }
                }}
                placeholder="YouTube URL を貼り付け"
                className={`w-full rounded-full border border-zinc-800 bg-zinc-900 py-2 pl-10 pr-10 text-sm focus:border-rose-500 focus:outline-none ${videoId ? "border-green-900/50" : ""
                  }`}
              />
              {videoId && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2" title="動画IDを検出しました">
                  <div className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 overflow-hidden p-6">
        <div className="mx-auto flex w-full max-w-[1800px] gap-6 flex-col lg:flex-row">
          {/* Left Column: Player & Controls */}
          <div className="flex flex-1 flex-col gap-4">
            {videoId ? (
              <div className="relative group overflow-hidden rounded-lg">
                <YouTubePlayer
                  videoId={videoId}
                  onReady={handlePlayerReady}
                  onStateChange={handleStateChange}
                  isZoomed={isFaceZoomed}
                />
                {/* Wipe Zoom Trigger Overlay */}
                <button
                  onClick={() => setIsFaceZoomed(!isFaceZoomed)}
                  className={`absolute z-10 transition-all duration-300 flex items-center justify-center font-bold overflow-hidden ${isFaceZoomed
                    ? "inset-0 bg-black/0 cursor-zoom-out" // 拡大中は全体をカバー（透明で見えないがクリック可能）
                    : "bottom-0 right-0 w-1/4 h-1/3 opacity-0 group-hover:opacity-100 bg-rose-500/10 border-2 border-dashed border-rose-500/30 text-rose-500 text-xs cursor-zoom-in"
                    }`}
                >
                  {!isFaceZoomed && "顔を拡大"}
                </button>
              </div>
            ) : (
              <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-800 bg-zinc-900/50 text-zinc-500">
                <Video size={48} className="mb-4 opacity-20" />
                <p>上の入力欄に YouTube の URL を貼り付けてください</p>
              </div>
            )}

            {/* Video Controls */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <button
                  onClick={() => seek(-5)}
                  className="flex flex-col items-center gap-1 text-zinc-400 transition-colors hover:text-white"
                  title="5秒戻る (←)"
                >
                  <div className="rounded-full bg-zinc-800 p-3">
                    <RotateCcw size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-tight">-5秒</span>
                </button>

                <button
                  onClick={togglePlay}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-900/20 transition-transform active:scale-95"
                  title="再生 / 停止 (Space)"
                >
                  {isPlaying ? (
                    <Pause size={32} fill="currentColor" />
                  ) : (
                    <Play size={32} className="ml-1" fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => seek(5)}
                  className="flex flex-col items-center gap-1 text-zinc-400 transition-colors hover:text-white"
                  title="5秒進む (→)"
                >
                  <div className="rounded-full bg-zinc-800 p-3">
                    <FastForward size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-tight">+5秒</span>
                </button>

                <div className="mx-2 h-10 w-px bg-zinc-800" />

                <button
                  onClick={() => setIsFaceZoomed(!isFaceZoomed)}
                  className={`flex flex-col items-center gap-1 transition-colors ${isFaceZoomed ? "text-rose-500" : "text-zinc-400 hover:text-white"
                    }`}
                  title="顔（ワイプ）を拡大/縮小"
                >
                  <div className={`rounded-full p-3 ${isFaceZoomed ? "bg-rose-500/20" : "bg-zinc-800"}`}>
                    <Search size={20} />
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-tight">顔拡大</span>
                </button>
              </div>

              {videoId && (
                <button
                  onClick={() => {
                    const currentId = videoId;
                    setVideoId("");
                    setTimeout(() => setVideoId(currentId), 10);
                  }}
                  className="text-[10px] text-zinc-600 hover:text-zinc-400 underline underline-offset-2"
                >
                  動画が表示されない・再生できない場合はこちらをクリックして再読込
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Logs */}
          <div className="flex flex-col overflow-hidden min-h-[500px] lg:min-h-0 lg:w-80 xl:w-96">
            <LogSidebar
              logs={logs}
              onLogClick={handleLogClick}
              onClearLogs={clearLogs}
              onCopyLogs={copyLogs}
              onDeleteLog={deleteLog}
              onImportLogs={importLogs}
              memoInput={memoInput}
              setMemoInput={setMemoInput}
              onAddLog={addLog}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 p-4 text-center text-[10px] text-zinc-600">
        © 2026 Valo-Feedback Mirror - No Login Required
      </footer>
    </div>
  );
}
