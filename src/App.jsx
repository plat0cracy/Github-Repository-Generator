import { useState, useCallback } from "react";

const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are an expert software engineer and technical writer. Given the contents of project files, you will analyze the project and return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:

{
  "projectName": "string",
  "description": "string (2-3 sentences, compelling project description)",
  "techStack": ["string"],
  "folderStructure": [
    { "name": "string", "type": "folder|file", "description": "string", "children": [] }
  ],
  "readme": "string (full markdown README content)"
}

The README should include:
- Project title and badges (use shields.io placeholders)
- Overview section
- Features section
- Tech stack section
- Folder structure section (as a tree)
- Installation & Usage section
- Contributing section
- License section

Make the README professional, detailed, and ready to use on GitHub.`;

function FileUploader({ onFiles }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    onFiles(files);
  }, [onFiles]);

  const handleInput = (e) => {
    onFiles(Array.from(e.target.files));
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${dragging ? "#6ee7b7" : "#334155"}`,
        borderRadius: "16px",
        padding: "48px 32px",
        textAlign: "center",
        background: dragging ? "rgba(110,231,183,0.05)" : "rgba(15,23,42,0.6)",
        cursor: "pointer",
        transition: "all 0.2s",
      }}
    >
      <div style={{ fontSize: "40px", marginBottom: "12px" }}>📁</div>
      <p style={{ color: "#94a3b8", marginBottom: "16px", fontSize: "15px" }}>
        Drop your project files here, or click to browse
      </p>
      <label style={{
        background: "linear-gradient(135deg, #10b981, #3b82f6)",
        color: "white",
        padding: "10px 24px",
        borderRadius: "8px",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "600",
        display: "inline-block",
      }}>
        Browse Files
        <input type="file" multiple onChange={handleInput} style={{ display: "none" }} />
      </label>
      <p style={{ color: "#475569", fontSize: "12px", marginTop: "12px" }}>
        Supports .js, .py, .ts, .json, .md, .txt, .html, .css, .java, .go, .rs, .cpp, .yaml, .toml, and more
      </p>
    </div>
  );
}

