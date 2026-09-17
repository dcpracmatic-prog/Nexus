import React, { useState } from "react";
import { BrainCircuit, Blocks, Settings, LogIn, LogOut, UserRound } from "lucide-react";
import type { NexusSessionUser } from "../lib/session";
import { signInWithGoogle, logOut, isFirebaseAvailable } from "../lib/firebase";

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: NexusSessionUser;
  onUserChange: (user: NexusSessionUser) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, user, onUserChange }) => {
  const [authLoading, setAuthLoading] = useState(false);
  const [authHint, setAuthHint] = useState("");

  const handleSignIn = async () => {
    try {
      setAuthLoading(true);
      setAuthHint("");
      const remote = await signInWithGoogle();
      if (remote) onUserChange(remote);
    } catch (err: any) {
      console.error("Sign in failed:", err);
      setAuthHint(err?.message || "Google no disponible — sigue en modo invitado.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      const { GUEST_USER, clearSessionUser, persistSessionUser } = await import("../lib/session");
      clearSessionUser();
      persistSessionUser(GUEST_USER);
      onUserChange({ ...GUEST_USER });
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const navItems = [
    { id: "nexus", label: "NEXUS", icon: Blocks },
    { id: "settings", label: "Ajustes", icon: Settings }
  ];

  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-40 shadow-xs">
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300">NEXUS™:</span>
          <span className="text-emerald-300 font-mono font-semibold">
            Creación gobernada · módulos + salida
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {user.isGuest ? "Modo invitado local" : "Sesión sincronizada"} · LLaMA/Ollama opcional
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center shadow-md shadow-indigo-600/20 ring-1 ring-indigo-500/30">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">NEXUS</h1>
                <span className="bg-indigo-50 text-indigo-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-indigo-200">
                  Creación gobernada
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Crear · Analizar · Experimentar · Recursos · Management · Render · Salida
              </p>
            </div>
          </div>

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

          <div className="flex items-center gap-2.5">
            {!user.isGuest ? (
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
                    {(user.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-slate-800 leading-tight truncate max-w-[120px]">
                    {user.displayName}
                  </p>
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Sincronizado
                  </p>
                </div>
                <button
                  id="signout-button"
                  onClick={handleSignOut}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                  title="Volver a invitado local"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold">
                  <UserRound className="w-3.5 h-3.5" />
                  Invitado local
                </div>
                <button
                  id="signin-button"
                  onClick={handleSignIn}
                  disabled={authLoading}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-all disabled:opacity-50"
                  title={isFirebaseAvailable() ? "Opcional" : "Firebase opcional — demo no lo requiere"}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{authLoading ? "Accediendo..." : "Google (opcional)"}</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {authHint && (
          <p className="pb-2 text-[11px] text-amber-700">{authHint}</p>
        )}

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
