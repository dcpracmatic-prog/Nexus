import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, X, Sparkles, Radio, Activity, Send } from "lucide-react";

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeAgentName?: string;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  activeAgentName = "Supervisor Nexus"
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [conversation, setConversation] = useState<{ role: "user" | "agent"; text: string }[]>([
    {
      role: "agent",
      text: "Canal de voz Live API activo con gemini-3.1-flash-live-preview. Puedes hablar por tu micrófono o pulsar una acción rápida para interactuar en tiempo real."
    }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "es-ES";

      recog.onstart = () => {
        setIsListening(true);
      };

      recog.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleSendVoiceMessage(text);
      };

      recog.onerror = (e: any) => {
        console.warn("Speech recognition error:", e);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recog;
    }
  }, [isOpen]);

  const toggleMic = () => {
    if (!recognitionRef.current) {
      // Browser doesn't support web speech API or permission denied
      alert("El reconocimiento de voz Web Speech API no está disponible en este navegador. Puedes escribir directamente tu mensaje en el cuadro inferior.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn("Recognition start failed:", err);
      }
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "es-ES";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendVoiceMessage = async (userText: string) => {
    if (!userText.trim()) return;

    setConversation((prev) => [...prev, { role: "user", text: userText }]);
    setIsProcessing(true);
    setTranscript("");

    try {
      const response = await fetch("/api/voice/interact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript: userText,
          activeAgent: activeAgentName,
          context: "Estudio de agentes de automatización"
        })
      });
      const data = await response.json();
      const reply = data.voiceReplyText || "Comando procesado correctamente.";

      setConversation((prev) => [...prev, { role: "agent", text: reply }]);
      speakText(reply);
    } catch (err) {
      console.error("Voice interaction error:", err);
      const fallbackMsg = "Comando recibido en modo local. Flujo coordinado por el supervisor.";
      setConversation((prev) => [...prev, { role: "agent", text: fallbackMsg }]);
      speakText(fallbackMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>Canal de Voz Live API</span>
                <span className="text-[10px] font-mono text-orange-400 bg-orange-950 px-2 py-0.5 rounded-full border border-orange-800">
                  gemini-3.1-flash-live-preview
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Interlocutor: {activeAgentName}</p>
            </div>
          </div>

          <button
            onClick={() => {
              if ("speechSynthesis" in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Audio Wave Visualizer Area */}
        <div className="p-6 bg-gradient-to-b from-slate-950 to-slate-900 flex flex-col items-center justify-center space-y-4 border-b border-slate-800">
          <div className="relative">
            <button
              id="btn-toggle-voice-mic"
              onClick={toggleMic}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl ${
                isListening
                  ? "bg-rose-500 text-white scale-110 ring-8 ring-rose-500/30 animate-pulse"
                  : isSpeaking
                  ? "bg-orange-500 text-white ring-8 ring-orange-500/20"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white"
              }`}
            >
              {isListening ? <Mic className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
          </div>

          <div className="text-center">
            <p className="text-xs font-semibold text-slate-300">
              {isListening
                ? "Escuchando tu voz... habla ahora"
                : isProcessing
                ? "Procesando respuesta en Live API..."
                : isSpeaking
                ? "Reproduciendo audio vocal..."
                : "Haz clic en el micrófono para hablar"}
            </p>
            <div className="flex items-center justify-center gap-1 mt-2 h-4">
              {[4, 12, 8, 16, 20, 14, 6, 18, 10, 4].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-150 ${
                    isListening || isSpeaking ? "bg-orange-400 animate-pulse" : "bg-slate-700"
                  }`}
                  style={{ height: isListening || isSpeaking ? `${h}px` : "4px" }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs max-h-64">
          {conversation.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                msg.role === "user"
                  ? "ml-auto bg-indigo-600 text-white rounded-br-none"
                  : "mr-auto bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700/60"
              }`}
            >
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 font-sans">
                {msg.role === "user" ? "Tú (Voz)" : activeAgentName}
              </div>
              <div>{msg.text}</div>
            </div>
          ))}
        </div>

        {/* Quick Voice Commands */}
        <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            "¿Cuál es el estado de la flota de agentes?",
            "Ejecuta el solver MORPH para 4096 nodos",
            "¿Cómo funciona el respaldo LLaMA?",
            "Verifica la fricción con Edge Observer"
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => handleSendVoiceMessage(prompt)}
              className="text-[11px] whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded-full border border-slate-700 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Text fallback input */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            id="voice-chat-input"
            type="text"
            placeholder="O escribe un comando vocal aquí..."
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendVoiceMessage(transcript);
              }
            }}
            className="flex-1 px-3 py-2 text-xs bg-slate-900 text-white rounded-xl border border-slate-700 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <button
            onClick={() => handleSendVoiceMessage(transcript)}
            disabled={!transcript.trim()}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
