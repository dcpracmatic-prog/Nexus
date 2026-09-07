import React, { useState } from "react";
import {
  BrainCircuit,
  Radio,
  ShieldCheck,
  Server,
  Zap,
  Mic,
  LogIn,
  LogOut,
  Sparkles,
  AlertTriangle,
  FolderKanban,
  Workflow,
  Send,
  Database,
  Users,
  Terminal,
  Cpu,
  Binary,
  FlaskConical,
  Settings,
  Blocks
} from "lucide-react";
import { User } from "firebase/auth";
import { signInWithGoogle, logOut } from "../lib/firebase";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: User | null;
  forceLlamaFallback: boolean;
  setForceLlamaFallback: (v: boolean) => void;
  onOpenVoice: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  user,
  forceLlamaFallback,
  setForceLlamaFallback,
  onOpenVoice
}) => {
  const [authLoading, setAuthLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Sign in failed:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const navItems = [
    { id: "nexus", label: "NEXUS", icon: Blocks },
    { id: "runtime", label: "Runtime", icon: ShieldCheck },
    { id: "projects", label: "Legacy / Proyectos", icon: FolderKanban },
    { id: "workflows", label: "Legacy / Flujos", icon: Workflow },
    { id: "delegate", label: "Legacy / Delegar", icon: Send },
    { id: "logic-engine", label: "LOGIC MML", icon: Binary },
    { id: "terminal", label: "Terminal", icon: Terminal },
    { id: "validation", label: "Laboratorio", icon: FlaskConical },
    { id: "solidarities", label: "Tools", icon: Cpu },
    { id: "vectordb", label: "Memoria", icon: Database },
    { id: "agents", label: "Agentes", icon: Users },
    { id: "settings", label: "Ajustes", icon: Settings }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      {/* Top Banner: Status & Controls */}
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-300">NEXUS™:</span>
            <span className="text-emerald-300 font-mono font-semibold">Runtime de creación computacional</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <Binary className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-300">LOGIC MML:</span>
            <span className="text-indigo-300 font-mono font-semibold">Invariante Causal (MWIS)</span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3">
            <Server className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-slate-300">Runtime LLaMA:</span>
            <span className={`font-mono px-1.5 py-0.5 rounded text-[11px] ${forceLlamaFallback ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold' : 'text-slate-400'}`}>
              {forceLlamaFallback ? "FORZADO (FAILOVER ACTIVO)" : "ARMADO & AUTO-DETECT"}
            </span>
          </div>

          <div className="flex items-center gap-1.5 border-l border-slate-700 pl-3 hidden lg:flex">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-300">Vector Store:</span>
            <span className="text-cyan-300 font-mono">64D RAG Activo</span>
          </div>
        </div>

        {/* Action Toggle for Failover Simulation */}
        <div className="flex items-center gap-3">
          <label
            id="toggle-failover-label"
            className="flex items-center gap-2 cursor-pointer select-none bg-slate-800 hover:bg-slate-750 px-2.5 py-1 rounded border border-slate-700 transition-colors"
            title="Simula una falla en la API externa para activar inmediatamente el motor de respaldo local LLaMA"
          >
            <AlertTriangle className={`w-3.5 h-3.5 ${forceLlamaFallback ? 'text-amber-400 animate-bounce' : 'text-slate-400'}`} />
            <span className="text-[11px] text-slate-300 font-semibold">Simular Falla de API (LLaMA):</span>
            <input
              id="toggle-failover-checkbox"
              type="checkbox"
              checked={forceLlamaFallback}
              onChange={(e) => setForceLlamaFallback(e.target.checked)}
              className="w-3.5 h-3.5 accent-rose-500 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & App Name */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">NexusAgent Studio</h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Multi-Agente v2
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Flujos de trabajo autónomos con IA, Respaldo LLaMA & Memoria Vectorial
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-xs border border-slate-200"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600" : "text-slate-500"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Voice Interaction and User Profile */}
          <div className="flex items-center gap-2.5">
            <button
              id="voice-assistant-button"
              onClick={onOpenVoice}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all active:scale-95"
              title="Iniciar conversación vocal con Gemini Live API (gemini-3.1-flash-live-preview)"
            >
              <Mic className="w-3.5 h-3.5 animate-pulse" />
              <span className="hidden sm:inline">Comando de Voz</span>
            </button>

            {/* Auth Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || "Usuario"}
                    className="w-8 h-8 rounded-full border border-slate-300 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-800 font-semibold flex items-center justify-center text-xs border border-indigo-200">
                    {(user.displayName || user.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.displayName || user.email?.split("@")[0]}
                  </p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Sincronizado Firestore
                  </p>
                </div>
                <button
                  id="signout-button"
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="signin-button"
                onClick={handleSignIn}
                disabled={authLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all disabled:opacity-50"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authLoading ? "Accediendo..." : "Acceder con Google"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap ${
                  isActive ? "bg-indigo-600 text-white" : "text-slate-600 bg-slate-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
