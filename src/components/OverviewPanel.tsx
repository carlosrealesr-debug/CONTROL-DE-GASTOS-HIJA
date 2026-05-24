import React from "react";
import { CoparentingData, ParentId } from "../types";
import { 
  Calendar, 
  DollarSign, 
  MessageSquare, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck,
  Percent
} from "lucide-react";
import { motion } from "motion/react";

interface OverviewPanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onSelectTab: (tab: string) => void;
  onToggleReminder: (id: string) => void;
  onOpenNewExpense: () => void;
  onOpenNewVisit: () => void;
  textSizeClass: string;
}

export default function OverviewPanel({
  data,
  activeParentId,
  onSelectTab,
  onToggleReminder,
  onOpenNewExpense,
  onOpenNewVisit,
  textSizeClass
}: OverviewPanelProps) {
  const activeParent = activeParentId === "parent_a" ? data.parentA : data.parentB;
  const otherParent = activeParentId === "parent_a" ? data.parentB : data.parentA;

  // Calculos de Gastos
  const totalExpenses = data.expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const foodExpenses = data.expenses
    .filter((e) => e.category === "Alimentación")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const snackExpenses = data.expenses
    .filter((e) => e.category === "Merienda")
    .reduce((sum, exp) => sum + exp.amount, 0);
  const extraExpenses = data.expenses
    .filter((e) => e.category === "Extra")
    .reduce((sum, exp) => sum + exp.amount, 0);

  const activeParentSpend = data.expenses
    .filter((e) => e.payerId === activeParentId)
    .reduce((sum, exp) => sum + exp.amount, 0);

  // Formato Moneda
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Siguiente Visita Programada
  const nextVisit = data.visits
    .filter((v) => new Date(v.startDate) >= new Date() && v.status !== "cancelled")
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

  // Acuerdos pendientes de firma por el usuario activo
  const pendingAgreements = data.agreements.filter((a) => {
    if (a.status === "signed") return false;
    if (activeParentId === "parent_a" && !a.signatureA) return true;
    if (activeParentId === "parent_b" && !a.signatureB) return true;
    return false;
  });

  // Mensajes no leídos de la otra parte
  const unreadMessages = data.messages.filter((m) => m.senderId !== activeParentId && !m.read).length;

  return (
    <div className={`space-y-6 ${textSizeClass}`}>
      {/* Mensaje de Bienvenida */}
      <div className="bg-gradient-to-r from-emerald-550/10 to-teal-550/5 dark:from-emerald-950/20 dark:to-teal-950/10 border border-emerald-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute right-4 top-4 text-emerald-500/10 dark:text-emerald-400/5">
          <ShieldCheck className="w-32 h-32" />
        </div>
        <div className="relative z-10 max-w-2xl">
          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-550/10 text-emerald-650 dark:text-emerald-400 rounded-full inline-flex items-center gap-1.5 mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-550 dark:bg-emerald-400 animate-pulse"></span>
            Conexión Encriptada • E2EE
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-150">
            Hola, {activeParent.name}
          </h2>
          <p className="mt-1 text-slate-600 dark:text-slate-350 text-sm leading-relaxed">
            Estás gestionando la coparentalidad de tu hija <strong className="text-slate-800 dark:text-slate-150">{data.daughter.name}</strong> en coordinación segura con {otherParent.name}. Todos los acuerdos y datos financieros se encuentran respaldados con firmas digitales criptográficas.
          </p>
        </div>
      </div>

      {/* Grid de Resumen Rápido de Gastos */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Registrado</p>
              <h3 className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1">{formatCurrency(totalExpenses)}</h3>
            </div>
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">Total acumulado</span>
            <span>este periodo</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alimentación</p>
              <h3 className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(foodExpenses)}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{Math.round((foodExpenses / (totalExpenses || 1)) * 100)}%</span>
            <span>de la cuota registrado</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Merienda Escolar</p>
              <h3 className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{formatCurrency(snackExpenses)}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-amber-600 dark:text-amber-400">{Math.round((snackExpenses / (totalExpenses || 1)) * 100)}%</span>
            <span>de gastos menores</span>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-850 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gastos Extra</p>
              <h3 className="text-2xl font-bold font-mono text-purple-650 dark:text-purple-400 mt-1">{formatCurrency(extraExpenses)}</h3>
            </div>
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-purple-650 dark:text-purple-400">{Math.round((extraExpenses / (totalExpenses || 1)) * 100)}%</span>
            <span>salud, educación, etc</span>
          </div>
        </div>
      </div>

      {/* Panel Central de Dos Columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda/Centro: Visitas y Gastos aportados */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Siguiente Visita / Intercambio */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-500" />
                Próximo Intercambio y Entrega
              </h3>
              <button 
                onClick={() => onSelectTab("visitas")}
                aria-label="Ir al módulo de calendario"
                className="text-indigo-600 dark:text-indigo-400 text-xs font-semibold hover:underline inline-flex items-center gap-1"
              >
                Calendario Completo <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {nextVisit ? (
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold bg-indigo-550/10 text-indigo-650 dark:text-indigo-400 px-2 py-0.5 rounded">
                      {nextVisit.responsibleParentId === activeParentId ? "Te corresponde entregar/recibir" : "Corresponde al otro progenitor"}
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-150 mt-1.5 text-base">
                      {nextVisit.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-450 mt-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Inicia: {new Date(nextVisit.startDate).toLocaleDateString("es-ES", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <div className="border-t md:border-t-0 md:border-l border-slate-250 dark:border-slate-800 md:pl-5 pt-3 md:pt-0 space-y-1 text-xs">
                    <p className="text-slate-500 dark:text-slate-450">
                      <strong>Punto de Entrega:</strong> {nextVisit.pickupLocation}
                    </p>
                    <p className="text-slate-500 dark:text-slate-450">
                      <strong>Punto de Retorno:</strong> {nextVisit.deliveryLocation}
                    </p>
                  </div>
                </div>
                {nextVisit.notes && (
                  <div className="mt-4 pt-3 border-t border-slate-150 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 italic">
                    Nota: "{nextVisit.notes}"
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-450 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <p className="text-sm">No tienes traslados o visitas planificadas para los próximos días.</p>
                <button 
                  onClick={onOpenNewVisit}
                  className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-750 text-white font-medium px-4 py-1.5 rounded-lg transition"
                >
                  Programar Visita
                </button>
              </div>
            )}
          </div>

          {/* Atajos Rápidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Gastos Propios */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-emerald-500" />
                    Tus Aportes Monetarios
                  </h4>
                  <span className="text-xs bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 font-mono font-bold px-2 py-0.5 rounded">
                    Padre Responsable
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Has acreditado un total de <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(activeParentSpend)}</strong> en concepto de alimentación, merienda u otros gastos durante este mes.
                </p>
              </div>
              <button
                onClick={onOpenNewExpense}
                className="w-full text-center py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-550 dark:hover:bg-emerald-650 text-white font-medium text-xs rounded-xl shadow-sm transition"
              >
                + Registrar Nuevo Gasto
              </button>
            </div>

            {/* Mensajes Recobrados/Encriptados */}
            <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-sky-500" />
                    Buzón Parental E2EE
                  </h4>
                  {unreadMessages > 0 && (
                    <span className="text-xs bg-rose-500 text-white font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {unreadMessages} nuevo(s)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Canal seguro y cifrado. La comunicación se audita de forma inmutable para certificar el debido respeto mutuo y cumplimiento de deberes parentales.
                </p>
              </div>
              <button
                onClick={() => onSelectTab("mensajes")}
                className="w-full text-center py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-xs rounded-xl transition"
              >
                Abrir Chat Seguro
              </button>
            </div>

          </div>
        </div>

        {/* Columna Derecha: Recordatorios y Acuerdos Pendientes */}
        <div className="space-y-6">
          
          {/* Recordatorios / Alertas */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Notificaciones y Vencimientos
            </h3>

            <div className="space-y-3">
              {data.reminders.length > 0 ? (
                data.reminders.map((rem) => (
                  <div 
                    key={rem.id} 
                    className={`flex items-start gap-3 p-3 rounded-xl border transition ${
                      rem.completed 
                        ? "bg-slate-50/70 dark:bg-slate-900/30 border-slate-150 dark:border-slate-800/80 opacity-60" 
                        : "bg-amber-50/40 dark:bg-amber-950/10 border-amber-100 dark:border-amber-950/40"
                    }`}
                  >
                    <button 
                      onClick={() => onToggleReminder(rem.id)}
                      aria-label={`Marcar recordatorio ${rem.title} como ${rem.completed ? "pendiente" : "completado"}`}
                      className="mt-0.5 focus:outline-none"
                    >
                      <CheckCircle2 className={`w-4.5 h-4.5 transition ${
                        rem.completed ? "text-emerald-550 fill-emerald-50 dark:fill-emerald-950" : "text-slate-300 hover:text-amber-500"
                      }`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-semibold ${rem.completed ? "line-through text-slate-400 dark:text-slate-500" : "text-slate-800 dark:text-slate-250"}`}>
                        {rem.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {rem.description}
                      </p>
                      {rem.dueDate && (
                        <span className="inline-block text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2 py-0.5 rounded mt-1.5 font-mono">
                          Vence: {new Date(rem.dueDate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center py-4">No tienes tareas ni alertas pendientes.</p>
              )}
            </div>
          </div>

          {/* Acuerdos Pendientes de Firma */}
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-6">
            <h3 className="font-bold text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-500" />
              Acuerdos por firmar ({pendingAgreements.length})
            </h3>

            {pendingAgreements.length > 0 ? (
              <div className="space-y-3">
                {pendingAgreements.map((agr) => (
                  <div key={agr.id} className="p-3 bg-purple-50/30 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-900/30 rounded-xl space-y-2">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{agr.title}</h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{agr.description}</p>
                    </div>
                    <button
                      onClick={() => onSelectTab("acuerdos")}
                      className="w-full py-1 text-center bg-purple-650 hover:bg-purple-750 text-white font-medium text-[11px] rounded-lg transition"
                    >
                      Ir a Firmar Documento
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2 text-center">No posees acuerdos pendientes de tu firma digital.</p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
