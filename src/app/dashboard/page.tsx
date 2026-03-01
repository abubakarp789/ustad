"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser, SignOutButton } from "@clerk/nextjs";
import { LabData, LabHistoryItem, LabTask } from "@/lib/types";

// ─── HELPER: API Fetching ─────────────────────────
async function fetchHistory(): Promise<LabHistoryItem[]> {
    try {
        const res = await fetch("/api/history");
        if (!res.ok) throw new Error("Failed to fetch history");
        return await res.json();
    } catch (error) {
        // Suppress detailed error logs in client
        return [];
    }
}

async function removeHistory(id: string): Promise<void> {
    try {
        await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    } catch (error) {
        // Suppress detailed error logs in client
    }
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
        let isMounted = true;
        fetchHistory().then((data) => {
            if (isMounted) setHistory(data);
        });
        return () => { isMounted = false; };
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

            // Step 3: Try to save to Database, but show results regardless
            let newItem: LabHistoryItem;

            try {
                const saveRes = await fetch("/api/history", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(solveResult),
                });

                const savedLab = await saveRes.json();

                if (savedLab.error) {
                    throw new Error(savedLab.error);
                }

                newItem = {
                    id: savedLab.id,
                    title: savedLab.title,
                    createdAt: savedLab.date,
                    data: savedLab.data,
                    completedSteps: [],
                };
            } catch (saveErr) {
                // Database save failed (e.g. Supabase paused), but still show results
                console.warn("Could not save to history (database may be unreachable)");
                newItem = {
                    id: `local-${Date.now()}`,
                    title: solveResult.labTitle || "Pasted Lab",
                    createdAt: new Date().toISOString(),
                    data: {
                        labTitle: solveResult.labTitle || "Pasted Lab",
                        labDescription: "",
                        tasks: solveResult.tasks || [],
                    },
                    completedSteps: [],
                };
            }

            setHistory(prev => [newItem, ...prev]);
            setActiveLabId(newItem.id);
            setCompletedSteps([]);
            setPastedContent("");
        } catch (err) {
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
        async (id: string, e: React.MouseEvent) => {
            e.stopPropagation();

            // Remove locally first for snappy UI
            setHistory((prev) => prev.filter((h) => h.id !== id));

            if (activeLabId === id) {
                setActiveLabId(null);
                setCompletedSteps([]);
            }

            // Sync deletion with Supabase DB
            await removeHistory(id);
        },
        [history, activeLabId]
    );

    return (
        <div className="dashboard">
            {/* ─── SIDEBAR ─── */}
            <aside className="sidebar">
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="logo-icon-new" style={{ width: "28px", height: "28px" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="8 6 14 12 8 18"></polyline>
                                <line x1="14" y1="18" x2="20" y2="18"></line>
                            </svg>
                        </div>
                        <span className="logo-text-glitch" data-text="USTAD" style={{ fontSize: "0.95rem" }}>USTAD</span>
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
                    <div className="sidebar-empty animate-enter">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="sidebar-empty-icon" style={{ opacity: 0.3, marginBottom: '8px' }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" />
                            <path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
                        </svg>
                        <span style={{ fontWeight: 500, color: "var(--text-secondary)" }}>No labs yet</span>
                        <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Paste instructions to begin</span>
                    </div>
                ) : (
                    <div className="sidebar-labs">
                        {history.map((item) => (
                            <button
                                key={item.id}
                                className={`sidebar-lab-item ${activeLabId === item.id ? "active" : ""}`}
                                onClick={() => selectLab(item.id)}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sidebar-lab-icon" style={{ opacity: activeLabId === item.id ? 1 : 0.5 }}>
                                    <path d="M12 20h9"></path>
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                                </svg>
                                <span className="sidebar-lab-title" style={{ fontWeight: activeLabId === item.id ? 500 : 400 }}>{item.title}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="sidebar-footer" style={{ flexDirection: "column", alignItems: "flex-start", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{
                            width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary)",
                            color: "var(--text-inverse)", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 600, fontSize: "0.9rem"
                        }}>
                            {user?.firstName?.charAt(0) || "U"}
                        </div>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-primary)", fontWeight: 500 }}>
                            {user?.firstName || "User"}
                        </span>
                    </div>

                    <SignOutButton>
                        <button style={{
                            width: "100%", padding: "8px 12px", background: "transparent",
                            border: "1px solid var(--border-default)", borderRadius: "var(--radius-md)",
                            color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.85rem",
                            textAlign: "center", transition: "all 150ms"
                        }}
                            onMouseOver={(e) => { e.currentTarget.style.color = "var(--primary)"; e.currentTarget.style.borderColor = "var(--border-focus)"; }}
                            onMouseOut={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.borderColor = "var(--border-default)"; }}
                        >
                            Sign Out
                        </button>
                    </SignOutButton>
                </div>
            </aside>

            {/* ─── MAIN CONTENT ─── */}
            <main className="main-content">
                {activeLab && (
                    <div className="main-header">
                        <h2 className="main-header-title">{activeLab.data.labTitle}</h2>
                        <div className="main-header-actions">
                            <button className="btn btn-ghost" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Export MD
                            </button>
                            <button className="btn btn-primary" onClick={newLab} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                                New Lab
                            </button>
                        </div>
                    </div>
                )}

                <div className="main-body">
                    {/* ─── LOADING STATE ─── */}
                    {isLoading && (
                        <div className="loading-state animate-enter">
                            <div className="loading-spinner" style={{ borderColor: 'rgba(255,255,255,0.1)', borderTopColor: 'var(--primary)', borderWidth: '3px' }} />
                            <p className="loading-text" style={{ fontSize: '1.1rem', letterSpacing: '0.05em' }}>{loadingStatus}</p>
                            <p className="loading-subtext" style={{ opacity: 0.6 }}>
                                Processing lab structure directly from text...
                            </p>
                        </div>
                    )}

                    {/* ─── ERROR STATE ─── */}
                    {error && !isLoading && (
                        <div className="error-state animate-enter">
                            <div className="error-icon" style={{ borderColor: 'rgba(255,100,100,0.3)', color: '#ff6b6b', background: 'rgba(255,0,0,0.05)' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                            </div>
                            <h3 className="error-title" style={{ color: '#ff6b6b' }}>Processing Failed</h3>
                            <p className="error-message">{error}</p>
                            <button className="btn btn-secondary" onClick={newLab} style={{ marginTop: '16px' }}>
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* ─── WELCOME / INPUT STATE ─── */}
                    {!activeLabId && !isLoading && !error && (
                        <div className="welcome animate-enter">
                            <div className="welcome-icon" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.02) 100%)', borderColor: 'rgba(255,255,255,0.1)', color: 'var(--primary)' }}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            </div>
                            <h2 className="welcome-title" style={{ letterSpacing: '-0.03em' }}>
                                Initialize Execution
                            </h2>
                            <p className="welcome-subtitle" style={{ marginBottom: "32px", opacity: 0.8 }}>
                                Paste the contents of your Google Cloud Skills Boost lab to automatically generate executable scripts and checklists.
                            </p>

                            <div className="glass-panel paste-area" style={{ marginBottom: "20px", display: "flex", flexDirection: "column", padding: '24px', position: 'relative' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                                <textarea
                                    className="paste-textarea"
                                    placeholder="Task 1. Create a Cloud Storage bucket..."
                                    style={{ minHeight: "260px", padding: "16px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)", color: "var(--text-primary)", fontSize: "0.95rem", boxShadow: "inset 0 2px 10px rgba(0,0,0,0.5)" }}
                                    value={pastedContent}
                                    onChange={(e) => setPastedContent(e.target.value)}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Parsed directly by Gemini via Serverless Edge</span>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleSubmit}
                                        disabled={!pastedContent.trim()}
                                        style={{ padding: "10px 24px", fontSize: "0.95rem", border: '1px solid rgba(255,255,255,0.2)' }}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                                        Execute
                                    </button>
                                </div>
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
                                                    <div className="mac-dots">
                                                        <div className="mac-dot red" />
                                                        <div className="mac-dot yellow" />
                                                        <div className="mac-dot green" />
                                                    </div>
                                                    <span className="command-title">cloud-shell &mdash; bash</span>
                                                    <button
                                                        className={`command-copy-btn ${copiedId === task.id ? "copied" : ""}`}
                                                        onClick={() =>
                                                            copyCommand(task.script, task.id)
                                                        }
                                                        style={{ color: copiedId === task.id ? 'var(--text-inverse)' : 'var(--text-muted)' }}
                                                    >
                                                        {copiedId === task.id ? (
                                                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!</>
                                                        ) : (
                                                            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy</>
                                                        )}
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
                            <div className="export-bar" style={{ marginTop: '80px', paddingBottom: '40px' }}>
                                <button className="btn btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                    Export Markdown
                                </button>
                                <button className="btn btn-ghost" onClick={newLab} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 8 12 12 16 14"></polyline></svg>
                                    New Execution
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
