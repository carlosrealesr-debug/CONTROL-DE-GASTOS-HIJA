import React, { useState, useEffect, useRef } from "react";
import { CoparentingData, ParentId, Message } from "../types";
import { 
  ShieldCheck, 
  Send, 
  Info, 
  Eye, 
  EyeOff, 
  Lock, 
  MessageSquare,
  LockKeyhole,
  Paperclip,
  Mic,
  MicOff,
  Trash2,
  Play,
  Pause,
  X,
  FileText,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  Volume2
} from "lucide-react";

// Robust Buffer to WAV binary format converter for browser Web Audio API recorded tones
function bufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // Write WAV header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"
  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // chunk length
  setUint16(1); // sample format (raw PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  setUint32(0x61746164); // "data" chunk
  setUint32(length - pos - 4);

  // Write sample data
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset])); // clamp
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF; // scale to 16-bit signed integer
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}

// Gorgeous Custom audio player rendering to match application slate aesthetics
export function CustomAudioPlayer({ src, duration }: { src: string; duration?: number }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (!duration && audio.duration && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
      }
    };
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src, duration]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(err => console.log("Audio playback error:", err));
    }
    setIsPlaying(!isPlaying);
  };

  const formatSecs = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-250/50 dark:border-slate-800 rounded-xl p-2.5 w-full max-w-sm shrink-0 shadow-sm">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button
        type="button"
        onClick={togglePlay}
        className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shrink-0 transition"
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1 rounded-full overflow-hidden mb-1">
          <div 
            className="bg-indigo-600 h-full transition-all duration-100" 
            style={{ width: `${totalDuration ? (currentTime / totalDuration) * 100 : 0}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span>{formatSecs(currentTime)}</span>
          <span>{formatSecs(totalDuration || 3)}</span>
        </div>
      </div>
    </div>
  );
}

interface MessagingPanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onSendMessage: (
    text: string, 
    attachmentName?: string, 
    attachmentData?: string, 
    voiceNoteData?: string, 
    voiceNoteDuration?: number
  ) => void;
  textSizeClass: string;
}

export default function MessagingPanel({
  data,
  activeParentId,
  onSendMessage,
  textSizeClass
}: MessagingPanelProps) {
  const activeParent = activeParentId === "parent_a" ? data.parentA : data.parentB;
  const otherParent = activeParentId === "parent_a" ? data.parentB : data.parentA;

  const [newMessage, setNewMessage] = useState("");
  const [showEncryptedMode, setShowEncryptedMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load message draft from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("coparenting_draft_message");
    if (saved) {
      setNewMessage(saved);
    }
  }, []);

  // Save message draft to localStorage on change
  useEffect(() => {
    if (newMessage) {
      localStorage.setItem("coparenting_draft_message", newMessage);
    } else {
      localStorage.removeItem("coparenting_draft_message");
    }
  }, [newMessage]);

  // Attachment States
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentData, setAttachmentData] = useState("");

  // Voice recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [tempVoiceNoteBase64, setTempVoiceNoteBase64] = useState<string | null>(null);
  const [voicePlaybackUrl, setVoicePlaybackUrl] = useState<string | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [data.messages]);

  // Voice recording timer hook
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachmentData && !tempVoiceNoteBase64) return;
    
    onSendMessage(
      newMessage, 
      attachmentName || undefined, 
      attachmentData || undefined, 
      tempVoiceNoteBase64 || undefined, 
      tempVoiceNoteBase64 ? recordingSeconds || 3 : undefined
    );

    setNewMessage("");
    setAttachmentName("");
    setAttachmentData("");
    setTempVoiceNoteBase64(null);
    setVoicePlaybackUrl(null);
    localStorage.removeItem("coparenting_draft_message");
  };

  const handleSendTemplate = (text: string) => {
    onSendMessage(text);
  };

  // Safe file reader & image downscaler to avoid payload too large errors
  const processFile = (file: File, callback: (name: string, data: string) => void) => {
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        const MAX_DIM = 1000;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.75);
          const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          callback(compressedName, compressedBase64);
        } else {
          fallbackReader(file, callback);
        }
      };

      img.onerror = () => {
        fallbackReader(file, callback);
      };

      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      fallbackReader(file, callback);
    }
  };

  const fallbackReader = (file: File, callback: (name: string, data: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      callback(file.name, e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Real voice capture start handler
  const startRecording = async () => {
    setRecordingError(null);
    setRecordingSeconds(0);
    setTempVoiceNoteBase64(null);
    setVoicePlaybackUrl(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("La API de grabación de audio no está disponible o permitida en este iframe/navegador.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          setTempVoiceNoteBase64(reader.result as string);
          setVoicePlaybackUrl(URL.createObjectURL(audioBlob));
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.warn("Error de grabación de audio:", err);
      setRecordingError("La políticas de seguridad del iframe o falta de permisos bloquearon la captura física. No te preocupes, puedes usar el botón 'Simular' de abajo para probar de inmediato.");
    }
  };

  // Real voice capture stop handler
  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  // Safe developer simulator for audio tones so the feature is 100% auditable
  const simulateVoiceRecording = () => {
    setRecordingError(null);
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioCtx.sampleRate;
      const durationSecs = 3;
      const numSamples = sampleRate * durationSecs;
      const buffer = audioCtx.createBuffer(1, numSamples, sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        // Periodic friendly beep pulse that represents daughter health update
        const volume = (Math.sin(2 * Math.PI * 2 * t) > 0) ? 0.25 : 0;
        data[i] = Math.sin(2 * Math.PI * 550 * t) * volume;
      }

      const wavBlob = bufferToWav(buffer);
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempVoiceNoteBase64(reader.result as string);
        setVoicePlaybackUrl(URL.createObjectURL(wavBlob));
        setRecordingSeconds(3);
      };
      reader.readAsDataURL(wavBlob);
    } catch (err) {
      // Direct base64 static fail-safe silent wave
      const silentWav = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==";
      setTempVoiceNoteBase64(silentWav);
      setVoicePlaybackUrl(silentWav);
      setRecordingSeconds(2);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString("es-CO", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const templates = [
    "Mañana paso a recoger a nuestra hija según lo estipulado en el calendario.",
    "Por favor, recuerda empacar la merienda y medicamentos favoritos de Mía.",
    "He registrado un nuevo gasto extraordinario, por favor verifícalo y acéptalo.",
    "El reporte de cuotas alimentarias mensual ya se encuentra disponible para firma."
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-190px)] min-h-[500px] ${textSizeClass}`}>
      
      {/* Columna Izquierda: Configuraciones E2EE & Plantillas de Asistencia Rápida */}
      <div className="lg:col-span-1 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/10 flex flex-col justify-between space-y-4">
        <div className="space-y-4">
          <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30 space-y-2">
            <h4 className="font-bold text-xs text-indigo-700 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <LockKeyhole className="w-4 h-4 text-indigo-500" />
              Cifrado Extremo a Extremo
            </h4>
            <p className="text-[11px] text-slate-550 dark:text-slate-400 leading-relaxed">
              Todos los mensajes enviados se encriptan con claves privadas antes de salir de su navegador. Sólo tú y {otherParent.name} poseen el secreto para desencriptarlos.
            </p>

            <button
              onClick={() => setShowEncryptedMode(!showEncryptedMode)}
              className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {showEncryptedMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  Ocultar Cadena Cifrada
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  Inspeccionar Datos Encriptados
                </>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <h4 className="font-bold text-[10px] uppercase text-slate-400 dark:text-slate-500 tracking-wider">
              Plantillas de Comunicación Formal
            </h4>
            <p className="text-[11px] text-slate-500">Asistencia ágil para evitar discordias parentales:</p>
            <div className="space-y-1.5 scrollbar-thin max-h-[180px] overflow-y-auto pr-1">
              {templates.map((tpl, i) => (
                <button
                  key={i}
                  className="w-full text-left text-[11px] p-2 bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 rounded-lg text-slate-700 dark:text-slate-300 transition"
                  onClick={() => handleSendTemplate(tpl)}
                >
                  {tpl}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 rounded-xl border border-emerald-100 dark:border-emerald-950/40 text-[10px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
          <span>Este chat sirve de soporte legal y conciliatorio para dirimir controversias ante defensores familiares.</span>
        </div>
      </div>

      {/* Caja de Chat Central */}
      <div className="lg:col-span-3 bg-white dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-sm">
        {/* Cabecera Chat */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold text-sm">
              {otherParent.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-150">{otherParent.name}</h3>
              <span className="text-[10px] text-slate-500 dark:text-slate-405 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-555 animate-pulse"></span>
                Canal Bilateral Activo
              </span>
            </div>
          </div>

          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Cifrado Militar Habilitado
          </span>
        </div>

        {/* Mensajes */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/10">
          {data.messages.length > 0 ? (
            data.messages.map((msg) => {
              const isMe = msg.senderId === activeParentId;
              const sender = isMe ? activeParent : otherParent;

              return (
                <div key={msg.id} className={`flex gap-3 max-w-xl ${isMe ? "ml-auto flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                    isMe 
                      ? "bg-indigo-650 text-white" 
                      : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                  }`}>
                    {sender.name.charAt(0)}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-400 font-semibold block px-1">
                      {sender.name}
                    </span>
                    <div className={`p-3 rounded-2xl text-xs space-y-2 text-left ${
                      isMe 
                        ? "bg-indigo-600 text-white rounded-tr-none" 
                        : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none"
                    }`}>
                      {msg.text && <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                      
                      {msg.attachmentData && (
                        msg.attachmentData.startsWith("data:image/") ? (
                          <div className="mt-2 rounded-xl overflow-hidden border border-slate-250/20 dark:border-slate-700/50 max-w-[240px]">
                            <img 
                              src={msg.attachmentData} 
                              alt={msg.attachmentName || "Imagen de Mía"} 
                              className="w-full object-cover max-h-[160px] hover:scale-105 transition cursor-pointer" 
                              onClick={() => {
                                const nw = window.open();
                                if (nw) {
                                  nw.document.write(`<img src="${msg.attachmentData}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                }
                              }} 
                              referrerPolicy="no-referrer" 
                            />
                            <span className="text-[9px] text-slate-550 dark:text-slate-400 block p-1.5 bg-slate-50/50 dark:bg-slate-900/60 truncate font-mono">
                              📎 {msg.attachmentName || "estado_mia.jpg"}
                            </span>
                          </div>
                        ) : (
                          <div className="mt-2 flex items-center gap-2 p-2 rounded-xl bg-slate-55/60 dark:bg-slate-900/60 border border-slate-250/20 text-xs text-slate-800 dark:text-slate-200 max-w-[240px] shadow-sm">
                            <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold truncate leading-tight">{msg.attachmentName || "Soporte"}</p>
                              <a 
                                href={msg.attachmentData} 
                                download={msg.attachmentName || "documento.pdf"} 
                                className="text-[9px] text-indigo-600 dark:text-indigo-400 underline font-extrabold hover:text-indigo-700 block mt-0.5"
                              >
                                Descargar Adjunto
                              </a>
                            </div>
                          </div>
                        )
                      )}

                      {msg.voiceNoteData && (
                        <div className="mt-2 text-slate-800 dark:text-slate-200">
                          <CustomAudioPlayer src={msg.voiceNoteData} duration={msg.voiceNoteDuration} />
                        </div>
                      )}
                      
                      {showEncryptedMode && (
                        <div className={`p-2 rounded font-mono text-[9px] break-all border ${
                          isMe 
                            ? "bg-indigo-750/70 text-indigo-200 border-indigo-700" 
                            : "bg-slate-200/50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 border-slate-250 dark:border-slate-800"
                        }`}>
                          <Lock className="w-3 h-3 inline mr-1 mb-0.5" />
                          CIPHERTEXT (HEX): {msg.encryptedText || "Encrypted_Payload_Missing"}
                        </div>
                      )}
                    </div>
                    <span className={`text-[9px] text-slate-400 block px-1 ${isMe ? "text-right" : ""}`}>
                      {formatTime(msg.timestamp)} {isMe ? "• Enviado" : ""}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700/80 mb-2" />
              <p className="text-sm">Inicia la conversación segura. Los diálogos constructivos son en bien del infante.</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Error de Grabación de Audio con Opción de Simulación */}
        {recordingError && (
          <div className="mx-4 mb-2 p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-950/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 text-rose-600 dark:text-rose-400 text-xs text-left">
            <div className="flex items-start gap-1.5 leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{recordingError}</span>
            </div>
            <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
              <button
                type="button"
                onClick={simulateVoiceRecording}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition whitespace-nowrap uppercase tracking-wider"
              >
                Simular Nota de Voz
              </button>
              <button
                type="button"
                onClick={() => setRecordingError(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Previews de adjuntos o notas de voz listas en cola */}
        {(attachmentData || tempVoiceNoteBase64) && (
          <div className="mx-4 my-2 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-wrap gap-3">
            {attachmentData && (
              <div className="relative p-2 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-150/50 dark:border-indigo-900/40 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 animate-in slide-in-from-bottom-2 duration-150 max-w-sm">
                {attachmentData.startsWith("data:image/") ? (
                  <img src={attachmentData} className="w-9 h-9 object-cover rounded-lg border dark:border-slate-800 shrink-0" alt="Vista previa de soporte físico" referrerPolicy="no-referrer" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
                )}
                <div className="min-w-0 pr-6 text-left">
                  <p className="text-[9px] text-indigo-700 dark:text-indigo-455 font-bold uppercase tracking-wider">Estado físico/Soporte</p>
                  <p className="text-[11px] font-semibold truncate max-w-[150px] text-slate-800 dark:text-slate-200">{attachmentName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentName("");
                    setAttachmentData("");
                  }}
                  className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {tempVoiceNoteBase64 && (
              <div className="relative p-2 bg-rose-50/40 dark:bg-rose-955/10 rounded-xl border border-rose-150/50 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 animate-in slide-in-from-bottom-2 duration-150 max-w-sm">
                <Volume2 className="w-5 h-5 text-rose-500 shrink-0 animate-bounce" />
                <div className="min-w-0 pr-6 text-left">
                  <p className="text-[9px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Nota de Voz Lista</p>
                  <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">Duración: {recordingSeconds || 3}s</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempVoiceNoteBase64(null);
                    setVoicePlaybackUrl(null);
                    setRecordingSeconds(0);
                  }}
                  className="absolute top-1.5 right-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-240 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Formulario / Input con Controles de Grabación y Carga */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <input
            type="file"
            id="chat-file-uploader"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                processFile(e.target.files[0], (name, data) => {
                  setAttachmentName(name);
                  setAttachmentData(data);
                });
              }
            }}
          />

          {isRecording ? (
            <div className="flex items-center justify-between p-3 bg-rose-50/40 dark:bg-rose-955/10 border border-rose-150 dark:border-rose-900/30 rounded-xl animate-pulse">
              <div className="flex items-center gap-2.5 text-xs font-bold text-rose-600 dark:text-rose-455">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
                GRABANDO NOTA DE VOZ: {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60) < 10 ? "0" : ""}{recordingSeconds % 60}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (mediaRecorder) {
                      mediaRecorder.stop();
                    }
                    setIsRecording(false);
                    setTempVoiceNoteBase64(null);
                    setVoicePlaybackUrl(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <MicOff className="w-4 h-4" /> Finalizar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2">
              {/* Botón Adjuntar Foto/Doc */}
              <button
                type="button"
                onClick={() => document.getElementById("chat-file-uploader")?.click()}
                className='p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl flex items-center justify-center transition shrink-0'
                title="Adjuntar Imagen o PDF de soporte físico"
              >
                <Paperclip className="w-4.5 h-4.5" />
              </button>

              {/* Botón Iniciar Nota de Voz */}
              <button
                type="button"
                onClick={startRecording}
                className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-xl flex items-center justify-center transition shrink-0"
                title="Grabar Nota de Voz legal"
              >
                <Mic className="w-4.5 h-4.5" />
              </button>

              {/* Input Caja de Texto */}
              <input
                type="text"
                placeholder="Mensaje o descripción del soporte de entrega..."
                value={newMessage}
                aria-label="Caja de mensajería parental"
                onChange={(e) => setNewMessage(e.target.value)}
                className="flex-1 text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {/* Botón Enviar */}
              <button
                type="submit"
                aria-label="Enviar mensaje encriptado"
                className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-550 dark:hover:bg-indigo-650 text-white rounded-xl flex items-center justify-center shadow-md transition shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
}
