"use client";

import { useState, useEffect, useCallback } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { LabData, LabHistoryItem, LabTask } from "@/lib/types";

// ─── HELPER: localStorage ─────────────────────────
function loadHistory(): LabHistoryItem[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem("lab-buddy-history") || "[]");
    } catch {
        return [];
    }
}

function saveHistory(items: LabHistoryItem[]) {
    localStorage.setItem("lab-buddy-history", JSON.stringify(items));
}

// ─── HELPER: Markdown export ──────────────────────
function exportToMarkdown(lab: LabData): string {
    let md = `# ${lab.labTitle}\n\n`;
    if (lab.labDescription) md += `${lab.labDescription}\n\n`;
    md += `---\n\n`;

    lab.tasks.forEach((task, ti) => {
        md += `## ${ti + 1}. ${task.title}\n\n`;
        md += `${task.description}\n\n`;
        md += `### Cloud Shell Automation Script\n`;
        md += `\`\`\`bash\n${task.script}\n\`\`\`\n\n`;
    });

    return md;
}

// ─── MAIN DASHBOARD ───────────────────────────────
export default function DashboardPage() {
    const { user } = useUser();
    const [history, setHistory] = useState<LabHistoryItem[]>([]);
    const [activeLabId, setActiveLabId] = useState<string | null>(null);
    const [completedSteps, setCompletedSteps] = useState<string[]>([]);

    // Input state
    const [pastedContent, setPastedContent] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState("");
    const [error, setError] = useState("");

    // Copy state
    const [copiedId, setCopiedId] = useState<string | null>(null);

    // Load history on mount
    useEffect(() => {
        setHistory(loadHistory());
    }, []);

    const activeLab = history.find((h) => h.id === activeLabId);

    // Copy command
    const copyCommand = useCallback((command: string, id: string) => {
        navigator.clipboard.writeText(command);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Select a lab from history
    const selectLab = useCallback((id: string) => {
        setActiveLabId(id);
        setError("");
    }, []);

    // New lab (reset to input)
    const newLab = useCallback(() => {
        setActiveLabId(null);
        setCompletedSteps([]);
        setPastedContent("");
        setError("");
    }, []);

    // Submit pasted content
    const handleSubmit = useCallback(async () => {
        if (!pastedContent.trim()) return;

        setIsLoading(true);
        setError("");

        try {
            setLoadingStatus("🤖 Analyzing lab content with AI...");

            // Send content directly to solve API
            const solveRes = await fetch("/api/solve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    labTitle: "Pasted Lab",
                    rawTasks: [],
                    codeSnippets: [],
                    pastedContent: pastedContent.trim(),
                }),
            });

            const solveResult = await solveRes.json();

            if (solveResult.error) {
                setError(solveResult.error);
                setIsLoading(false);
                return;
            }

            // Step 3: Save to history
            const newItem: LabHistoryItem = {
                id: Date.now().toString(),
                title: solveResult.labTitle || "Untitled Lab",
                createdAt: new Date().toISOString(),
                data: solveResult,
                completedSteps: [],
            };

            const updatedHistory = [newItem, ...history];
            setHistory(updatedHistory);
            saveHistory(updatedHistory);
            setActiveLabId(newItem.id);
            setCompletedSteps([]);
            setPastedContent("");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
            setLoadingStatus("");
        }
    }, [pastedContent, history]);

    // Export markdown
    const handleExport = useCallback(() => {
        if (!activeLab) return;
        const md = exportToMarkdown(activeLab.data);
        const blob = new Blob([md], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${activeLab.data.labTitle.replace(/[^a-z0-9]/gi, "_")}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [activeLab, completedSteps]);

    // Delete lab from history
    const deleteLab = useCallback(
        (id: string, e: React.MouseEvent) => {
            e.stopPropagation();
            const updated = history.filter((h) => h.id !== id);
            setHistory(updated);
            saveHistory(updated);
            if (activeLabId === id) {
                setActiveLabId(null);
                setCompletedSteps([]);
            }
        },
        [history, activeLabId]
    );

    return (
        <div className="dashboard">
            {/* ─── SIDEBAR ─── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">✨</div>
                        Lab Buddy
                    </div>
                    <button
                        className="sidebar-new-btn"
                        onClick={newLab}
                        title="New Lab"
                    >
                        +
                    </button>
                </div>

                {history.length === 0 ? (
                    <div className="sidebar-empty">
                        <div className="sidebar-empty-icon">📋</div>
                        <span>No labs yet</span>
                        <span>Paste lab instructions to get started</span>
                    </div>
                ) : (
                    <div className="sidebar-labs">
                        {history.map((item) => (
                            <button
                                key={item.id}
                                className={`sidebar-lab-item ${activeLabId === item.id ? "active" : ""}`}
                                onClick={() => selectLab(item.id)}
                            >
                                <span className="sidebar-lab-icon">📝</span>
                                <span className="sidebar-lab-title">{item.title}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="sidebar-footer">
                    <UserButton afterSignOutUrl="/" />
                    <span
                        style={{
                            fontSize: "0.85rem",
                            color: "var(--text-secondary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {user?.firstName || "User"}
                    </span>
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="main-content">
                {activeLab && (
                    <div className="main-header">
                        <h2 className="main-header-title">{activeLab.data.labTitle}</h2>
                        <div className="main-header-actions">
                            <button className="btn btn-ghost" onClick={handleExport}>
                                📥 Export MD
                            </button>
                            <button className="btn btn-ghost" onClick={newLab}>
                                ➕ New Lab
                            </button>
                        </div>
                    </div>
                )}

                <div className="main-body">
                    {/* ─── LOADING STATE ─── */}
                    {isLoading && (
                        <div className="loading-state">
                            <div className="loading-spinner" />
                            <p className="loading-text">{loadingStatus}</p>
                            <p className="loading-subtext">
                                This may take 15–30 seconds depending on lab complexity...
                            </p>
                        </div>
                    )}

                    {/* ─── ERROR STATE ─── */}
                    {error && !isLoading && (
                        <div className="error-state">
                            <div className="error-icon">⚠️</div>
                            <h3 className="error-title">Something went wrong</h3>
                            <p className="error-message">{error}</p>
                            <button className="btn btn-primary" onClick={newLab}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* ─── WELCOME / INPUT STATE ─── */}
                    {!activeLabId && !isLoading && !error && (
                        <div className="welcome">
                            <div className="welcome-icon">✨</div>
                            <h2 className="welcome-title">
                                Paste Your Lab Instructions
                            </h2>
                            <p className="welcome-subtitle" style={{ marginBottom: "20px" }}>
                                Hit <strong>Ctrl+A</strong> and <strong>Ctrl+C</strong> on your Google Cloud Skills Boost lab page, and paste the entire text below.
                            </p>

                            <div className="paste-area" style={{ marginBottom: "20px", display: "flex", flexDirection: "column", gap: "10px" }}>
                                <textarea
                                    className="paste-textarea"
                                    placeholder="Paste your lab instructions here...&#10;&#10;Example:&#10;Task 1: Create a Cloud Storage bucket&#10;1. Open Cloud Shell&#10;2. Run: gsutil mb gs://my-bucket&#10;..."
                                    style={{ minHeight: "300px", padding: "16px", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--card-bg)", color: "var(--text)" }}
                                    value={pastedContent}
                                    onChange={(e) => setPastedContent(e.target.value)}
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSubmit}
                                    disabled={!pastedContent.trim()}
                                    style={{ alignSelf: "flex-end", padding: "12px 24px", fontSize: "1rem" }}
                                >
                                    🚀 Solve Lab
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ─── CHECKLIST VIEW ─── */}
                    {activeLab && !isLoading && (
                        <div className="checklist-container">
                            <div className="checklist-header" style={{ marginBottom: "2rem" }}>
                                <div className="checklist-meta">
                                    <span className="checklist-meta-item">
                                        📋 {activeLab.data.tasks.length} script blocks
                                    </span>
                                </div>
                            </div>

                            {/* Tasks */}
                            {activeLab.data.tasks.map((task: LabTask, taskIndex: number) => (
                                <div key={task.id} className="task-section">
                                    <h3 className="task-section-title">
                                        <span className="task-section-number">
                                            {taskIndex + 1}
                                        </span>
                                        {task.title}
                                    </h3>

                                    {task.description && (
                                        <p
                                            style={{
                                                fontSize: "0.88rem",
                                                color: "var(--text-secondary)",
                                                marginBottom: "14px",
                                                lineHeight: "1.6",
                                            }}
                                        >
                                            {task.description}
                                        </p>
                                    )}

                                    {task.script && (
                                        <div className="glass-card" style={{ padding: "0" }}>
                                            <div
                                                className="command-block"
                                                style={{ border: "none", margin: "0" }}
                                            >
                                                <div className="command-header">
                                                    <span>cloud-shell.sh</span>
                                                    <button
                                                        className={`command-copy-btn ${copiedId === task.id ? "copied" : ""}`}
                                                        onClick={() =>
                                                            copyCommand(task.script, task.id)
                                                        }
                                                    >
                                                        {copiedId === task.id
                                                            ? "✓ Copied!"
                                                            : "📋 Copy Script"}
                                                    </button>
                                                </div>
                                                <div className="command-code" style={{ whiteSpace: "pre-wrap" }}>
                                                    {task.script}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Export bar */}
                            <div className="export-bar">
                                <button className="btn btn-secondary" onClick={handleExport}>
                                    📥 Export as Markdown
                                </button>
                                <button className="btn btn-ghost" onClick={newLab}>
                                    ➕ Solve Another Lab
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
