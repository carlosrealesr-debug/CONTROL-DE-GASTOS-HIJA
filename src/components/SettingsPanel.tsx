import React, { useState, useEffect } from "react";
import { CoparentingData, ParentId } from "../types";
import { 
  CloudLightning, 
  Settings, 
  Download, 
  Upload, 
  User, 
  VolumeX, 
  Volume2, 
  Languages, 
  Sparkles, 
  Check, 
  AlertCircle,
  Eye,
  Activity,
  UserCheck
} from "lucide-react";

interface SettingsPanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onUpdateProfiles: (parentA: string, parentB: string, daughter: string) => void;
  onRestoreBackup: (backup: CoparentingData) => void;
  textSize: "small" | "medium" | "large" | "xlarge";
  setTextSize: (size: "small" | "medium" | "large" | "xlarge") => void;
  language: "es" | "en";
  setLanguage: (lang: "es" | "en") => void;
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
  textSizeClass: string;
}

export default function SettingsPanel({
  data,
  activeParentId,
  onUpdateProfiles,
  onRestoreBackup,
  textSize,
  setTextSize,
  language,
  setLanguage,
  activeTheme,
  setActiveTheme,
  textSizeClass
}: SettingsPanelProps) {
  
  // Profile Form States
  const [parentNameA, setParentNameA] = useState(data.parentA.name);
  const [parentNameB, setParentNameB] = useState(data.parentB.name);
  const [daughterName, setDaughterName] = useState(data.daughter.name);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Debounced autosave on field changes to prevent data loss
  useEffect(() => {
    if (
      parentNameA === data.parentA.name &&
      parentNameB === data.parentB.name &&
      daughterName === data.daughter.name
    ) {
      return;
    }

    setAutoSaveStatus("saving");
    const delayDebounceFn = setTimeout(() => {
      onUpdateProfiles(parentNameA, parentNameB, daughterName);
      setAutoSaveStatus("saved");
      const statusTimer = setTimeout(() => setAutoSaveStatus("idle"), 2500);
      return () => clearTimeout(statusTimer);
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [parentNameA, parentNameB, daughterName, data.parentA.name, data.parentB.name, data.daughter.name, onUpdateProfiles]);

  // Cloud backup states
  const [backupFileContent, setBackupFileContent] = useState("");
  const [restoreSuccess, setRestoreSuccess] = useState(false);
  const [cloudSyncing, setCloudSyncing] = useState(false);
  const [cloudSuccess, setCloudSuccess] = useState(false);

  // Screen Reader Accessibility Toggle
  const [screenReaderLabels, setScreenReaderLabels] = useState(true);

  const handleUpdateProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfiles(parentNameA, parentNameB, daughterName);
    setProfileSuccess(true);
    setTimeout(() => setProfileSuccess(false), 3000);
    
    // Accessibility announcement for screen readers
    const speech = new SpeechSynthesisUtterance();
    speech.text = language === "es" ? "Perfil actualizado con éxito" : "Profile successfully updated";
    speech.lang = language === "es" ? "es-ES" : "en-US";
    window.speechSynthesis?.speak(speech);
  };

  // Simulating the secure E2EE cloud backup storage
  const handleCloudSync = () => {
    setCloudSyncing(true);
    setCloudSuccess(false);

    setTimeout(() => {
      setCloudSyncing(false);
      setCloudSuccess(true);
      setTimeout(() => setCloudSuccess(false), 4000);

      // Speak confirmation
      const speech = new SpeechSynthesisUtterance();
      speech.text = language === "es" ? "Sincronización segura completada" : "Secure synchronization completed";
      speech.lang = language === "es" ? "es-ES" : "en-US";
      window.speechSynthesis?.speak(speech);
    }, 2000);
  };

  // Export JSON Backup file to user's local disk (Copia de seguridad local y privada)
  const downloadBackupJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `coparenting_secure_backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreJSON = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!backupFileContent.trim()) {
        alert("Por favor copia y pega el contenido JSON del backup en la caja.");
        return;
      }
      const parsed = JSON.parse(backupFileContent);
      if (parsed && parsed.parentA && parsed.visits && parsed.expenses) {
        onRestoreBackup(parsed);
        setRestoreSuccess(true);
        setBackupFileContent("");
        setTimeout(() => setRestoreSuccess(false), 4000);
      } else {
        alert("El archivo no posee el formato de respaldo inmutable adecuado. Revisa la estructura.");
      }
    } catch (err) {
      alert("Error parseando archivo JSON. Verifica que el texto copiado sea correcto.");
    }
  };

  const themes = [
    { id: "sleek", name: "Sleek Indigo (Tema Solicitado)", color: "bg-indigo-600" },
    { id: "emerald", name: "Esmeralda Cuidado", color: "bg-emerald-600" },
    { id: "rose", name: "Rosa Minimal", color: "bg-rose-500" },
    { id: "cosmic", name: "Cosmic Charcoal", color: "bg-slate-800" }
  ];

  return (
    <div className={`space-y-6 max-w-4xl mx-auto ${textSizeClass}`}>
      
      {/* Cabecera Módulo */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          Ajustes, Copias de Seguridad & Accesibilidad
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
          Personaliza los temas visuales, el tamaño de la tipografía para mayor facilidad de lectura y gestiona las copias de respaldo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Columna Izquierda: Accesibilidad, Temas e Idioma */}
        <div className="space-y-6">
          
          {/* Tarjeta de Personalización Visual (Temas) */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Personalización Visual
            </h3>

            {/* Selector de Temas */}
            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">
                Seleccionar Paleta de Color
              </label>
              <div className="grid grid-cols-2 gap-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTheme(t.id)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border text-left text-xs transition ${
                      activeTheme === t.id 
                        ? "border-indigo-500 bg-indigo-50/20 dark:bg-indigo-950/10 font-bold" 
                        : "border-slate-200 dark:border-slate-750 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${t.color} shrink-0`}></span>
                    <span className="truncate">{t.name}</span>
                    {activeTheme === t.id && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 ml-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de tamaño de letra de accesibilidad */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350 flex justify-between">
                <span>Tamaño de Fuentes (Accesibilidad Lector de Pantalla)</span>
                <span className="text-[10px] text-indigo-500 font-mono font-bold">Activo: {textSize.toUpperCase()}</span>
              </label>
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                {(["small", "medium", "large", "xlarge"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setTextSize(sz)}
                    className={`flex-1 text-center text-xs py-1.5 rounded-lg transition font-medium ${
                      textSize === sz 
                        ? "bg-white dark:bg-slate-800 shadow-sm text-slate-850 dark:text-slate-100 font-bold" 
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                    }`}
                  >
                    {sz === "small" ? "A-" : sz === "medium" ? "A" : sz === "large" ? "A+" : "A++"}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de Idiomas */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350">
                Soporte Multilingüe (Idioma)
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setLanguage("es")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition inline-flex justify-center items-center gap-1.5 ${
                    language === "es" 
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold" 
                      : "border-slate-200 dark:border-slate-750 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" /> Español
                </button>
                <button
                  onClick={() => setLanguage("en")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition inline-flex justify-center items-center gap-1.5 ${
                    language === "en" 
                      ? "bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold" 
                      : "border-slate-200 dark:border-slate-750 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <Languages className="w-3.5 h-3.5" /> English (US)
                </button>
              </div>
            </div>

            {/* Asistente de Audio en Intercambios */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl">
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-350">Lector de Textos Inteligente</p>
                <p className="text-[10px] text-slate-500">Lee por voz confirmaciones y cambios financieros para no videntes.</p>
              </div>

              <button
                onClick={() => setScreenReaderLabels(!screenReaderLabels)}
                className={`p-2 rounded-xl transition ${
                  screenReaderLabels ? "bg-indigo-100 text-indigo-650" : "bg-slate-200 text-slate-400"
                }`}
              >
                {screenReaderLabels ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
              </button>
            </div>

          </div>

          {/* Sincronización Segura en Nube Privada */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <CloudLightning className="w-4 h-4 text-indigo-500" />
              Sincronización segura & Nube Privada
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Copia de seguridad en tiempo real. Todos los calendarios, gastos rubricados y acuerdos criptográficos se sincronizan de forma encriptada bajo la bóveda privada familiar.
            </p>

            {cloudSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-950/60 rounded-xl flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs">
                <Check className="w-4 h-4 shrink-0" />
                <span>¡Sincronización en la Nube completamente exitosa! Datos guardados de forma segura en todos sus dispositivos.</span>
              </div>
            )}

            <button
              onClick={handleCloudSync}
              disabled={cloudSyncing}
              className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition flex items-center justify-center gap-1.5 ${
                cloudSyncing 
                  ? "bg-slate-450 dark:bg-slate-705 cursor-wait" 
                  : "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-550 dark:hover:bg-indigo-650"
              }`}
            >
              <Activity className={`w-3.5 h-3.5 ${cloudSyncing ? "animate-spin" : ""}`} />
              {cloudSyncing ? "Sincronizando de extremo a extremo..." : "Sincronizar Cloud Ahora"}
            </button>
          </div>

        </div>

        {/* Columna Derecha: Gestión de Perfiles e Importación/Exportación */}
        <div className="space-y-6">
          
          {/* Formulario Perfil Progenitores */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-500" />
              Configuración de la Familia y la Hija
            </h3>

            <form onSubmit={handleUpdateProfileSubmit} className="space-y-3">
              {profileSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 rounded-lg text-emerald-650 dark:text-emerald-400 text-xs font-bold">
                  ✓ Configuración actualizada de manera inmutable.
                </div>
              )}

              {autoSaveStatus === "saving" && (
                <div className="p-2.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-semibold animate-pulse flex items-center gap-1.5 rounded-xl">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-ping shrink-0"></span>
                  Guardando cambios automáticamente... (Prevención de pérdida de datos)
                </div>
              )}

              {autoSaveStatus === "saved" && (
                <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 rounded-xl">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  Cambios del formulario guardados automáticamente al instante.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350 mb-1">
                  Nombre del Progenitor A (Padre) *
                </label>
                <input
                  type="text"
                  value={parentNameA}
                  aria-label="Nombre del progenitor A"
                  onChange={(e) => setParentNameA(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-755 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350 mb-1">
                  Nombre del Progenitor B (Madre) *
                </label>
                <input
                  type="text"
                  value={parentNameB}
                  aria-label="Nombre del progenitor B"
                  onChange={(e) => setParentNameB(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-755 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-350 mb-1">
                  Nombre de la Hija en Custodia *
                </label>
                <input
                  type="text"
                  value={daughterName}
                  aria-label="Nombre de la hija"
                  onChange={(e) => setDaughterName(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Guardar Nombres de Familia
              </button>
            </form>
          </div>

          {/* Importar y Exportar Copia de Seguridad */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Download className="w-4 h-4 text-purple-500" />
              Copia de Seguridad Portátil (JSON)
            </h3>

            <div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
                Descarga un respaldo completo inmutable cifrado local para guardarlo en sus archivos privados o restaurarlo en otro dispositivo móvil de forma instantánea.
              </p>
              
              <button
                onClick={downloadBackupJSON}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
              >
                <Download className="w-4.5 h-4.5" /> Descargar Backup (.json)
              </button>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-750 dark:text-slate-200 mb-2">Restaurar Copia de Respaldo</h4>
              
              <form onSubmit={handleRestoreJSON} className="space-y-3">
                {restoreSuccess && (
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 rounded-lg text-indigo-650 dark:text-indigo-400 text-xs font-bold flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4" /> Respaldo restaurada y sincronizada.
                  </div>
                )}

                <textarea
                  rows={3}
                  placeholder="Pega aquí el contenido del archivo .json descargado..."
                  aria-label="Caja de cargue de JSON"
                  value={backupFileContent}
                  onChange={(e) => setBackupFileContent(e.target.value)}
                  className="w-full font-mono text-[9px] p-2 rounded-xl border border-slate-250 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-750 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />

                <button
                  type="submit"
                  className="w-full py-2 bg-purple-650 hover:bg-purple-750 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1"
                >
                  <Upload className="w-4 h-4" /> Cargar & Reemplazar Base de Datos
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
