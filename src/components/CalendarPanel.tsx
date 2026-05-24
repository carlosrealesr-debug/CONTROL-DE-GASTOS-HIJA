import React, { useState, useRef, useEffect } from "react";
import { CoparentingData, ParentId, VisitEvent } from "../types";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Check, 
  AlertCircle, 
  FileSignature, 
  CalendarCheck, 
  Share2,
  Download,
  Plus,
  Trash,
  User,
  ExternalLink,
  X,
  FileText,
  Edit,
  Lock
} from "lucide-react";

interface CalendarPanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onSaveVisit: (visit: Partial<VisitEvent>) => void;
  onDeleteVisit: (id: string) => void;
  onOpenNewVisitForm: boolean;
  setOpenNewVisitForm: (open: boolean) => void;
  textSizeClass: string;
}

export default function CalendarPanel({
  data,
  activeParentId,
  onSaveVisit,
  onDeleteVisit,
  onOpenNewVisitForm,
  setOpenNewVisitForm,
  textSizeClass
}: CalendarPanelProps) {
  const activeParent = activeParentId === "parent_a" ? data.parentA : data.parentB;
  const otherParent = activeParentId === "parent_a" ? data.parentB : data.parentA;

  // New Support States
  const [activeSignatureVisit, setActiveSignatureVisit] = useState<VisitEvent | null>(null);
  const [showDeleteConfirmId, setShowDeleteConfirmId] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<VisitEvent | null>(null);
  const [editError, setEditError] = useState("");

  // Drawing Canvas State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Prevent scrolling when touching the canvas on touch devices
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };

    document.body.addEventListener("touchstart", preventDefault, { passive: false });
    document.body.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.body.removeEventListener("touchstart", preventDefault);
      document.body.removeEventListener("touchmove", preventDefault);
    };
  }, [activeSignatureVisit]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#4f46e5"; // Indigo matching theme
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ("touches" in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveAndConfirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSignatureVisit) return;
    const dataURL = canvas.toDataURL("image/png");
    handleSignHandoverWithSignature(activeSignatureVisit.id, dataURL);
    setActiveSignatureVisit(null);
  };

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    startDate: "",
    endDate: "",
    pickupLocation: "",
    deliveryLocation: "",
    responsibleParentId: activeParentId,
    notes: ""
  });

  const [formError, setFormError] = useState("");

  // Load new visit draft from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("coparenting_draft_visit");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        if (parsed.title || parsed.pickupLocation || parsed.deliveryLocation || parsed.notes) {
          setOpenNewVisitForm(true);
        }
      } catch (e) {
        console.error("Error loading visit draft:", e);
      }
    }
  }, [setOpenNewVisitForm]);

  // Save new visit draft to localStorage as fields change
  useEffect(() => {
    if (formData.title || formData.pickupLocation || formData.deliveryLocation || formData.notes) {
      localStorage.setItem("coparenting_draft_visit", JSON.stringify(formData));
    } else {
      localStorage.removeItem("coparenting_draft_visit");
    }
  }, [formData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formData.title || !formData.startDate || !formData.endDate || !formData.pickupLocation || !formData.deliveryLocation) {
      setFormError("Por favor, completa todos los campos requeridos (*).");
      return;
    }

    if (new Date(formData.startDate) >= new Date(formData.endDate)) {
      setFormError("La fecha de inicio debe ser anterior a la fecha de finalización.");
      return;
    }

    onSaveVisit({
      title: formData.title,
      startDate: formData.startDate,
      endDate: formData.endDate,
      pickupLocation: formData.pickupLocation,
      deliveryLocation: formData.deliveryLocation,
      responsibleParentId: formData.responsibleParentId as ParentId,
      notes: formData.notes,
      status: "pending",
      creatorId: activeParentId,
      signedOffMap: {
        parent_a: activeParentId === "parent_a",
        parent_b: activeParentId === "parent_b"
      }
    });

    // Reset Form
    setFormData({
      title: "",
      startDate: "",
      endDate: "",
      pickupLocation: "",
      deliveryLocation: "",
      responsibleParentId: activeParentId,
      notes: ""
    });
    setOpenNewVisitForm(false);
    localStorage.removeItem("coparenting_draft_visit");
  };

  // Sign hand-over confirmation with Base64 drawing
  const handleSignHandoverWithSignature = (visitId: string, signatureBase64: string) => {
    const visit = data.visits.find(v => v.id === visitId);
    if (!visit) return;

    const updatedSignedOffMap = { ...visit.signedOffMap };
    updatedSignedOffMap[activeParentId] = true;

    const updatedSignatures = visit.signatures ? { ...visit.signatures } : {};
    updatedSignatures[activeParentId] = signatureBase64;

    // If both parents signature are complete, change status to 'confirmed' or 'completed'
    let newStatus = visit.status;
    if (updatedSignedOffMap.parent_a && updatedSignedOffMap.parent_b) {
      newStatus = "completed";
    }

    onSaveVisit({
      id: visitId,
      signedOffMap: updatedSignedOffMap,
      signatures: updatedSignatures,
      status: newStatus
    });
  };

  // Export event to standard .ics file (so the user can import into Google Calendar, Outlook, or Apple Calendar)
  const exportToICS = (event: VisitEvent) => {
    const cleanDateForICS = (dateStr: string) => {
      // Input formats: "YYYY-MM-DDTHH:mm" -> transform to "YYYYMMDDTHHmm00Z" (UTC simulation)
      const clean = dateStr.replace(/[^0-9]/g, "");
      return clean.slice(0, 12) + "00";
    };

    const start = cleanDateForICS(event.startDate);
    const end = cleanDateForICS(event.endDate);

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//CoParenting App//Visitation Calendar//ES",
      "BEGIN:VEVENT",
      `UID:event-${event.id}@coparentalidad.segura`,
      `DTSTAMP:${cleanDateForICS(new Date().toISOString().slice(0, 16))}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:Custodia asignada a: ${event.responsibleParentId === 'parent_a' ? data.parentA.name : data.parentB.name}. Notas: ${event.notes || 'Ninguna'}`,
      `LOCATION:Punto de Recogida: ${event.pickupLocation} - Entrega: ${event.deliveryLocation}`,
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `evento_visita_${event.id}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate web Google Calendar link for quick online synchronization
  const getGoogleCalendarLink = (event: VisitEvent) => {
    const cleanDateForGoogle = (dateStr: string) => {
      return dateStr.replace(/[^0-9T]/g, "");
    };
    const details = encodeURIComponent(`Custodia a cargo de: ${event.responsibleParentId === 'parent_a' ? data.parentA.name : data.parentB.name}. Notas: ${event.notes || ''}`);
    const location = encodeURIComponent(`Recogida: ${event.pickupLocation} -> Entrega: ${event.deliveryLocation}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${cleanDateForGoogle(event.startDate)}00/${cleanDateForGoogle(event.endDate)}00&details=${details}&location=${location}`;
  };

  const getStatusBadge = (status: string, signedMap?: { parent_a?: boolean; parent_b?: boolean }) => {
    const parentA_Ok = signedMap?.parent_a;
    const parentB_Ok = signedMap?.parent_b;

    if (status === "completed") {
      return (
        <span className="text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 border border-emerald-100 dark:border-emerald-900/30">
          ✓ Intercambio Completado
        </span>
      );
    }

    if (parentA_Ok && parentB_Ok) {
      return (
        <span className="text-xs bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 border border-indigo-100 dark:border-indigo-900/30">
          • Confirmado por Ambos
        </span>
      );
    }

    if (parentA_Ok || parentB_Ok) {
      return (
        <span className="text-xs bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1 border border-amber-100 dark:border-amber-900/30">
          ⚠️ Esperando Contra-Firma
        </span>
      );
    }

    return (
      <span className="text-xs bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-1 rounded-full font-semibold border border-slate-150 dark:border-slate-700/50">
        Pendiente de Validación
      </span>
    );
  };

  return (
    <div className={`space-y-6 ${textSizeClass}`}>
      {/* Encabezado del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-500" />
            Calendario de Coparentalidad y Turnos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Visualiza los fines de semanas, vacaciones o recogidas ordinarias acordadas. Valida cada entrega en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setOpenNewVisitForm(!onOpenNewVisitForm)}
          className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-550 dark:hover:bg-indigo-650 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Planificar Entrega / Visita
        </button>
      </div>

      {/* Formulario de Nueva Visita */}
      {onOpenNewVisitForm && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-indigo-100 dark:border-slate-800/80 p-6 shadow-md transition-all">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 mb-4 uppercase tracking-wider">
            Nueva Planificación de Visita
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/60 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Título del Evento *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ej: Fin de semana con papá, Recogida escolar"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Progenitor a cargo *
                </label>
                <select
                  name="responsibleParentId"
                  value={formData.responsibleParentId}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                >
                  <option value="parent_a">{data.parentA.name} ({data.parentA.role})</option>
                  <option value="parent_b">{data.parentB.name} ({data.parentB.role})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Fecha y Hora de Inicio *
                </label>
                <input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Fecha y Hora de Retorno *
                </label>
                <input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Punto de Entrega / Recogida *
                </label>
                <input
                  type="text"
                  name="pickupLocation"
                  value={formData.pickupLocation}
                  onChange={handleInputChange}
                  placeholder="Ej: Colegio San José, Entrada Principal"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Punto de Retorno / Entrega Final *
                </label>
                <input
                  type="text"
                  name="deliveryLocation"
                  value={formData.deliveryLocation}
                  onChange={handleInputChange}
                  placeholder="Ej: Casa de la Madre, Calle Falsa 123"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Instrucciones Adicionales o Notas de Cuidado
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Por favor detallar si requiere medicamentos especializados, ropas de invierno, horario de comidas, etc."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setOpenNewVisitForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition"
              >
                Guardar Evento en Calendario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Eventos Registrados */}
      <div className="space-y-4">
        {data.visits.length > 0 ? (
          data.visits
            .slice()
            .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
            .map((visit) => {
              const responsibleParent = visit.responsibleParentId === "parent_a" ? data.parentA : data.parentB;
              const hasActiveSigned = visit.signedOffMap?.[activeParentId];
              const hasOtherSigned = visit.signedOffMap?.[activeParentId === "parent_a" ? "parent_b" : "parent_a"];

              return (
                <div 
                  key={visit.id} 
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm p-5 md:p-6 transition hover:shadow-md hover:border-indigo-100 dark:hover:border-slate-750"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-350 px-2.5 py-0.5 rounded">
                          Turno de: {responsibleParent.name}
                        </span>
                        {getStatusBadge(visit.status, visit.signedOffMap)}
                      </div>

                      <h3 className="text-base font-bold text-slate-800 dark:text-slate-150">
                        {visit.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>
                            {new Date(visit.startDate).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                          <span className="mx-1">al</span>
                          <span>
                            {new Date(visit.endDate).toLocaleDateString("es-ES", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-nowrap items-center gap-2">
                      {/* Sincronización Directa de Calendario */}
                      <button
                        onClick={() => exportToICS(visit)}
                        title="Descargar archivo iCal (.ics) para sincronizar"
                        className="p-2 border border-slate-200 dark:border-slate-750 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition inline-flex items-center gap-1 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">iCal (.ics)</span>
                      </button>

                      <a
                        href={getGoogleCalendarLink(visit)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Añadir a Google Calendar"
                        className="p-2 border border-slate-200 dark:border-slate-750 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-slate-800 rounded-xl transition inline-flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Google Cal</span>
                      </a>

                      {/* Editar/Eliminar Evento (Solo creador) */}
                      {(!visit.creatorId || visit.creatorId === activeParentId) ? (
                        <>
                          <button
                            onClick={() => {
                              setEditingVisit(visit);
                              setEditError("");
                            }}
                            title="Editar este evento de visita"
                            aria-label="Editar evento de visita"
                            className="p-2 border border-emerald-200 dark:border-emerald-900/30 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300 rounded-xl transition inline-flex items-center gap-1 text-xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Editar</span>
                          </button>

                          <button
                            onClick={() => setShowDeleteConfirmId(visit.id)}
                            title="Eliminar este evento"
                            aria-label="Eliminar evento de visita"
                            className="p-2 border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 hover:border-rose-300 rounded-xl transition inline-flex items-center gap-1 text-xs"
                          >
                            <Trash className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Eliminar</span>
                          </button>
                        </>
                      ) : (
                        <span 
                          className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl inline-flex items-center gap-1 text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                          title={`Este evento fue creado por ${visit.creatorId === "parent_a" ? data.parentA.name : data.parentB.name}. Sólo el creador del evento puede realizar ajustes o eliminarlo.`}
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Sólo de Lectura
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diálogo de Confirmación de Eliminación */}
                  {showDeleteConfirmId === visit.id && (
                    <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-1">
                      <span className="text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        ¿Confirmas que deseas eliminar esta visita de la planificación? Esta acción es irreversible.
                      </span>
                      <div className="flex gap-2 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteVisit(visit.id);
                            setShowDeleteConfirmId(null);
                          }}
                          className="bg-rose-600 hover:bg-rose-700 text-white px-3 py-1.5 rounded-lg font-bold shadow-sm"
                        >
                          Sí, eliminar
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirmId(null)}
                          className="border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg font-bold"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Detalles Interiores */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                    <div className="space-y-1.5">
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <strong>Punto de Recogida:</strong> {visit.pickupLocation}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                        <strong>Punto de Retorno:</strong> {visit.deliveryLocation}
                      </p>
                    </div>

                    {visit.notes && (
                      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 rounded-xl text-slate-650 dark:text-slate-350 italic">
                        <strong>Notas adicionales:</strong> "{visit.notes}"
                      </div>
                    )}
                  </div>

                  {/* Autenticación Digital de Intercambio Realizada */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3 bg-slate-50/40 dark:bg-slate-900/10 p-4 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <FileSignature className="w-4 h-4 text-indigo-500" />
                          Firma Digitalizada de Entrega y Recepción (Tacto o Puntero):
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Ambos deben certificar de forma manuscrita el intercambio seguro.
                        </p>
                      </div>

                      {visit.status !== "completed" && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSignatureVisit(visit);
                          }}
                          disabled={hasActiveSigned}
                          className={`text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 ${
                            hasActiveSigned 
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed" 
                              : "bg-indigo-600 dark:bg-indigo-550 hover:bg-indigo-700 dark:hover:bg-indigo-650 text-white"
                          }`}
                        >
                          {hasActiveSigned ? (
                            <>✓ Firmaste Entrega</>
                          ) : (
                            <>
                              <FileSignature className="w-3.5 h-3.5" />
                              Firmar con Dedo / Puntero
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* Mostrar firmas guardadas en Base64 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-150 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                      <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold block text-slate-650 dark:text-slate-300 mb-1">{data.parentA.name}:</span>
                        {visit.signedOffMap?.parent_a ? (
                          <div className="space-y-1.5">
                            <span className="text-emerald-600 dark:text-emerald-450 font-medium inline-flex items-center gap-1">✓ Validado Digitalmente</span>
                            {visit.signatures?.parent_a ? (
                              <img 
                                src={visit.signatures.parent_a} 
                                alt={`Firma de ${data.parentA.name}`} 
                                className="h-10 object-contain dark:invert bg-indigo-50/10 rounded w-full max-w-[120px] border border-slate-100 dark:border-slate-800" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-slate-400 italic block">(Firma dibujada guardada)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-500 font-medium">❌ No firmado</span>
                        )}
                      </div>

                      <div className="p-2 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold block text-slate-650 dark:text-slate-300 mb-1">{data.parentB.name}:</span>
                        {visit.signedOffMap?.parent_b ? (
                          <div className="space-y-1.5">
                            <span className="text-emerald-600 dark:text-emerald-450 font-medium inline-flex items-center gap-1">✓ Validado Digitalmente</span>
                            {visit.signatures?.parent_b ? (
                              <img 
                                src={visit.signatures.parent_b} 
                                alt={`Firma de ${data.parentB.name}`} 
                                className="h-10 object-contain dark:invert bg-indigo-50/10 rounded w-full max-w-[120px] border border-slate-100 dark:border-slate-800" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-slate-400 italic block">(Firma dibujada guardada)</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-rose-500 font-medium">❌ No firmado</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-850">
            <CalendarCheck className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-750 mb-2" />
            <p className="text-sm">No hay registros de visitas de coparentalidad en la lista.</p>
          </div>
        )}
      </div>

      {/* Modal para Firma Digital con Dedo o Lápiz */}
      {activeSignatureVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 uppercase tracking-wider flex items-center gap-2">
                <FileSignature className="w-4.5 h-4.5 text-indigo-500" />
                Firma Digital con Tacto / Puntero
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveSignatureVisit(null);
                  setIsDrawing(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-slate-600 dark:text-slate-300 text-xs text-left">
                Estás firmando como: <strong className="text-indigo-650 dark:text-indigo-400">{activeParent.name} ({activeParent.role})</strong> para la visita:
              </p>
              <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-805 p-3 rounded-xl text-xs space-y-0.5 text-slate-600 dark:text-slate-400 text-left">
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs">{activeSignatureVisit.title}</p>
                <p className="text-[11px]">Recogida: {activeSignatureVisit.pickupLocation} | Retorno: {activeSignatureVisit.deliveryLocation}</p>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-left leading-relaxed">
                Usa tu <strong>dedo, lápiz óptico o mouse</strong> de forma manuscrita en el recuadro blanco para plasmar tu conformidad con el intercambio.
              </p>
            </div>

            {/* Drawing Canvas Area */}
            <div className="relative border-2 border-dashed border-indigo-200 dark:border-indigo-900 bg-white rounded-xl overflow-hidden shadow-inner">
              <canvas
                ref={canvasRef}
                width={380}
                height={180}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-44 bg-white cursor-crosshair touch-none"
              />
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-none text-[10px] text-slate-300 font-mono tracking-widest uppercase border-t border-slate-105 pt-1 w-[80%] text-center">
                Pizarra de Firma Digitalizada
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-lg border border-slate-250 dark:border-slate-800 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm"
              >
                Limpiar Pizarra
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSignatureVisit(null);
                    setIsDrawing(false);
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={saveAndConfirmSignature}
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow transition"
                >
                  Confirmar y Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Editar Visita de Coparentalidad */}
      {editingVisit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-indigo-500" />
                Editar Visita y Planificación
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingVisit(null);
                  setEditError("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-950/60 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs text-left">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 animate-pulse text-rose-500" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Título de la Visita o Evento *
                </label>
                <input
                  type="text"
                  value={editingVisit.title}
                  onChange={(e) => setEditingVisit({ ...editingVisit, title: e.target.value })}
                  placeholder="Ej: Fin de semana - Regreso a clases"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Fecha y Hora de Recogida *
                  </label>
                  <input
                    type="datetime-local"
                    value={editingVisit.startDate}
                    onChange={(e) => setEditingVisit({ ...editingVisit, startDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Fecha y Hora de Retorno *
                  </label>
                  <input
                    type="datetime-local"
                    value={editingVisit.endDate}
                    onChange={(e) => setEditingVisit({ ...editingVisit, endDate: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Punto de Entrega / Recogida *
                  </label>
                  <input
                    type="text"
                    value={editingVisit.pickupLocation}
                    onChange={(e) => setEditingVisit({ ...editingVisit, pickupLocation: e.target.value })}
                    placeholder="Punto de entrega"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Punto de Retorno *
                  </label>
                  <input
                    type="text"
                    value={editingVisit.deliveryLocation}
                    onChange={(e) => setEditingVisit({ ...editingVisit, deliveryLocation: e.target.value })}
                    placeholder="Punto de retorno"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Padre/Madre Responsable *
                </label>
                <select
                  value={editingVisit.responsibleParentId}
                  onChange={(e) => setEditingVisit({ ...editingVisit, responsibleParentId: e.target.value as ParentId })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-850 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="parent_a">{data.parentA.name} ({data.parentA.role})</option>
                  <option value="parent_b">{data.parentB.name} ({data.parentB.role})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Instrucciones Adicionales o Notas de Cuidado
                </label>
                <textarea
                  rows={2}
                  value={editingVisit.notes || ""}
                  onChange={(e) => setEditingVisit({ ...editingVisit, notes: e.target.value })}
                  placeholder="Por favor detallar instrucciones especiales"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Gestión de firmas digitalizadas en edicion */}
              {(editingVisit.signedOffMap?.parent_a || editingVisit.signedOffMap?.parent_b) && (
                <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/60 rounded-xl space-y-2">
                  <p className="text-[11px] font-semibold text-indigo-700 dark:text-indigo-350">
                    Firma(s) Conforme(s) Registrada(s) para este Intercambio:
                  </p>
                  <div className="flex gap-4 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    {editingVisit.signedOffMap?.parent_a && <span>✓ {data.parentA.name} (Firmado)</span>}
                    {editingVisit.signedOffMap?.parent_b && <span>✓ {data.parentB.name} (Firmado)</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVisit({
                        ...editingVisit,
                        signedOffMap: { parent_a: false, parent_b: false },
                        signatures: { parent_a: "", parent_b: "" },
                        status: "pending"
                      });
                    }}
                    className="text-[10px] text-rose-550 dark:text-rose-400 hover:text-rose-600 font-bold underline block"
                  >
                    Borrar firmas guardadas de esta visita para corregir campos o volver a firmar
                  </button>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setEditingVisit(null);
                  setEditError("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!editingVisit.title || !editingVisit.startDate || !editingVisit.endDate || !editingVisit.pickupLocation || !editingVisit.deliveryLocation) {
                    setEditError("Por favor, completa todos los campos requeridos (*).");
                    return;
                  }
                  if (new Date(editingVisit.startDate) >= new Date(editingVisit.endDate)) {
                    setEditError("La fecha de inicio debe ser anterior a la de finalización.");
                    return;
                  }
                  onSaveVisit(editingVisit);
                  setEditingVisit(null);
                  setEditError("");
                }}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
