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

  const generate = async () => {
    if (!files.length) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fileContents = await Promise.all(
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

      const userMessage = `Here are my project files:\n\n${fileContents.join("\n\n")}\n\nPlease analyze these files and generate the project metadata and README.`;

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      const data = await response.json();
      const raw = data.content.map(b => b.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
      setActiveTab("readme");
    } catch (e) {
      setError("Failed to generate. Make sure your files are readable text files and try again.");
      console.error(e);
    } finally {
      setLoading(false);
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

        {/* Uploader */}
        <div style={{ marginBottom: "24px" }}>
          <FileUploader onFiles={handleFiles} />
        </div>

        {/* File List */}
        {files.length > 0 && (
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
          disabled={!files.length || loading}
          style={{
            width: "100%",
            padding: "14px",
            background: files.length && !loading
              ? "linear-gradient(135deg, #10b981, #3b82f6)"
              : "#1e293b",
            color: files.length && !loading ? "white" : "#475569",
            border: "none",
            borderRadius: "10px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: files.length && !loading ? "pointer" : "not-allowed",
            marginBottom: "32px",
            transition: "all 0.2s",
          }}
        >
          {loading ? "⚙️ Analyzing your project..." : "✨ Generate GitHub Assets"}
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
          </div>
        )}
      </div>
    </div>
  );
}
