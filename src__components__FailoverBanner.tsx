import React from "react";
import { ServerCrash, CheckCircle2, ShieldAlert, Zap, ArrowRight } from "lucide-react";

interface FailoverBannerProps {
  forceLlamaFallback: boolean;
  onDisableFallback: () => void;
  lastFallbackReason?: string;
}

export const FailoverBanner: React.FC<FailoverBannerProps> = ({
  forceLlamaFallback,
  onDisableFallback,
  lastFallbackReason
}) => {
  if (!forceLlamaFallback && !lastFallbackReason) return null;

  return (
    <div
      id="failover-status-banner"
      className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-900 text-white border-b border-rose-700/50 px-4 py-2.5 shadow-inner text-xs"
    >
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ServerCrash className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <span className="font-bold text-rose-200 uppercase tracking-wide">
              {forceLlamaFallback ? "Modo Respaldo LLaMA Forzado" : "Conmutación por Falla (Failover) Activada"}
            </span>
            <p className="text-slate-300 text-[11px] mt-0.5">
              {lastFallbackReason ||
                "Las solicitudes de inferencia están siendo resueltas por el motor de respaldo local LLaMA-3 / Qwen GGUF para garantizar tolerancia a fallos."}
            </p>
          </div>
        </div>

        {forceLlamaFallback && (
          <button
            id="disable-failover-btn"
            onClick={onDisableFallback}
            className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold transition-colors text-[11px]"
          >
            <span>Restablecer API Gemini</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
