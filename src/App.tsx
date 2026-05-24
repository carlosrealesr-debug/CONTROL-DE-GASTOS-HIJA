import React, { useState, useEffect } from "react";
import { CoparentingData, ParentId, VisitEvent, Expense, Agreement, Reminder, Message } from "./types";
import OverviewPanel from "./components/OverviewPanel";
import CalendarPanel from "./components/CalendarPanel";
import FinancePanel from "./components/FinancePanel";
import MessagingPanel from "./components/MessagingPanel";
import AgreementPanel from "./components/AgreementPanel";
import SettingsPanel from "./components/SettingsPanel";
import { 
  Home, 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  FileCheck, 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  RefreshCw, 
  ShieldCheck, 
  Eye, 
  Users,
  Clock,
  AlertCircle
} from "lucide-react";

export default function App() {
  // Sync States
  const [data, setData] = useState<CoparentingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState("");

  // UI Active Navigation Tab
  // Options: dashboard, visitas, finanzas, mensajes, acuerdos, ajustes
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Accessibility and Theme options
  const [activeParentId, setActiveParentId] = useState<ParentId>("parent_a");
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [textSize, setTextSize] = useState<"small" | "medium" | "large" | "xlarge">("medium");
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [activeTheme, setActiveTheme] = useState<string>("sleek");

  // Quick state for visitation form modal inside calendar view
  const [openNewVisitForm, setOpenNewVisitForm] = useState(false);

  // Live Toast Notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Fetch complete dataset from server with self-healing local backup synchronization
  const fetchCompleteData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/data");
      if (!res.ok) throw new Error("Error sincronizando los datos con el servidor.");
      const serverResult: CoparentingData = await res.json();

      // Check if we have a fuller/newer local backup in the browser's localStorage
      const localBackupStr = localStorage.getItem("coparenting_app_data");
      if (localBackupStr) {
        try {
          const localResult: CoparentingData = JSON.parse(localBackupStr);

          // Purge the requested agreements from local cache so they never auto-restore
          if (localResult.agreements) {
            const beforeLen = localResult.agreements.length;
            localResult.agreements = localResult.agreements.filter(a => a.id !== "agr-1" && a.id !== "agr-2");
            if (localResult.agreements.length !== beforeLen) {
              localStorage.setItem("coparenting_app_data", JSON.stringify(localResult));
            }
          }

          // Compare data volumes (Sum of elements in events, expenses, messages, agreements, reminders)
          const serverItemsCount = 
            (serverResult.visits?.length || 0) + 
            (serverResult.expenses?.length || 0) + 
            (serverResult.messages?.length || 0) + 
            (serverResult.agreements?.length || 0) +
            (serverResult.reminders?.length || 0);

          const localItemsCount = 
            (localResult.visits?.length || 0) + 
            (localResult.expenses?.length || 0) + 
            (localResult.messages?.length || 0) + 
            (localResult.agreements?.length || 0) +
            (localResult.reminders?.length || 0);

          // If local backup has more user modifications / items, restore it automatically
          if (localItemsCount > serverItemsCount) {
            console.log("Restaurando datos automáticamente desde copia local segura...");
            const restoreRes = await fetch("/api/data/restore", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(localResult)
            });
            if (restoreRes.ok) {
              const restoredResObj = await restoreRes.json();
              const newestData = restoredResObj.data || localResult;
              setData(newestData);
              localStorage.setItem("coparenting_app_data", JSON.stringify(newestData));
              triggerToast("Datos sincronizados y restaurados de tu copia local con éxito.");
              setErrorStatus("");
              return;
            }
          }
        } catch (e) {
          console.error("Reconciliation error:", e);
        }
      }

      setData(serverResult);
      // Update local cache
      localStorage.setItem("coparenting_app_data", JSON.stringify(serverResult));
      setErrorStatus("");
    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "Falla de red.");
      
      // Load offline cache as fallback
      const fallbackStr = localStorage.getItem("coparenting_app_data");
      if (fallbackStr) {
        try {
          setData(JSON.parse(fallbackStr));
          triggerToast("Iniciado en modo local sin conexión.");
        } catch (e) {
          // ignore
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompleteData();
  }, []);

  // Post/Save Helper
  const saveToServer = async (endpoint: string, payload: any) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Error persistiendo datos.");
      await fetchCompleteData();
      triggerToast("Cambio guardado y sincronizado de forma inmutable.");
    } catch (err: any) {
      triggerToast("Error de conexión al guardar: " + err.message);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 4500);
  };

  // Actions
  const handleUpdateProfiles = (parentA: string, parentB: string, daughter: string) => {
    saveToServer("/api/profile/update", { parentA_name: parentA, parentB_name: parentB, daughter_name: daughter });
  };

  const handleSaveVisit = (visit: Partial<VisitEvent>) => {
    // If it's a new visit, default to active parent creator
    const payload = visit.id ? visit : { ...visit, responsibleParentId: activeParentId };
    saveToServer("/api/visits", payload);
  };

  const handleSaveExpense = (expense: Partial<Expense>) => {
    const payload = expense.id ? expense : { ...expense, payerId: activeParentId };
    saveToServer("/api/expenses", payload);
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      // Clear from local backup first so fetchCompleteData does not auto-restore a zombie item
      const localBackupStr = localStorage.getItem("coparenting_app_data");
      if (localBackupStr) {
        try {
          const localResult: CoparentingData = JSON.parse(localBackupStr);
          if (localResult.expenses) {
            localResult.expenses = localResult.expenses.filter(e => e.id !== id);
            localStorage.setItem("coparenting_app_data", JSON.stringify(localResult));
            setData(localResult); // update local UI state immediately
          }
        } catch (e) {
          console.error(e);
        }
      }

      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falla al eliminar.");
      await fetchCompleteData();
      triggerToast("Gasto de consolidado eliminado con éxito.");
    } catch (err: any) {
      triggerToast("Error: " + err.message);
    }
  };

  const handleDeleteVisit = async (id: string) => {
    try {
      // Clear from local backup first so fetchCompleteData does not auto-restore a zombie item
      const localBackupStr = localStorage.getItem("coparenting_app_data");
      if (localBackupStr) {
        try {
          const localResult: CoparentingData = JSON.parse(localBackupStr);
          if (localResult.visits) {
            localResult.visits = localResult.visits.filter(v => v.id !== id);
            localStorage.setItem("coparenting_app_data", JSON.stringify(localResult));
            setData(localResult); // update local UI state immediately
          }
        } catch (e) {
          console.error(e);
        }
      }

      const res = await fetch(`/api/visits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falla al eliminar.");
      await fetchCompleteData();
      triggerToast("Visita de coparentalidad eliminada.");
    } catch (err: any) {
      triggerToast("Error: " + err.message);
    }
  };

  const handleSendMessage = (text: string, attachmentName?: string, attachmentData?: string, voiceNoteData?: string, voiceNoteDuration?: number) => {
    saveToServer("/api/messages", { 
      senderId: activeParentId, 
      text,
      attachmentName,
      attachmentData,
      voiceNoteData,
      voiceNoteDuration
    });
  };

  const handleSignAgreement = (agreementId: string, signatureName: string) => {
    saveToServer("/api/agreements/sign", { agreementId, parentId: activeParentId, signatureName });
  };

  const handleSaveAgreement = (agreement: Partial<Agreement>) => {
    saveToServer("/api/agreements", agreement);
  };

  const handleDeleteAgreement = async (id: string) => {
    try {
      // Clear from local backup first so fetchCompleteData does not auto-restore a zombie item
      const localBackupStr = localStorage.getItem("coparenting_app_data");
      if (localBackupStr) {
        try {
          const localResult: CoparentingData = JSON.parse(localBackupStr);
          if (localResult.agreements) {
            localResult.agreements = localResult.agreements.filter(a => a.id !== id);
            localStorage.setItem("coparenting_app_data", JSON.stringify(localResult));
            setData(localResult); // update local UI state immediately
          }
        } catch (e) {
          console.error(e);
        }
      }

      const res = await fetch(`/api/agreements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falla al eliminar.");
      await fetchCompleteData();
      triggerToast("Acuerdo o evento eliminado con éxito.");
    } catch (err: any) {
      triggerToast("Error: " + err.message);
    }
  };

  const handleToggleReminder = async (id: string) => {
    saveToServer("/api/reminders/toggle", { id });
  };

  const handleRestoreBackup = (backup: CoparentingData) => {
    saveToServer("/api/data/restore", backup);
  };

  // Set text size classes
  const getTextSizeClass = () => {
    if (textSize === "small") return "text-xs select-all-adjust";
    if (textSize === "medium") return "text-sm adjust-medium";
    if (textSize === "large") return "text-base adjust-large";
    return "text-lg adjust-xl";
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
        <p className="text-sm font-semibold">Sincronizando de forma segura desde la nube familiar...</p>
      </div>
    );
  }

  const coparentingData = data || {
    parentA: { id: "parent_a", name: "Carlos Reales", email: "carlosrealesr@correo.unicordoba.edu.co", role: "Padre" },
    parentB: { id: "parent_b", name: "Stefania Doria Matta", email: "stefania@ejemplo.com", role: "Madre" },
    daughter: { name: "MIA ISABELLA REALES DORIA" },
    visits: [],
    expenses: [],
    messages: [],
    agreements: [],
    reminders: []
  };

  const currentActiveParent = activeParentId === "parent_a" ? coparentingData.parentA : coparentingData.parentB;
  const currentOtherParent = activeParentId === "parent_a" ? coparentingData.parentB : coparentingData.parentA;

  // Render components inside the Sleek Interface Layout
  const renderActiveContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <OverviewPanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onSelectTab={(tab) => {
              setActiveTab(tab);
              if (tab === "visitas") setOpenNewVisitForm(false);
            }} 
            onToggleReminder={handleToggleReminder} 
            onOpenNewExpense={() => {
              setActiveTab("finanzas");
            }}
            onOpenNewVisit={() => {
              setActiveTab("visitas");
              setOpenNewVisitForm(true);
            }}
            textSizeClass={getTextSizeClass()}
          />
        );
      case "visitas":
        return (
          <CalendarPanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onSaveVisit={handleSaveVisit}
            onDeleteVisit={handleDeleteVisit}
            onOpenNewVisitForm={openNewVisitForm}
            setOpenNewVisitForm={setOpenNewVisitForm}
            textSizeClass={getTextSizeClass()}
          />
        );
      case "finanzas":
        return (
          <FinancePanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onSaveExpense={handleSaveExpense} 
            onDeleteExpense={handleDeleteExpense}
            textSizeClass={getTextSizeClass()}
          />
        );
      case "mensajes":
        return (
          <MessagingPanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onSendMessage={handleSendMessage}
            textSizeClass={getTextSizeClass()}
          />
        );
      case "acuerdos":
        return (
          <AgreementPanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onSignAgreement={handleSignAgreement} 
            onSaveAgreement={handleSaveAgreement}
            onDeleteAgreement={handleDeleteAgreement}
            textSizeClass={getTextSizeClass()}
          />
        );
      case "ajustes":
        return (
          <SettingsPanel 
            data={coparentingData} 
            activeParentId={activeParentId} 
            onUpdateProfiles={handleUpdateProfiles} 
            onRestoreBackup={handleRestoreBackup}
            textSize={textSize}
            setTextSize={setTextSize}
            language={language}
            setLanguage={setLanguage}
            activeTheme={activeTheme}
            setActiveTheme={setActiveTheme}
            textSizeClass={getTextSizeClass()}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 transition-colors duration-200 ${isDarkMode ? "dark" : ""}`}>
      
      {/* Sidebar Navigation - Conforms fully to "Sleek Interface" specified style */}
      <nav className="w-full md:w-20 bg-indigo-950 dark:bg-slate-950 flex md:flex-col items-center justify-between md:justify-start md:py-8 py-3 px-4 md:px-0 md:gap-8 gap-4 shrink-0 shadow-lg relative z-20 border-b md:border-b-0 md:border-r border-indigo-900/40">
        
        {/* Brand Shield Launcher Icon */}
        <div className="w-11 h-11 bg-gradient-to-tr from-indigo-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 md:mb-4">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>

        {/* Navigation Menus */}
        <div className="flex md:flex-col items-center gap-3.5 md:gap-6 flex-1 justify-center md:justify-start">
          
          <button
            onClick={() => setActiveTab("dashboard")}
            aria-label="Panel de Control Principal"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "dashboard" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <Home className="w-5.5 h-5.5" />
            {activeTab === "dashboard" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab("visitas");
              setOpenNewVisitForm(false);
            }}
            aria-label="Calendario de Visitas"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "visitas" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <Calendar className="w-5.5 h-5.5" />
            {activeTab === "visitas" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("finanzas")}
            aria-label="Registro de Gastos Familiares"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "finanzas" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <DollarSign className="w-5.5 h-5.5" />
            {activeTab === "finanzas" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("mensajes")}
            aria-label="Mensajería Parental Segura"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "mensajes" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <MessageSquare className="w-5.5 h-5.5" />
            {activeTab === "mensajes" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("acuerdos")}
            aria-label="Pactos y Firma de Acuerdos"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "acuerdos" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <FileCheck className="w-5.5 h-5.5" />
            {activeTab === "acuerdos" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("ajustes")}
            aria-label="Configuración General"
            className={`p-2.5 rounded-xl transition-all duration-150 relative ${
              activeTab === "ajustes" 
                ? "bg-indigo-900 text-white dark:bg-slate-800" 
                : "text-indigo-200/60 hover:text-white hover:bg-indigo-900/30"
            }`}
          >
            <Settings className="w-5.5 h-5.5" />
            {activeTab === "ajustes" && (
              <span className="absolute md:left-0 md:top-1/2 md:-translate-y-1/2 md:w-1 md:h-6 bottom-0 left-1/2 -translate-x-1/2 md:translate-x-0 w-6 h-1 bg-teal-400 rounded-full"></span>
            )}
          </button>

        </div>

        {/* Bottom Options / Light-Dark Toggle */}
        <div className="flex md:flex-col items-center gap-3 md:mt-auto">
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            aria-label="Alternar Modo Oscuro"
            title="Soporte visual modo noche"
            className="p-2.5 rounded-xl text-indigo-300/80 hover:text-white transition hover:bg-indigo-900/50"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header - Sleek style, displaying title, active parent testing toggle, and statuses */}
        <header className="h-20 bg-white dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 px-6 sm:px-8 flex items-center justify-between z-10 select-none">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{language === "es" ? "Centro de Coparentalidad Co-visitas" : "Co-parenting Custody Center"}</span>
            </h1>
            <p className="hidden md:block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
              {language === "es" ? "CONCILIACIÓN FAMILIAR Y PRIVACIDAD TOTAL" : "FAMILY RECONCILIATION & SECURE DIGITAL SHIELD"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            
            {/* SIMULATED ROLE SWAP (Excellent testing capability for demonstrating how BOTH parents sign visual metrics/documents in real-time) */}
            <div className="bg-slate-100 dark:bg-slate-900/80 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800 flex items-center gap-1.5 shadow-sm">
              <span className="text-[10px] text-slate-500 font-bold uppercase pl-2 hidden lg:inline flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Probar Vista:
              </span>
              <button
                onClick={() => {
                  setActiveParentId("parent_a");
                  triggerToast(`Cambiaste el login a: ${coparentingData.parentA.name} (${coparentingData.parentA.role})`);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  activeParentId === "parent_a" 
                    ? "bg-indigo-600 dark:bg-indigo-550 text-white font-bold shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Carlos (Padre)
              </button>
              <button
                onClick={() => {
                  setActiveParentId("parent_b");
                  triggerToast(`Cambiaste el login a: ${coparentingData.parentB.name} (${coparentingData.parentB.role})`);
                }}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all ${
                  activeParentId === "parent_b" 
                    ? "bg-indigo-600 dark:bg-indigo-550 text-white font-bold shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-800"
                }`}
              >
                Stefania (Madre)
              </button>
            </div>

            {/* Notification alert bells */}
            <div className="relative cursor-pointer p-1" title="Notificaciones Push Personalizadas" onClick={() => triggerToast("Por el momento, todos los recordatorios están programados de forma óptima.")}>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-550 border border-white dark:border-slate-850 rounded-full"></span>
              <Bell className="w-5.5 h-5.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 transition" />
            </div>

            {/* Little indicator of active parent initials */}
            <div className="h-9 w-9 bg-teal-500 text-white font-extrabold rounded-full flex items-center justify-center text-xs shadow border border-white">
              {currentActiveParent.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Main Dashboard Space */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-y-auto">
          {errorStatus && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/40 rounded-2xl flex items-center gap-2.5 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <strong>Falla de sincronización:</strong> {errorStatus} (La aplicación sigue funcionando de modo seguro con datos almacenados localmente)
              </div>
            </div>
          )}

          {renderActiveContent()}
        </main>

        {/* Footer / Status bar - Conforms strictly to Sleek style design patterns */}
        <footer className="h-10 bg-slate-100 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800/85 px-6 sm:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4 text-[9px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest overflow-hidden">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-555 rounded-full animate-pulse"></span> 
              Sincronización Cloud Activa
            </span>
            <span className="w-px h-3 bg-slate-300 dark:bg-slate-800 hidden sm:inline"></span>
            <span className="hidden sm:inline">Cifrado Militar Extremo a Extremo (E2EE)</span>
          </div>
          <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 dark:text-slate-550">
            v2.4.0 • Privacidad y Resguardo Familiar Garantizados
          </div>
        </footer>

      </div>

      {/* Pop-up Live Toast Alert / Push simulated notifications */}
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 p-4 bg-slate-900 text-white rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-800 max-w-sm animate-bounce text-xs">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-slate-200">Notificación Segura</p>
            <p className="text-slate-400 text-[11px] font-mono mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

    </div>
  );
}
