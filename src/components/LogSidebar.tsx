"use client";

import React from "react";
import { Play, Trash2, Copy } from "lucide-react";

export interface LogEntry {
    id: string;
    timestamp: number;
    text: string;
}

interface LogSidebarProps {
    logs: LogEntry[];
    onLogClick: (timestamp: number) => void;
    onClearLogs: () => void;
    onCopyLogs: () => void;
    onDeleteLog: (id: string) => void;
    memoInput: string;
    setMemoInput: (value: string) => void;
    onAddLog: () => void;
}

export default function LogSidebar({
    logs,
    onLogClick,
    onClearLogs,
    onCopyLogs,
    onDeleteLog,
    memoInput,
    setMemoInput,
    onAddLog,
}: LogSidebarProps) {
    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onAddLog();
        }
    };

    return (
        <div className="flex h-full flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">ログ</h2>
                <div className="flex gap-2">
                    <button
                        onClick={onCopyLogs}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-700"
                        title="全ログをコピー"
                    >
                        <Copy size={16} />
                        コピー
                    </button>
                    <button
                        onClick={onClearLogs}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium text-rose-400 transition-colors hover:bg-zinc-700"
                        title="ログを全消去"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/50 p-2">
                {logs.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-zinc-500">
                        ログがありません
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {logs.map((log) => (
                            <div
                                key={log.id}
                                className="group flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-zinc-800"
                            >
                                <div
                                    onClick={() => onLogClick(log.timestamp)}
                                    className="mt-0.5 flex cursor-pointer shrink-0 items-center gap-1 font-mono text-rose-500"
                                >
                                    <Play size={12} fill="currentColor" />
                                    [{formatTime(log.timestamp)}]
                                </div>
                                <div
                                    onClick={() => onLogClick(log.timestamp)}
                                    className="flex-1 cursor-pointer break-all text-sm leading-relaxed"
                                >
                                    {log.text}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteLog(log.id);
                                    }}
                                    className="ml-auto opacity-0 transition-opacity hover:text-rose-500 group-hover:opacity-100"
                                    title="このログを削除"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-2">
                <textarea
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メモを入力して Enter..."
                    className="min-h-[100px] w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm focus:border-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500">
                    Enter で保存 | Shift + Enter で改行
                </p>
            </div>
        </div>
    );
}
