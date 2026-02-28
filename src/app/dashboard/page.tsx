"use client";

import { useState, useEffect, useCallback } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import { LabData, LabHistoryItem, LabStep, LabTask } from "@/lib/types";

// ─── HELPER: generate step ID ─────────────────────
function stepId(taskId: string, stepIndex: number) {
    return `${taskId}-step-${stepIndex}`;
}

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
function exportToMarkdown(lab: LabData, completedSteps: string[]): string {
    let md = `# ${lab.labTitle}\n\n`;
    if (lab.labDescription) md += `${lab.labDescription}\n\n`;
    md += `---\n\n`;

    lab.tasks.forEach((task, ti) => {
        md += `## ${ti + 1}. ${task.title}\n\n`;
        md += `${task.description}\n\n`;
        task.steps.forEach((step, si) => {
            const sid = stepId(task.id, si);
            const check = completedSteps.includes(sid) ? "x" : " ";
            md += `- [${check}] ${step.instruction}\n`;
            if (step.command) md += `  \`\`\`bash\n  ${step.command}\n  \`\`\`\n`;
            if (step.note) md += `  > 💡 ${step.note}\n`;
            md += `\n`;
        });
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
    const [url, setUrl] = useState("");
    const [pasteMode, setPasteMode] = useState(false);
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

    // Count total steps
    const totalSteps =
        activeLab?.data.tasks.reduce((sum, t) => sum + t.steps.length, 0) || 0;
    const completedCount = completedSteps.length;
    const progressPercent = totalSteps > 0 ? (completedCount / totalSteps) * 100 : 0;

    // Toggle step completion
    const toggleStep = useCallback(
        (sid: string) => {
            setCompletedSteps((prev) => {
                const next = prev.includes(sid)
                    ? prev.filter((s) => s !== sid)
                    : [...prev, sid];

                // Also save to history
                if (activeLabId) {
                    setHistory((h) => {
                        const updated = h.map((item) =>
                            item.id === activeLabId
                                ? { ...item, completedSteps: next }
                                : item
                        );
                        saveHistory(updated);
                        return updated;
                    });
                }

                return next;
            });
        },
        [activeLabId]
    );

    // Copy command
    const copyCommand = useCallback((command: string, id: string) => {
        navigator.clipboard.writeText(command);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    }, []);

    // Select a lab from history
    const selectLab = useCallback((id: string) => {
        setActiveLabId(id);
        const lab = loadHistory().find((h) => h.id === id);
        setCompletedSteps(lab?.completedSteps || []);
        setError("");
    }, []);

    // New lab (reset to input)
    const newLab = useCallback(() => {
        setActiveLabId(null);
        setCompletedSteps([]);
        setUrl("");
        setPastedContent("");
        setError("");
        setPasteMode(false);
    }, []);

    // Submit lab URL or pasted content
    const handleSubmit = useCallback(async () => {
        if (!url.trim() && !pastedContent.trim()) return;

        setIsLoading(true);
        setError("");

        try {
            let scrapeResult;

            if (pasteMode && pastedContent.trim()) {
                // Skip scraping, send content directly to solve
                setLoadingStatus("🤖 Analyzing lab content with AI...");
                scrapeResult = {
                    labTitle: "Pasted Lab",
                    labDescription: "",
                    rawTasks: [],
                    codeSnippets: [],
                    scrapedSuccessfully: false,
                };
            } else {
                // Step 1: Scrape
                setLoadingStatus("🔍 Scraping lab page...");
                const scrapeRes = await fetch("/api/scrape", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ url: url.trim() }),
                });
                scrapeResult = await scrapeRes.json();

                if (scrapeResult.error) {
                    setError(scrapeResult.error);
                    setIsLoading(false);
                    return;
                }
            }

            // Step 2: Send to AI
            setLoadingStatus("🤖 Generating solutions with Gemini AI...");
            const solveRes = await fetch("/api/solve", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    labTitle: scrapeResult.labTitle,
                    rawTasks: scrapeResult.rawTasks,
                    codeSnippets: scrapeResult.codeSnippets,
                    pastedContent: pasteMode ? pastedContent.trim() : undefined,
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
                title: solveResult.labTitle || scrapeResult.labTitle || "Untitled Lab",
                url: pasteMode ? undefined : url.trim(),
                createdAt: new Date().toISOString(),
                data: solveResult,
                completedSteps: [],
            };

            const updatedHistory = [newItem, ...history];
            setHistory(updatedHistory);
            saveHistory(updatedHistory);
            setActiveLabId(newItem.id);
            setCompletedSteps([]);
            setUrl("");
            setPastedContent("");
        } catch (err) {
            console.error(err);
            setError("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
            setLoadingStatus("");
        }
    }, [url, pastedContent, pasteMode, history]);

    // Export markdown
    const handleExport = useCallback(() => {
        if (!activeLab) return;
        const md = exportToMarkdown(activeLab.data, completedSteps);
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
                        <span>Paste a URL to get started</span>
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
                                What lab are you working on?
                            </h2>
                            <p className="welcome-subtitle">
                                Paste a Google Cloud Skills Boost lab URL and I&apos;ll generate
                                a step-by-step solution with real commands.
                            </p>

                            <div className="url-input-wrapper">
                                <div className="url-input-container">
                                    <input
                                        className="url-input"
                                        type="text"
                                        placeholder="https://www.cloudskillsboost.google/focuses/..."
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                                        disabled={pasteMode}
                                    />
                                    <button
                                        className="url-submit-btn"
                                        onClick={handleSubmit}
                                        disabled={
                                            pasteMode
                                                ? !pastedContent.trim()
                                                : !url.trim()
                                        }
                                    >
                                        🚀 Solve Lab
                                    </button>
                                </div>
                                <p className="url-hint">
                                    Supports Google Cloud Skills Boost, Qwiklabs, and similar lab
                                    platforms
                                </p>
                            </div>

                            <div className="or-divider">or</div>

                            <button
                                className="paste-toggle"
                                onClick={() => setPasteMode(!pasteMode)}
                            >
                                {pasteMode
                                    ? "← Switch to URL mode"
                                    : "📋 Paste lab instructions manually"}
                            </button>

                            {pasteMode && (
                                <div className="paste-area">
                                    <textarea
                                        className="paste-textarea"
                                        placeholder="Paste your lab instructions here...&#10;&#10;Example:&#10;Task 1: Create a Cloud Storage bucket&#10;1. Open Cloud Shell&#10;2. Run: gsutil mb gs://my-bucket&#10;..."
                                        value={pastedContent}
                                        onChange={(e) => setPastedContent(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* ─── CHECKLIST VIEW ─── */}
                    {activeLab && !isLoading && (
                        <div className="checklist-container">
                            <div className="checklist-header">
                                <div className="checklist-meta">
                                    <span className="checklist-meta-item">
                                        📋 {activeLab.data.tasks.length} tasks
                                    </span>
                                    <span className="checklist-meta-item">
                                        🔧 {totalSteps} steps
                                    </span>
                                    {activeLab.url && (
                                        <a
                                            href={activeLab.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="checklist-meta-item"
                                            style={{ color: "var(--primary)" }}
                                        >
                                            🔗 Open Lab
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="progress-bar-wrapper">
                                <div className="progress-info">
                                    <span className="progress-label">Progress</span>
                                    <span className="progress-count">
                                        {completedCount} / {totalSteps} steps
                                    </span>
                                </div>
                                <div className="progress-track">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${progressPercent}%` }}
                                    />
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

                                    {task.steps.map((step: LabStep, si: number) => {
                                        const sid = stepId(task.id, si);
                                        const isCompleted = completedSteps.includes(sid);
                                        const cmdId = `cmd-${task.id}-${si}`;

                                        return (
                                            <div
                                                key={sid}
                                                className={`glass-card step-card ${isCompleted ? "completed" : ""}`}
                                                onClick={() => toggleStep(sid)}
                                            >
                                                <div
                                                    className={`step-checkbox ${isCompleted ? "checked" : ""}`}
                                                >
                                                    {isCompleted && "✓"}
                                                </div>
                                                <div className="step-content">
                                                    <p className="step-instruction">
                                                        {step.instruction}
                                                    </p>

                                                    {step.command && (
                                                        <div
                                                            className="command-block"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <div className="command-header">
                                                                <span>terminal</span>
                                                                <button
                                                                    className={`command-copy-btn ${copiedId === cmdId ? "copied" : ""}`}
                                                                    onClick={() =>
                                                                        copyCommand(step.command!, cmdId)
                                                                    }
                                                                >
                                                                    {copiedId === cmdId
                                                                        ? "✓ Copied!"
                                                                        : "📋 Copy"}
                                                                </button>
                                                            </div>
                                                            <div className="command-code">
                                                                {step.command}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {step.note && (
                                                        <div className="step-note">
                                                            <div className="step-note-label">💡 Tip</div>
                                                            {step.note}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
