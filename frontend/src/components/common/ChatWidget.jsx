import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

export default function ChatWidget({ currentUser }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: '¡Hola! Soy tu Asistente de IA en Project Planner. Puedo ayudarte con la planificación de proyectos, dudas operativas, hitos o estado del equipo. ¿En qué te puedo colaborar hoy?',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll al final de la conversación
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages, isStreaming]);

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isStreaming) return;

    // Optimistic UI Update: Añadir inmediatamente el mensaje del usuario
    // y la burbuja optimista de la IA con animate-pulse
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      {
        role: 'ai',
        text: 'Analizando información técnica del proyecto...',
        isOptimistic: true,
      },
    ]);
    setInputMessage('');
    setIsStreaming(true);

    let timerId;

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('No se encontró la variable VITE_GEMINI_API_KEY configurada.');
      }

      // 1. Instanciación del cliente Gemini y modelo dentro del bloque try...catch
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-3.8-flash',
        systemInstruction:
          'Asistente Técnico de Project Planner, proporcionando respuestas precisas y usando listas Markdown.',
      });

      // 2. Temporizador de 8 segundos para evitar bloqueos de red
      const timeout = new Promise((_, reject) => {
        timerId = setTimeout(
          () =>
            reject(
              new Error(
                'La red tardó demasiado en responder (Timeout). Revisa tu conexión, VPN o bloqueadores de anuncios.'
              )
            ),
          8000
        );
      });

      // 3. Ejecución del stream compitiendo contra el temporizador
      const prompt = [{ role: 'user', parts: [{ text: trimmed }] }];
      const result = await Promise.race([
        model.generateContentStream({ contents: prompt }),
        timeout,
      ]);

      if (timerId) clearTimeout(timerId);

      let accumulatedText = '';
      let isFirstChunk = true;

      // Iterar asíncronamente sobre el stream en tiempo real (efecto máquina de escribir)
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (!chunkText) continue;

        if (isFirstChunk) {
          isFirstChunk = false;
          accumulatedText = chunkText;
        } else {
          accumulatedText += chunkText;
        }

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'ai',
            text: accumulatedText,
            isOptimistic: false,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error('Error al comunicarse con Gemini:', error);
      const errorMsg = error?.message || 'Error desconocido';

      // En catch (error), actualiza el último mensaje (la burbuja optimista)
      // quitándole el animate-pulse y reemplazando su texto temporal
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        updated[lastIndex] = {
          role: 'ai',
          text: `❌ Error de conexión: ${errorMsg}`,
          isOptimistic: false,
        };
        return updated;
      });
    } finally {
      if (timerId) clearTimeout(timerId);
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: 'ai',
        text: 'Conversación reiniciada. ¿En qué más puedo asistirte hoy?',
      },
    ]);
  };

  const userRoleDisplay =
    currentUser?.role_display ||
    (currentUser?.is_staff ? 'Administrador' : 'Técnico');

  return (
    <>
      {/* Botón flotante launcher */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-tr from-cyan-600 to-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-[#080E1C]"
          aria-label="Abrir Asistente de IA"
        >
          <Sparkles className="w-6 h-6 transition-transform duration-300 group-hover:rotate-12" />
        </button>
      )}

      {/* Ventana de chat desplegable */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[92vw] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#080E1C] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#0D1527] border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-slate-950 to-slate-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <span>Asistente AI</span>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    Gemini 3.8
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En línea • {userRoleDisplay}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Limpiar conversación"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                aria-label="Limpiar conversación"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Cerrar chat"
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-lg transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Área de Mensajes con Scroll */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start gap-2.5'}`}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/80 flex items-center justify-center shrink-0 text-cyan-400 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`text-sm leading-relaxed max-w-[84%] rounded-2xl px-4 py-2.5 break-words whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-cyan-950/80 text-cyan-100 border border-cyan-600/40 rounded-br-xs shadow-sm'
                      : `bg-[#0D1527] border border-slate-800/90 rounded-bl-xs shadow-sm ${
                          msg.isOptimistic
                            ? 'animate-pulse text-cyan-300/90 italic'
                            : 'text-slate-200'
                        }`
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            <div ref={messagesEndRef} />
          </div>

          {/* Input inferior con botón de enviar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#0D1527] border-t border-slate-800/80 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregúntale al Asistente..."
              disabled={isStreaming}
              className="flex-1 bg-[#080E1C] border border-slate-700/70 text-slate-100 placeholder-slate-500 text-sm rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isStreaming}
              className="w-10 h-10 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 font-medium flex items-center justify-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-cyan-500/20"
              aria-label="Enviar mensaje"
            >
              {isStreaming ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

