import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Terminal, Eye, Code, Layers } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
  allowRawToggle?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  className = "",
  allowRawToggle = true
}) => {
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"purified" | "raw">("purified");

  // Text purification: remove leading/trailing raw artifacts and normalize fences
  const purifyText = (raw: string): string => {
    if (!raw) return "";
    let cleaned = raw.trim();
    // Fix unclosed codeblocks if any
    const codeBlockCount = (cleaned.match(/```/g) || []).length;
    if (codeBlockCount % 2 !== 0) {
      cleaned += "\n```";
    }
    return cleaned;
  };

  const purifiedContent = purifyText(content);

  const handleCopy = (codeText: string, index: number) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {allowRawToggle && (
        <div className="flex items-center justify-end gap-1.5 pb-1 text-[11px]">
          <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center gap-0.5">
            <button
              type="button"
              onClick={() => setViewMode("purified")}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === "purified"
                  ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>Purificado</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("raw")}
              className={`px-2 py-0.5 rounded-md font-medium transition-all flex items-center gap-1 ${
                viewMode === "raw"
                  ? "bg-white text-indigo-700 shadow-2xs font-semibold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Code className="w-3 h-3" />
              <span>Raw</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === "raw" ? (
        <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800 leading-relaxed">
          {content}
        </div>
      ) : (
        <div className="prose prose-slate max-w-none text-slate-800 text-xs leading-relaxed space-y-3">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-base font-bold text-slate-900 mt-4 mb-2 pb-1 border-b border-slate-200 flex items-center gap-1.5">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-sm font-bold text-slate-900 mt-3 mb-1.5 flex items-center gap-1.5">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mt-2.5 mb-1">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="text-xs text-slate-700 leading-relaxed mb-2 font-normal">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc list-inside space-y-1 my-2 text-xs text-slate-700 pl-1">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside space-y-1 my-2 text-xs text-slate-700 pl-1">
                  {children}
                </ol>
              ),
              li: ({ children }) => <li className="text-xs leading-relaxed">{children}</li>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-indigo-500 bg-indigo-50/50 px-3.5 py-2 my-2 rounded-r-xl text-slate-700 italic text-xs">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-3 rounded-xl border border-slate-200 shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse divide-y divide-slate-200">
                    {children}
                  </table>
                </div>
              ),
              thead: ({ children }) => (
                <thead className="bg-slate-100/80 font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                  {children}
                </thead>
              ),
              tbody: ({ children }) => (
                <tbody className="divide-y divide-slate-100 bg-white">{children}</tbody>
              ),
              tr: ({ children }) => (
                <tr className="hover:bg-slate-50/70 transition-colors">{children}</tr>
              ),
              th: ({ children }) => (
                <th className="px-3.5 py-2.5 font-semibold text-slate-900">{children}</th>
              ),
              td: ({ children }) => (
                <td className="px-3.5 py-2 text-slate-700 font-mono text-[11px]">{children}</td>
              ),
              code: ({ node, className, children, ...props }: any) => {
                const match = /language-(\w+)/.exec(className || "");
                const isInline = !match && !String(children).includes("\n");

                if (isInline) {
                  return (
                    <code
                      className="bg-slate-100 text-indigo-700 font-mono text-[11px] px-1.5 py-0.5 rounded border border-slate-200/80"
                      {...props}
                    >
                      {children}
                    </code>
                  );
                }

                const codeString = String(children).replace(/\n$/, "");
                const lang = match ? match[1] : "bash";
                const blockId = Math.random();

                return (
                  <div className="my-3 rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-900 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                      <span className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase text-[10px]">
                        <Terminal className="w-3.5 h-3.5" />
                        {lang}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(codeString, 1)}
                        className="hover:text-white transition-colors flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700"
                      >
                        {copiedCodeIndex === 1 ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="p-3.5 overflow-x-auto text-emerald-400 font-mono text-xs leading-relaxed">
                      <code>{codeString}</code>
                    </div>
                  </div>
                );
              }
            }}
          >
            {purifiedContent}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};
