import React, { useState } from "react";
import {
  Database,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  ArrowRight,
  FileText,
  Activity,
  CheckCircle2,
  Hash,
  Scale
} from "lucide-react";
import { VectorDocument, Project } from "../types";

interface VectorDatabasePanelProps {
  vectorDocs: VectorDocument[];
  projects: Project[];
  onAddDocument: (doc: Partial<VectorDocument>) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
}

export const VectorDatabasePanel: React.FC<VectorDatabasePanelProps> = ({
  vectorDocs,
  projects,
  onAddDocument,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // New Document modal/drawer
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("Algoritmos, Contexto");
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/vector/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: searchQuery,
          documents: vectorDocs,
          topK: 5
        })
      });
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (err) {
      console.error("Vector search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    setIsSaving(true);
    try {
      // Generate embedding from server
      const embedRes = await fetch("/api/vector/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `${newTitle}\n${newContent}` })
      });
      const embedData = await embedRes.json();

      const tags = newTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      await onAddDocument({
        title: newTitle.trim(),
        content: newContent.trim(),
        tags: tags.length > 0 ? tags : ["Contexto"],
        projectId: selectedProjectId,
        embedding: embedData.embedding || [],
        dimensions: embedData.embedding?.length || 64,
        sizeBytes: new Blob([newContent]).size
      });

      setNewTitle("");
      setNewContent("");
      setIsAdding(false);
    } catch (err) {
      console.error("Error creating vector document:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Stats */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-cyan-600" />
            <h2 className="text-base font-bold text-slate-900">Base de Datos Vectorial para RAG Persistente</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Contexto semántico persistente y escalable en Firestore, indexado mediante embeddings y similitud del coseno.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] uppercase font-bold text-slate-400">Dimensión de Embeddings</span>
            <p className="text-xs font-mono font-bold text-slate-800">64-Dimensiones Unitarias</p>
          </div>
          <button
            id="btn-open-add-vector-doc"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Indexar Documento</span>
          </button>
        </div>
      </div>

      {/* Semantic Query Testing Simulator */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-cyan-600" />
          <span>Probador de Similitud Coseno (Semantic RAG Retrieval)</span>
        </h3>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            id="vector-search-input"
            type="text"
            placeholder="Ej: ¿Cuál es el presupuesto de tiempo y maximalidad de MORPH para MIS?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/20"
          />
          <button
            id="btn-run-vector-search"
            type="submit"
            disabled={isSearching}
            className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all disabled:opacity-50 flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isSearching ? "Buscando..." : "Consultar Embeddings"}</span>
          </button>
        </form>

        {/* Results of query */}
        {searchResults.length > 0 && (
          <div className="pt-2 space-y-3">
            <p className="text-xs font-bold text-slate-700">Top Coincidencias Semánticas Encontradas:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map((res: any, idx: number) => (
                <div
                  key={res.id || idx}
                  className="bg-cyan-50/60 border border-cyan-200/80 p-3.5 rounded-xl space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-950 truncate max-w-[200px]">{res.title}</span>
                    <span className="bg-cyan-600 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                      Score: {(res.similarityScore * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-700 line-clamp-3 leading-relaxed">{res.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Document Index List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
            Documentos Indexados en la Memoria Vectorial ({vectorDocs.length})
          </h3>
          <span className="text-xs text-slate-400">Persistente en Firestore</span>
        </div>

        <div className="divide-y divide-slate-100">
          {vectorDocs.map((doc) => {
            const project = projects.find((p) => p.id === doc.projectId);
            return (
              <div key={doc.id} className="p-5 hover:bg-slate-50/80 transition-colors space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-600" />
                      <h4 className="text-sm font-bold text-slate-900">{doc.title}</h4>
                      {project && (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-medium">
                          {project.title}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {doc.tags?.map((t) => (
                        <span key={t} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-1 rounded">
                      {doc.sizeBytes} B
                    </span>
                    <button
                      onClick={() => onDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Eliminar documento vectorial"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{doc.content}</p>

                {/* Vector visualization slice */}
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-cyan-400 flex items-center justify-between overflow-x-auto">
                  <span>Vector Embedding (muestra 8D/64D):</span>
                  <span className="text-slate-400 truncate max-w-md ml-2">
                    {doc.embedding && doc.embedding.length > 0
                      ? `[${doc.embedding.slice(0, 8).join(", ")} ...]`
                      : "[Generado dinámicamente]"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal for adding Vector Document */}
      {isAdding && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-cyan-600" />
                <h2 className="text-base font-bold text-slate-900">Indexar Nuevo Documento Vectorial</h2>
              </div>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDocument} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del Documento *</label>
                <input
                  id="vdoc-title-input"
                  type="text"
                  required
                  placeholder="Ej: Especificación de Tolerancia a Fallos LLaMA"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proyecto Vinculado</label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contenido Textual para Embeddings *
                </label>
                <textarea
                  id="vdoc-content-input"
                  required
                  rows={4}
                  placeholder="Pega texto técnico, manuales de procedimiento o reglas de inferencia que los agentes deben conocer..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Etiquetas (separadas por coma)</label>
                <input
                  type="text"
                  placeholder="MIS, HBAG, Redes, Guardrails"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-cyan-500/20 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="btn-submit-add-vector"
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {isSaving ? "Generando Vector..." : "Guardar e Indexar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