function FolderTree({ items, depth = 0 }) {
  return (
    <div style={{ paddingLeft: depth * 20 }}>
      {items.map((item, i) => (
        <div key={i}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "4px 0" }}>
            <span>{item.type === "folder" ? "📂" : "📄"}</span>
            <div>
              <span style={{ color: item.type === "folder" ? "#6ee7b7" : "#93c5fd", fontFamily: "monospace", fontSize: "13px" }}>
                {item.name}
              </span>
              {item.description && (
                <span style={{ color: "#64748b", fontSize: "12px", marginLeft: "8px" }}>— {item.description}</span>
              )}
            </div>
          </div>
          {item.children?.length > 0 && <FolderTree items={item.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      background: copied ? "#10b981" : "#1e293b",
      border: "1px solid #334155",
      color: copied ? "white" : "#94a3b8",
      padding: "6px 14px",
      borderRadius: "6px",
      fontSize: "12px",
      cursor: "pointer",
      transition: "all 0.2s",
    }}>
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("readme");
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("files");
  const [repoUrl, setRepoUrl] = useState("");
  const [githubToken, setGithubToken] = useState("");
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null);

  const readableExtensions = [
    "js","jsx","ts","tsx","py","json","md","txt","html","css","java","go",
    "rs","cpp","c","h","yaml","yml","toml","sh","env","gitignore","xml","rb","php","swift","kt"
  ];

  const handleFiles = (newFiles) => {
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name));
      const unique = newFiles.filter(f => !existing.has(f.name));
      return [...prev, ...unique];
    });
    setResult(null);
    setError(null);
  };

  const removeFile = (name) => setFiles(prev => prev.filter(f => f.name !== name));

  const callClaude = async (fileContents, context = "") => {
    const userMessage = `Here are my project files${context}:\n\n${fileContents.join("\n\n")}\n\nPlease analyze these files and generate the project metadata and README.`;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-allow-browser": "true",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    const raw = data.content.map(b => b.text || "").join("");
    const clean = raw.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  };

  const parseGitHubUrl = (url) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/?#]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
  };

  const generate = async () => {
    if (mode === "files" && !files.length) return;
    if (mode === "repo" && !repoUrl) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPushResult(null);

    try {
      let fileContents = [];
      let repoInfo = null;

      if (mode === "files") {
        fileContents = await Promise.all(
          files.map(async (file) => {
            const ext = file.name.split(".").pop().toLowerCase();
            if (!readableExtensions.includes(ext)) {
              return `--- ${file.name} (binary/unsupported, size: ${(file.size / 1024).toFixed(1)}KB) ---`;
            }
            const text = await file.text();
            const truncated = text.length > 3000 ? text.slice(0, 3000) + "\n... (truncated)" : text;
            return `--- ${file.name} ---\n${truncated}`;
          })
        );
      } else {
        repoInfo = parseGitHubUrl(repoUrl);
        if (!repoInfo) throw new Error("Invalid GitHub URL");
        const ghHeaders = { "Accept": "application/vnd.github+json" };
        if (githubToken) ghHeaders["Authorization"] = `Bearer ${githubToken}`;
        const treeRes = await fetch(
          `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/git/trees/HEAD?recursive=1`,
          { headers: ghHeaders }
        );
        const treeData = await treeRes.json();
        if (!treeRes.ok) throw new Error(treeData.message || "Failed to fetch repository");
        const filesToFetch = treeData.tree
          .filter(f => f.type === "blob" && (f.size || 0) < 100000)
          .filter(f => readableExtensions.includes(f.path.split(".").pop().toLowerCase()))
          .slice(0, 25);
        fileContents = await Promise.all(
          filesToFetch.map(async (file) => {
            const res = await fetch(
              `https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents/${file.path}`,
              { headers: ghHeaders }
            );
            const fileData = await res.json();
            if (fileData.content) {
              const text = atob(fileData.content.replace(/\n/g, ""));
              const truncated = text.length > 3000 ? text.slice(0, 3000) + "\n... (truncated)" : text;
              return `--- ${file.path} ---\n${truncated}`;
            }
            return `--- ${file.path} (unreadable) ---`;
          })
        );
      }

      const parsed = await callClaude(fileContents, mode === "repo" ? ` from ${repoUrl}` : "");
      setResult({ ...parsed, _repoInfo: repoInfo });
      setActiveTab("readme");
    } catch (e) {
      setError(e.message || "Failed to generate. Check your files and API key, then try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pushToGitHub = async () => {
    if (!result?._repoInfo || !githubToken) return;
    const { owner, repo } = result._repoInfo;
    setPushing(true);
    setPushResult(null);
    try {
      const headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": `Bearer ${githubToken}`,
        "Content-Type": "application/json",
      };
      const checkRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        { headers }
      );
      const body = {
        message: "Update README.md via GitHub Repo Generator",
        content: btoa(unescape(encodeURIComponent(result.readme))),
      };
      if (checkRes.ok) {
        const existing = await checkRes.json();
        body.sha = existing.sha;
      }
      const pushRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/README.md`,
        { method: "PUT", headers, body: JSON.stringify(body) }
      );
      if (pushRes.ok) {
        setPushResult({ success: true, message: `README.md pushed to ${owner}/${repo} successfully!` });
      } else {
        const err = await pushRes.json();
        throw new Error(err.message);
      }
    } catch (e) {
      setPushResult({ success: false, message: e.message });
    } finally {
      setPushing(false);
    }
  };

  const tabs = ["readme", "description", "structure"];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #020617 100%)",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#e2e8f0",
      padding: "32px 24px",
    }}>
      <div style={{ maxWidth: "860px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>🚀</div>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "800",
            background: "linear-gradient(135deg, #6ee7b7, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            margin: "0 0 8px",
          }}>
            GitHub Repo Generator
          </h1>
          <p style={{ color: "#64748b", fontSize: "15px", margin: 0 }}>
            Upload your project files → get a README, description & folder structure instantly
          </p>
        </div>

        {/* API Key */}
        <div style={{ marginBottom: "16px" }}>
          <input
            type="password"
            placeholder="Enter your Anthropic API key (sk-ant-...)"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              background: "rgba(15,23,42,0.8)",
              border: "1px solid #334155",
              borderRadius: "10px",
              color: "#e2e8f0",
              fontSize: "14px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />
        </div>

        {/* Mode Toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
          {["files", "repo"].map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setError(null); setPushResult(null); }} style={{
              flex: 1,
              padding: "10px",
              background: mode === m ? "rgba(16,185,129,0.15)" : "rgba(15,23,42,0.6)",
              border: `1px solid ${mode === m ? "#10b981" : "#334155"}`,
              borderRadius: "8px",
              color: mode === m ? "#6ee7b7" : "#64748b",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s",
            }}>
              {m === "files" ? "📁 Upload Files" : "🔗 GitHub Repository"}
            </button>
          ))}
        </div>

        {/* Uploader or Repo Input */}
        {mode === "files" ? (
          <div style={{ marginBottom: "24px" }}>
            <FileUploader onFiles={handleFiles} />
          </div>
        ) : (
          <div style={{ marginBottom: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
            <input
              type="text"
              placeholder="GitHub repo URL (e.g. https://github.com/owner/repo)"
              value={repoUrl}
              onChange={e => setRepoUrl(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(15,23,42,0.8)",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#e2e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <input
              type="password"
              placeholder="GitHub Personal Access Token (required to push changes)"
              value={githubToken}
              onChange={e => setGithubToken(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 16px",
                background: "rgba(15,23,42,0.8)",
                border: "1px solid #334155",
                borderRadius: "10px",
                color: "#e2e8f0",
                fontSize: "14px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />
            <p style={{ color: "#475569", fontSize: "12px", margin: 0 }}>
              Token needs <strong style={{ color: "#64748b" }}>repo</strong> scope. Generate at GitHub → Settings → Developer Settings → Personal Access Tokens.
            </p>
          </div>
        )}

        {/* File List */}
        {mode === "files" && files.length > 0 && (
          <div style={{
            background: "rgba(15,23,42,0.8)",
            border: "1px solid #1e293b",
            borderRadius: "12px",
            padding: "16px",
            marginBottom: "20px",
          }}>
            <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>
              {files.length} file{files.length > 1 ? "s" : ""} loaded
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {files.map(f => (
                <div key={f.name} style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  background: "#1e293b", borderRadius: "6px", padding: "4px 10px",
                  fontSize: "13px", color: "#94a3b8",
                }}>
                  <span>📄</span>
                  <span>{f.name}</span>
                  <button onClick={() => removeFile(f.name)} style={{
                    background: "none", border: "none", color: "#475569",
                    cursor: "pointer", fontSize: "14px", padding: "0 2px",
                  }}>×</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <button
          onClick={generate}
          disabled={(mode === "files" ? !files.length : !repoUrl) || loading}
          style={{
            width: "100%",
            padding: "14px",
            background: (mode === "files" ? files.length : repoUrl) && !loading
              ? "linear-gradient(135deg, #10b981, #3b82f6)"
              : "#1e293b",
            color: (mode === "files" ? files.length : repoUrl) && !loading ? "white" : "#475569",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: (mode === "files" ? files.length : repoUrl) && !loading ? "pointer" : "not-allowed",
            marginBottom: "32px",
            transition: "all 0.2s",
          }}
        >
          {loading
            ? (mode === "repo" ? "⚙️ Fetching & analyzing repository..." : "⚙️ Analyzing your project...")
            : "✨ Generate GitHub Assets"}
        </button>

        {error && (
          <div style={{
            background: "rgba(239,68,68,0.1)", border: "1px solid #7f1d1d",
            borderRadius: "10px", padding: "16px", color: "#fca5a5",
            marginBottom: "24px", fontSize: "14px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div>
            {/* Project name + tech */}
            <div style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid #1e293b",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
            }}>
              <div>
                <h2 style={{ margin: "0 0 6px", fontSize: "20px", color: "#f1f5f9" }}>
                  {result.projectName}
                </h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {result.techStack?.map(t => (
                    <span key={t} style={{
                      background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
                      color: "#93c5fd", borderRadius: "20px", padding: "2px 10px", fontSize: "12px",
                    }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "0", borderBottom: "1px solid #1e293b" }}>
              {tabs.map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: "10px 20px",
                  background: "none",
                  border: "none",
                  borderBottom: activeTab === tab ? "2px solid #10b981" : "2px solid transparent",
                  color: activeTab === tab ? "#6ee7b7" : "#64748b",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  textTransform: "capitalize",
                  transition: "all 0.15s",
                }}>
                  {tab === "readme" ? "📄 README" : tab === "description" ? "📝 Description" : "📂 Structure"}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div style={{
              background: "rgba(15,23,42,0.9)",
              border: "1px solid #1e293b",
              borderTop: "none",
              borderRadius: "0 0 12px 12px",
              padding: "20px",
            }}>
              {activeTab === "readme" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                    <CopyButton text={result.readme} />
                  </div>
                  <pre style={{
                    background: "#0f172a", borderRadius: "8px", padding: "16px",
                    overflowX: "auto", fontSize: "12px", lineHeight: "1.7",
                    color: "#94a3b8", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    maxHeight: "400px", overflowY: "auto",
                    margin: 0,
                  }}>
                    {result.readme}
                  </pre>
                </div>
              )}

              {activeTab === "description" && (
                <div>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "12px" }}>
                    <CopyButton text={result.description} />
                  </div>
                  <p style={{ color: "#cbd5e1", lineHeight: "1.8", fontSize: "15px", margin: 0 }}>
                    {result.description}
                  </p>
                </div>
              )}

              {activeTab === "structure" && (
                <div>
                  <p style={{ color: "#64748b", fontSize: "12px", marginBottom: "16px", marginTop: 0 }}>
                    Suggested folder structure for your project
                  </p>
                  <FolderTree items={result.folderStructure || []} />
                </div>
              )}
            </div>

            {/* Push to GitHub */}
            {result._repoInfo && (
              <div style={{ marginTop: "16px" }}>
                <button
                  onClick={pushToGitHub}
                  disabled={pushing || !githubToken}
                  style={{
                    width: "100%",
                    padding: "12px",
                    background: pushing || !githubToken ? "#1e293b" : "linear-gradient(135deg, #7c3aed, #3b82f6)",
                    color: pushing || !githubToken ? "#475569" : "white",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "15px",
                    fontWeight: "700",
                    cursor: pushing || !githubToken ? "not-allowed" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {pushing ? "⚙️ Pushing to repository..." : "🚀 Push README.md to Repository"}
                </button>
                {!githubToken && (
                  <p style={{ color: "#475569", fontSize: "12px", textAlign: "center", marginTop: "8px" }}>
                    Enter a GitHub token above to push changes
                  </p>
                )}
                {pushResult && (
                  <div style={{
                    marginTop: "12px",
                    padding: "12px 16px",
                    borderRadius: "8px",
                    background: pushResult.success ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${pushResult.success ? "#065f46" : "#7f1d1d"}`,
                    color: pushResult.success ? "#6ee7b7" : "#fca5a5",
                    fontSize: "14px",
                  }}>
                    {pushResult.success ? "✓" : "⚠️"} {pushResult.message}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
