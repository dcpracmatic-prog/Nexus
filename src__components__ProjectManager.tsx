import React, { useState } from "react";
import {
  FolderKanban,
  Plus,
  ArrowUpRight,
  Clock,
  Sparkles,
  Users,
  Workflow as WorkflowIcon,
  Tag,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Play
} from "lucide-react";
import { Project, Agent, Workflow, DelegatedJob } from "../types";

interface ProjectManagerProps {
  projects: Project[];
  agents: Agent[];
  workflows: Workflow[];
  jobs: DelegatedJob[];
  onSelectProject: (projectId: string) => void;
  onCreateProject: (newProj: Partial<Project>) => void;
  onNavigateToDelegate: (projectId?: string) => void;
  onNavigateToWorkflows: (projectId?: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  agents,
  workflows,
  jobs,
  onSelectProject,
  onCreateProject,
  onNavigateToDelegate,
  onNavigateToWorkflows
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New project form state
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Optimizacion Combinatoria");
  const [newPriority, setNewPriority] = useState<"alta" | "media" | "baja">("alta");
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(["agent-supervisor", "agent-morph"]);
  const [tagInput, setTagInput] = useState("");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(projects.map((p) => p.category)));

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    onCreateProject({
      title: newTitle.trim(),
      description: newDesc.trim() || "Proyecto sin descripción adicional.",
      category: newCategory,
      priority: newPriority,
      status: "active",
      agentIds: selectedAgentIds,
      workflowIds: [],
      tags: tags.length > 0 ? tags : ["Multi-Agente", "Automatizacion"]
    });

    setNewTitle("");
    setNewDesc("");
    setTagInput("");
    setIsModalOpen(false);
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "alta":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "media":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "baja":
        return "bg-slate-50 text-slate-700 border-slate-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Proyectos Activos</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{projects.length}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Entornos sincronizados
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
            <FolderKanban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flujos de Trabajo</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{workflows.length}</p>
            <p className="text-[11px] text-indigo-600 font-medium mt-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Pipelines modulares
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100">
            <WorkflowIcon className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trabajos Delegados</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{jobs.length}</p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {jobs.filter((j) => j.status === "completed").length} completados
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Flota de Agentes</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{agents.length}</p>
            <p className="text-[11px] text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Users className="w-3 h-3" /> 1 nodo LLaMA respaldo
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Users className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              id="search-projects-input"
              type="text"
              placeholder="Buscar proyectos por nombre, descripción o etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              id="filter-category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-2 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          id="btn-create-project"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Proyecto</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProjects.map((project) => {
          const assignedAgents = agents.filter((a) => project.agentIds.includes(a.id));
          const projectWorkflows = workflows.filter((w) => w.projectId === project.id);
          const projectJobs = jobs.filter((j) => j.projectId === project.id);

          return (
            <div
              key={project.id}
              id={`project-card-${project.id}`}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5">
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                    {project.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getPriorityBadge(
                      project.priority
                    )}`}
                  >
                    Prioridad {project.priority}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Assigned Agents */}
                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Equipo de Agentes</p>
                    <div className="flex items-center -space-x-1.5">
                      {assignedAgents.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          title={`${a.name} (${a.role})`}
                          className={`w-7 h-7 rounded-full text-white text-[11px] font-bold flex items-center justify-center border-2 border-white shadow-xs ${a.avatarColor}`}
                        >
                          {a.name.charAt(0)}
                        </div>
                      ))}
                      {assignedAgents.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold flex items-center justify-center border-2 border-white shadow-xs">
                          +{assignedAgents.length - 4}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Métricas</p>
                    <p className="text-xs font-semibold text-slate-700">
                      {projectWorkflows.length} Flujos · {projectJobs.length} Trabajos
                    </p>
                  </div>
                </div>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {project.tags.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-medium"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  id={`btn-delegate-${project.id}`}
                  onClick={() => onNavigateToDelegate(project.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Delegar Tarea</span>
                </button>

                <button
                  id={`btn-view-workflows-${project.id}`}
                  onClick={() => onNavigateToWorkflows(project.id)}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <span>Ver Flujos</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal to Create Project */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Crear Nuevo Proyecto</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Proyecto *</label>
                <input
                  id="input-project-name"
                  type="text"
                  required
                  placeholder="Ej: Pipeline de Optimización de Redes Densas"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción del Objetivo</label>
                <textarea
                  id="input-project-desc"
                  rows={3}
                  placeholder="Describe los alcances y metas del proyecto..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    id="select-project-cat"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="Optimizacion Combinatoria">Optimizacion Combinatoria</option>
                    <option value="Computacion de Alto Rendimiento">Computacion de Alto Rendimiento</option>
                    <option value="Seguridad y Telemetria">Seguridad y Telemetria</option>
                    <option value="Procesamiento de Datos">Procesamiento de Datos</option>
                    <option value="Auditoria de Algoritmos">Auditoria de Algoritmos</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
                  <select
                    id="select-project-priority"
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
              </div>

              {/* Agent Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Agentes Asignados al Proyecto
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1">
                  {agents.map((ag) => {
                    const isSelected = selectedAgentIds.includes(ag.id);
                    return (
                      <label
                        key={ag.id}
                        className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-colors text-xs ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedAgentIds([...selectedAgentIds, ag.id]);
                            } else {
                              setSelectedAgentIds(selectedAgentIds.filter((id) => id !== ag.id));
                            }
                          }}
                          className="w-3.5 h-3.5 accent-indigo-600 rounded"
                        />
                        <span className="font-medium truncate">{ag.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Etiquetas (separadas por coma)
                </label>
                <input
                  id="input-project-tags"
                  type="text"
                  placeholder="Graph, MIS, SpMM, Failover"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  id="submit-create-project"
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
