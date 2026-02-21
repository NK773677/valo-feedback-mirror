"use client";

import React from "react";
import { Play, Trash2, Copy, Pencil, Check, X } from "lucide-react";

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
    onUpdateLog: (id: string, text: string) => void;
    onImportLogs: (newEntries: Omit<LogEntry, "id">[]) => void;
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
    onUpdateLog,
    onImportLogs,
    memoInput,
    setMemoInput,
    onAddLog,
}: LogSidebarProps) {
    const [isImportOpen, setIsImportOpen] = React.useState(false);
    const [importText, setImportText] = React.useState("");
    const [editingId, setEditingId] = React.useState<string | null>(null);
    const [editingText, setEditingText] = React.useState("");

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

    const handleImport = () => {
        const lines = importText.split("\n");
        const newEntries: Omit<LogEntry, "id">[] = [];

        // Support [hh:mm:ss], [mm:ss], mm:ss, etc.
        const regex = /(?:\[?(\d+):)?(\d+):(\d+)\]?\s*(.*)/;

        lines.forEach((line) => {
            if (!line.trim()) return;
            const match = line.match(regex);
            if (match) {
                const hours = match[1] ? parseInt(match[1], 10) : 0;
                const mins = parseInt(match[2], 10);
                const secs = parseInt(match[3], 10);
                const text = match[4].trim();

                if (!isNaN(mins) && !isNaN(secs)) {
                    const totalSeconds = hours * 3600 + mins * 60 + secs;
                    newEntries.push({
                        timestamp: totalSeconds,
                        text: text || "（メモなし）",
                    });
                }
            }
        });

        if (newEntries.length > 0) {
            onImportLogs(newEntries);
            setImportText("");
            setIsImportOpen(false);
            alert(`${newEntries.length} 件のログをインポートしました。`);
        } else {
            alert("有効なタイムスタンプが見つかりませんでした。'[分:秒] 内容' または '[時:分:秒] 内容' の形式で入力してください。");
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
                        onClick={() => setIsImportOpen(true)}
                        className="flex items-center gap-1 rounded bg-zinc-800 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-700"
                        title="テキストからインポート"
                    >
                        <Play size={16} />
                        インポート
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

            <div className="flex flex-col gap-2">
                <textarea
                    value={memoInput}
                    onChange={(e) => setMemoInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="メモを入力して Enter..."
                    className="min-h-[48px] w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 p-3 text-sm focus:border-rose-500 focus:outline-none"
                />
                <p className="text-[10px] text-zinc-500">
                    Enter で保存 | Shift + Enter で改行
                </p>
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
                                className={`group flex items-start gap-3 rounded-md p-2 transition-colors ${editingId === log.id ? "bg-zinc-800" : "hover:bg-zinc-800"
                                    }`}
                            >
                                <div
                                    onClick={() => onLogClick(log.timestamp)}
                                    className="mt-0.5 flex cursor-pointer shrink-0 items-center gap-1 font-mono text-rose-500"
                                >
                                    <Play size={12} fill="currentColor" />
                                    [{formatTime(log.timestamp)}]
                                </div>

                                {editingId === log.id ? (
                                    <div className="flex flex-1 flex-col gap-2">
                                        <textarea
                                            value={editingText}
                                            onChange={(e) => setEditingText(e.target.value)}
                                            autoFocus
                                            className="w-full resize-none rounded bg-zinc-900 p-2 text-sm focus:outline-none"
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                    e.preventDefault();
                                                    onUpdateLog(log.id, editingText);
                                                    setEditingId(null);
                                                }
                                                if (e.key === "Escape") {
                                                    setEditingId(null);
                                                }
                                            }}
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => setEditingId(null)}
                                                className="p-1 text-zinc-500 hover:text-white"
                                            >
                                                <X size={14} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    onUpdateLog(log.id, editingText);
                                                    setEditingId(null);
                                                }}
                                                className="p-1 text-green-500 hover:text-green-400"
                                            >
                                                <Check size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div
                                            onClick={() => onLogClick(log.timestamp)}
                                            className="flex-1 cursor-pointer break-all text-sm leading-relaxed"
                                        >
                                            {log.text}
                                        </div>
                                        <div className="ml-auto flex gap-1 group-hover:opacity-100 opacity-0 transition-opacity">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(log.id);
                                                    setEditingText(log.text);
                                                }}
                                                className="transition-colors hover:text-rose-500"
                                                title="ログを編集"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDeleteLog(log.id);
                                                }}
                                                className="transition-colors hover:text-rose-500"
                                                title="このログを削除"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Import Overlay */}
            {isImportOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-bold">ログをインポート</h3>
                            <button
                                onClick={() => setIsImportOpen(false)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>
                        <p className="mb-4 text-xs text-zinc-400">
                            '[分:秒] メモ内容' の形式のテキストを貼り付けてください。AIで整形した文章もそのまま読み込めます。
                        </p>
                        <textarea
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="[01:23] ここに貼り付けてください..."
                            className="mb-4 h-64 w-full resize-none rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-sm focus:border-rose-500 focus:outline-none"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setIsImportOpen(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-800"
                            >
                                キャンセル
                            </button>
                            <button
                                onClick={handleImport}
                                className="rounded-lg bg-rose-600 px-6 py-2 text-sm font-bold transition-all hover:bg-rose-500"
                            >
                                インポート実行
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
