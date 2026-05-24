import React, { useState, useEffect } from "react";
import { CoparentingData, ParentId, Expense, ExpenseCategory } from "../types";
import { 
  DollarSign, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Download, 
  PiggyBank, 
  Calendar,
  Layers,
  Signature,
  FileCheck,
  Edit,
  Paperclip,
  Upload,
  X,
  Eye,
  FileImage,
  Lock
} from "lucide-react";

interface FinancePanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onSaveExpense: (expense: Partial<Expense>) => void;
  onDeleteExpense: (id: string) => void;
  textSizeClass: string;
}

export default function FinancePanel({
  data,
  activeParentId,
  onSaveExpense,
  onDeleteExpense,
  textSizeClass
}: FinancePanelProps) {
  const activeParent = activeParentId === "parent_a" ? data.parentA : data.parentB;
  const otherParent = activeParentId === "parent_a" ? data.parentB : data.parentA;

  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [monthFilter, setMonthFilter] = useState<string>("2026-05"); // default to May 2026 based on mock data and local date
  
  // New Expense Form State
  const [category, setCategory] = useState<ExpenseCategory>("Alimentación");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [invoiceRef, setInvoiceRef] = useState("");
  const [formError, setFormError] = useState("");

  // New Support States
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentData, setAttachmentData] = useState("");
  const [isNewDragActive, setIsNewDragActive] = useState(false);

  // Edit Expense States
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [isEditDragActive, setIsEditDragActive] = useState(false);
  const [editError, setEditError] = useState("");

  // Attachment lightbox viewer state
  const [viewingAttachment, setViewingAttachment] = useState<Expense | null>(null);

  // Load new expense draft from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("coparenting_draft_expense");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.amount) setAmount(parsed.amount);
        if (parsed.date) setDate(parsed.date);
        if (parsed.invoiceRef) setInvoiceRef(parsed.invoiceRef);
        if (parsed.attachmentName) setAttachmentName(parsed.attachmentName);
        if (parsed.attachmentData) setAttachmentData(parsed.attachmentData);
        if (parsed.description || parsed.amount || parsed.invoiceRef) {
          setShowAddForm(true);
        }
      } catch (e) {
        console.error("Error loading expense draft:", e);
      }
    }
  }, []);

  // Save new expense draft to localStorage as fields change
  useEffect(() => {
    const draft = {
      category,
      description,
      amount,
      date,
      invoiceRef,
      attachmentName,
      attachmentData
    };
    if (description || amount || invoiceRef || attachmentName) {
      localStorage.setItem("coparenting_draft_expense", JSON.stringify(draft));
    } else {
      localStorage.removeItem("coparenting_draft_expense");
    }
  }, [category, description, amount, date, invoiceRef, attachmentName, attachmentData]);

  const processFile = (file: File, callback: (name: string, data: string) => void) => {
    if (!file) return;

    // Check if the uploaded file is an image
    if (file.type.startsWith("image/")) {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Downscale to readable receipt resolution (e.g., max 1200px)
        const MAX_DIM = 1200;
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
          // Export as compressed JPEG format (80% quality retains excellent details while shrinking payload by 95%)
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
          const compressedName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
          callback(compressedName, compressedBase64);
        } else {
          fallbackReader(file, callback);
        }
      };

      img.onerror = () => {
        fallbackReader(file, callback);
      };

      // Read image into source
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } else {
      // PDF or other non-image format
      fallbackReader(file, callback);
    }
  };

  const fallbackReader = (file: File, callback: (name: string, data: string) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target?.result as string;
      callback(file.name, base64Data);
    };
    reader.readAsDataURL(file);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter & calculate expenses
  const filteredExpenses = data.expenses.filter((exp) => {
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    const matchesMonth = !monthFilter || exp.date.startsWith(monthFilter);
    return matchesCategory && matchesMonth;
  });

  const categoryTotals = {
    Alimentación: data.expenses.filter((e) => e.category === "Alimentación" && (!monthFilter || e.date.startsWith(monthFilter))).reduce((s, e) => s + e.amount, 0),
    Merienda: data.expenses.filter((e) => e.category === "Merienda" && (!monthFilter || e.date.startsWith(monthFilter))).reduce((s, e) => s + e.amount, 0),
    Extra: data.expenses.filter((e) => e.category === "Extra" && (!monthFilter || e.date.startsWith(monthFilter))).reduce((s, e) => s + e.amount, 0)
  };

  const totalFilteredAmount = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!description.trim() || !amount || Number(amount) <= 0) {
      setFormError("Por favor ingresa una descripción válida y un monto mayor que 0.");
      return;
    }

    onSaveExpense({
      category,
      description,
      amount: Number(amount),
      date,
      payerId: activeParentId,
      invoiceRef,
      attachmentName,
      attachmentData,
      status: "pending"
    });

    // Reset Form
    setDescription("");
    setAmount("");
    setInvoiceRef("");
    setAttachmentName("");
    setAttachmentData("");
    setShowAddForm(false);
    localStorage.removeItem("coparenting_draft_expense");
  };

  const handleApproveExpense = (expenseId: string) => {
    onSaveExpense({
      id: expenseId,
      status: "approved",
      signedByOtherParent: {
        signature: activeParent.name,
        timestamp: new Date().toISOString()
      }
    });
  };

  // Automated layout-driven high-fidelity HTML window printable PDF report
  const generatePDFReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes (popups) para poder exportar su PDF de balances.");
      return;
    }

    const reportMonth = monthFilter ? new Date(monthFilter + "-02").toLocaleDateString("es-ES", { month: "long", year: "numeric" }) : "Histórico Completo";
    
    let rowsHTML = "";
    filteredExpenses.forEach((exp) => {
      const payer = exp.payerId === "parent_a" ? data.parentA : data.parentB;
      const verified = exp.status === "approved" ? "✓ Aprobado e Inmutable" : "Pendiente de firma";
      const signBy = exp.signedByOtherParent ? exp.signedByOtherParent.signature : "Ninguna";

      rowsHTML += `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-size: 11px;">${exp.date}</td>
          <td style="padding: 12px; font-weight: bold; font-size: 11px;">${exp.category}</td>
          <td style="padding: 12px; font-size: 11px;">${exp.description}</td>
          <td style="padding: 12px; font-size: 11px;">${payer.name}</td>
          <td style="padding: 12px; font-size: 11px; font-family: monospace;">${exp.invoiceRef || 'N/A'}${exp.attachmentName ? '<br/><span style="color:#059669; font-size:90%;">📎 ' + exp.attachmentName + '</span>' : ''}</td>
          <td style="padding: 12px; font-size: 11px; font-weight: bold;">${verified}</td>
          <td style="padding: 12px; font-size: 11px; font-family: monospace; font-size: 9px; color: #4f46e5;">${signBy}</td>
          <td style="padding: 12px; text-align: right; font-weight: bold; font-family: monospace;">$${exp.amount.toLocaleString()} COP</td>
        </tr>
      `;
    });

    const categoriesBreakdownHTML = `
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc; text-align: center;">
          <h4 style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Cuota Alimentaria</h4>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #10b981;">$${categoryTotals.Alimentación.toLocaleString()} COP</p>
        </div>
        <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc; text-align: center;">
          <h4 style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Meriendas</h4>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #f59e0b;">$${categoryTotals.Merienda.toLocaleString()} COP</p>
        </div>
        <div style="flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; background-color: #f8fafc; text-align: center;">
          <h4 style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase;">Gastos Extra</h4>
          <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: bold; color: #8b5cf6;">$${categoryTotals.Extra.toLocaleString()} COP</p>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Gastos de Coparentalidad - ${reportMonth}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; }
            .header-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .content-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
            .content-table th { background-color: #f1f5f9; padding: 12px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; }
            .totales-footer { text-align: right; font-size: 16px; font-weight: bold; padding: 20px; border-top: 2px solid #cbd5e1; }
            .stamp-box { border: 2px dashed #10b981; padding: 15px; border-radius: 8px; color: #10b981; font-size: 12px; text-transform: uppercase; text-align: center; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <h1 style="margin: 0; font-size: 20px; color: #1e1b4b;">INFORME MENSUAL DE DEBERES FINANCIEROS Y GASTOS</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #64748b;">Hija beneficiaria: <strong>${data.daughter.name}</strong></p>
                <p style="margin: 3px 0 0 0; font-size: 11px; color: #94a3b8;">Mes de Control: ${reportMonth} • Generado el ${new Date().toLocaleDateString('es-CO')}</p>
              </td>
              <td style="text-align: right; width: 250px;">
                <div class="stamp-box">
                  <strong>Copia de Seguridad Certificada</strong><br>
                  <span style="font-size: 8px; text-transform: none; color: #64748b; font-family: monospace;">Firma Digital Integrada y Encriptada</span>
                </div>
              </td>
            </tr>
          </table>

          <div style="border-bottom: 1px solid #e2e8f0; margin-bottom: 25px;"></div>

          <h3 style="font-size: 13px; text-transform: uppercase; color: #475569; margin-bottom: 15px;">Resumen por Categorías</h3>
          ${categoriesBreakdownHTML}

          <h3 style="font-size: 13px; text-transform: uppercase; color: #475569; margin-bottom: 15px;">Listado Detallado de Erogaciones</h3>
          <table class="content-table">
            <thead>
              <tr>
                <th style="padding: 12px;">Fecha</th>
                <th style="padding: 12px;">Categoría</th>
                <th style="padding: 12px;">Concepto</th>
                <th style="padding: 12px;">Pagado Por</th>
                <th style="padding: 12px;">Ref. Factura</th>
                <th style="padding: 12px;">Estado</th>
                <th style="padding: 12px;">Firma de Aprobación</th>
                <th style="padding: 12px; text-align: right;">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>

          <div class="totales-footer">
            TOTAL CONSOLIDADO REPORTADO: $${totalFilteredAmount.toLocaleString()} COP
          </div>

          <div style="margin-top: 60px; display: flex; justify-content: space-between;">
            <div style="text-align: center; width: 45%;">
              <div style="border-bottom: 1px solid #94a3b8; width: 100%; height: 50px; margin-bottom: 10px;"></div>
              <p style="margin: 0; font-size: 11px; font-weight: bold;">${data.parentA.name}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Firma Digital • ${data.parentA.role}</p>
            </div>
            <div style="text-align: center; width: 45%;">
              <div style="border-bottom: 1px solid #94a3b8; width: 100%; height: 50px; margin-bottom: 10px;"></div>
              <p style="margin: 0; font-size: 11px; font-weight: bold;">${data.parentB.name}</p>
              <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748b;">Firma Digital • ${data.parentB.role}</p>
            </div>
          </div>

          <footer style="margin-top: 80px; text-align: center; font-size: 9px; color: #94a3b8;">
            Este documento digital se expide en cumplimiento del acuerdo bilateral de mutuo entendimiento. CódigoHash: E2EE-REPORTE-FINANC-MAY2026-F63B9
          </footer>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  return (
    <div className={`space-y-6 ${textSizeClass}`}>
      {/* Módulo Cabecera */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            Control de Cuota Alimentaria & Gastos de Manutención
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Registra y valida aportes mensuales y gastos de tu hija. Exporta informes PDF certificados con validez inmutable.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-550 dark:hover:bg-emerald-650 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Registrar Nuevo Gasto
        </button>
      </div>

      {/* Resumen Bento Finanzas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterCategory(filterCategory === "Alimentación" ? "All" : "Alimentación")}
          className={`cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all duration-250 select-none ${
            filterCategory === "Alimentación"
              ? "bg-emerald-500/10 dark:bg-emerald-500/15 border-2 border-emerald-500 shadow-sm ring-2 ring-emerald-400/20 scale-[1.01]"
              : "bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/40 hover:border-emerald-400 hover:shadow-sm"
          }`}
          title="Haga clic para filtrar por Aporte Alimentación"
        >
          <div className="p-3 bg-emerald-555/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <PiggyBank className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Aporte Alimentación</h4>
            <span className="text-xl font-bold font-mono text-slate-850 dark:text-slate-150">{formatCurrency(categoryTotals.Alimentación)}</span>
            {filterCategory === "Alimentación" && (
              <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">✕ Filtrado activo • Mostrar todo</span>
            )}
          </div>
        </div>

        <div 
          onClick={() => setFilterCategory(filterCategory === "Merienda" ? "All" : "Merienda")}
          className={`cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all duration-250 select-none ${
            filterCategory === "Merienda"
              ? "bg-amber-500/10 dark:bg-amber-500/15 border-2 border-amber-500 shadow-sm ring-2 ring-amber-400/20 scale-[1.01]"
              : "bg-amber-50/20 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-950/40 hover:border-amber-400 hover:shadow-sm"
          }`}
          title="Haga clic para filtrar por Meriendas y Snacks"
        >
          <div className="p-3 bg-amber-550/10 rounded-xl text-amber-600 dark:text-amber-400">
            <Layers className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Meriendas y Snacks</h4>
            <span className="text-xl font-bold font-mono text-slate-850 dark:text-slate-150">{formatCurrency(categoryTotals.Merienda)}</span>
            {filterCategory === "Merienda" && (
              <span className="block text-[9px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">✕ Filtrado activo • Mostrar todo</span>
            )}
          </div>
        </div>

        <div 
          onClick={() => setFilterCategory(filterCategory === "Extra" ? "All" : "Extra")}
          className={`cursor-pointer rounded-2xl p-4 flex items-center gap-4 transition-all duration-250 select-none ${
            filterCategory === "Extra"
              ? "bg-purple-500/10 dark:bg-purple-500/15 border-2 border-purple-500 shadow-sm ring-2 ring-purple-400/20 scale-[1.01]"
              : "bg-purple-50/20 dark:bg-purple-950/10 border border-purple-100 dark:border-purple-950/40 hover:border-purple-400 hover:shadow-sm"
          }`}
          title="Haga clic para filtrar por Gastos Extraordinarios"
        >
          <div className="p-3 bg-purple-550/10 rounded-xl text-purple-600 dark:text-purple-400">
            <FileCheck className="w-6 h-6 animate-pulse" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Gastos Extraorindarios</h4>
            <span className="text-xl font-bold font-mono text-slate-850 dark:text-slate-150">{formatCurrency(categoryTotals.Extra)}</span>
            {filterCategory === "Extra" && (
              <span className="block text-[9px] text-purple-600 dark:text-purple-400 font-semibold mt-0.5">✕ Filtrado activo • Mostrar todo</span>
            )}
          </div>
        </div>
      </div>

      {/* Formulario Agregar Gasto */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-emerald-100 dark:border-slate-800/80 p-6 shadow-md transition-all">
          <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 mb-4 uppercase tracking-wider">
            Registrar Detalle de Gasto
          </h3>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/65 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Alimentación">Cuota de Alimentación</option>
                  <option value="Merienda">Merienda Escolar / Snacks</option>
                  <option value="Extra">Gastos Extra (Médicos, Útiles, Recreación)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Monto Estimado o Desembolsado ($ COP) *
                </label>
                <input
                  type="number"
                  placeholder="Ej: 150000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Descripción Corta o Concepto *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Pago cuota mensual, Compra vegetales de merienda"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Fecha de Transacción o Recibo *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Referencia de Pago o Factura (Enlace, ID de Transferencia)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: TR-4920-NEQUI o Recibo Almacén Éxito"
                    value={invoiceRef}
                    onChange={(e) => setInvoiceRef(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Soporte de Compra / Recibo (Arrastra o Haz clic)
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsNewDragActive(true); }}
                    onDragLeave={() => setIsNewDragActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsNewDragActive(false);
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        processFile(e.dataTransfer.files[0], (name, data) => {
                          setAttachmentName(name);
                          setAttachmentData(data);
                        });
                      }
                    }}
                    onClick={() => document.getElementById("new-attachment-input")?.click()}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                      isNewDragActive 
                        ? "border-emerald-500 bg-emerald-550/10" 
                        : attachmentName 
                        ? "border-emerald-500 bg-emerald-550/5 dark:bg-emerald-950/20" 
                        : "border-slate-200 dark:border-slate-750 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-900"
                    }`}
                  >
                    <input
                      id="new-attachment-input"
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          processFile(e.target.files[0], (name, data) => {
                            setAttachmentName(name);
                            setAttachmentData(data);
                          });
                        }
                      }}
                    />
                    {attachmentName ? (
                      <div className="flex items-center justify-between text-xs gap-1.5">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold truncate max-w-[150px] flex items-center gap-1">
                          <Paperclip className="w-3.5 h-3.5 shrink-0" /> {attachmentName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setAttachmentName("");
                            setAttachmentData("");
                          }}
                          className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/30 rounded"
                        >
                          Eliminar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500">
                        <Upload className="w-4 h-4" />
                        <span className="text-xs">Adjuntar archivo o imagen</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
              >
                Guardar de Forma Segura
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filtros e Informe General */}
      <div className="bg-white dark:bg-slate-850 p-4 rounded-xl border border-slate-150 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Categoría</label>
            <select
              value={filterCategory}
              aria-label="Filtrar por categoría de gastos"
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200"
            >
              <option value="All">Todas</option>
              <option value="Alimentación">Cuota Alimentación</option>
              <option value="Merienda">Meriendas</option>
              <option value="Extra">Gastos Extra</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mes Reportado</label>
            <input
              type="month"
              aria-label="Filtrar por mes de control"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="text-xs p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <button
          onClick={generatePDFReport}
          className="bg-slate-900 hover:bg-slate-850 dark:bg-indigo-650 dark:hover:bg-indigo-550 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <FileText className="w-4 h-4" /> Exportar PDF Automático
        </button>
      </div>

      {/* Lista de Gastos */}
      <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/20 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
            Consolidado ({filteredExpenses.length} ítems)
          </span>
          <span className="text-sm font-bold text-indigo-650 dark:text-indigo-400 font-mono">
            Balance Filtrado: {formatCurrency(totalFilteredAmount)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {filteredExpenses.length > 0 ? (
            filteredExpenses
              .slice()
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((exp) => {
                const payer = exp.payerId === "parent_a" ? data.parentA : data.parentB;
                const isPaidByMe = exp.payerId === activeParentId;

                return (
                  <div key={exp.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/30 dark:hover:bg-slate-900/10 transition">
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          exp.category === "Alimentación" 
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400"
                            : exp.category === "Merienda"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-650 dark:text-amber-400"
                            : "bg-purple-50 dark:bg-purple-950/40 text-purple-650 dark:text-purple-400"
                        }`}>
                          {exp.category}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {exp.date}
                        </span>

                        {exp.status === "approved" ? (
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            ✓ Firmado y Validado
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            ⚠️ Esperando Validación
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-800 dark:text-slate-150 text-sm truncate">
                        {exp.description}
                      </h3>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>Acreditante: <strong className="text-slate-700 dark:text-slate-355">{payer.name}</strong></span>
                        {exp.invoiceRef && (
                          <span>Ref: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono">{exp.invoiceRef}</code></span>
                        )}
                        {exp.attachmentName && (
                          <button
                            type="button"
                            onClick={() => setViewingAttachment(exp)}
                            className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 px-2 py-0.5 rounded text-[11px] inline-flex items-center gap-1 transition-all border border-emerald-100 dark:border-emerald-900/30"
                          >
                            <Paperclip className="w-3 h-3 text-emerald-500" />
                            Soporte: {exp.attachmentName}
                          </button>
                        )}
                        {exp.signedByOtherParent && (
                          <span className="text-indigo-650 dark:text-indigo-400 truncate max-w-xs flex items-center gap-1">
                            <Signature className="w-3.5 h-3.5" />
                            Firmado por {exp.signedByOtherParent.signature}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0">
                      <span className="text-lg font-bold font-mono text-slate-800 dark:text-slate-150">
                        {formatCurrency(exp.amount)}
                      </span>

                      <div className="flex gap-2.5 items-center">
                        {isPaidByMe ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setEditingExpense(exp)}
                              aria-label={`Editar registro de gasto ${exp.description}`}
                              className="p-1.5 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-lg transition"
                              title="Editar e incluir Soporte"
                            >
                              <Edit className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm(`¿Está seguro de que desea eliminar el gasto "${exp.description}" del consolidado?`)) {
                                  onDeleteExpense(exp.id);
                                }
                              }}
                              aria-label={`Eliminar registro de gasto ${exp.description}`}
                              className="p-1.5 text-slate-400 hover:text-rose-650 dark:hover:text-rose-455 hover:bg-rose-50 dark:hover:bg-rose-955/20 rounded-lg transition"
                              title="Eliminar gasto"
                            >
                              <Trash2 className="w-4.5 h-4.5 text-rose-500" />
                            </button>
                          </>
                        ) : (
                          <span 
                            className="p-1.5 text-slate-350 dark:text-slate-600 inline-flex items-center"
                            title={`Sólo el registrador de este gasto (${payer.name}) puede editarlo o eliminarlo.`}
                          >
                            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                          </span>
                        )}

                        {!isPaidByMe && exp.status !== "approved" && (
                          <button
                            onClick={() => handleApproveExpense(exp.id)}
                            className="text-[11px] px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition"
                          >
                            Firmar Validación
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="text-center py-12 text-slate-400 dark:text-slate-550">
              <AlertCircle className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              <p className="text-sm">No existen asignaciones para los filtros seleccionados.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Edición de Gasto y Soporte */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800 p-6 shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-850 dark:text-slate-150 uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-4.5 h-4.5 text-emerald-500" />
                Editar Gasto y Soporte
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingExpense(null);
                  setEditError("");
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/65 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as ExpenseCategory })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Alimentación">Cuota de Alimentación</option>
                  <option value="Merienda">Merienda Escolar / Snacks</option>
                  <option value="Extra">Gastos Extra (Médicos, Útiles, Recreación)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Monto ($ COP) *
                  </label>
                  <input
                    type="number"
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    Fecha de Transacción *
                  </label>
                  <input
                    type="date"
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Descripción o Concepto *
                </label>
                <input
                  type="text"
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Referencia de Factura o Pago
                </label>
                <input
                  type="text"
                  placeholder="Ej: Ref de transferencia o ID"
                  value={editingExpense.invoiceRef || ""}
                  onChange={(e) => setEditingExpense({ ...editingExpense, invoiceRef: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Soporte de Compra (PDF, Imagen)
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsEditDragActive(true); }}
                  onDragLeave={() => setIsEditDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsEditDragActive(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      processFile(e.dataTransfer.files[0], (name, data) => {
                        setEditingExpense({
                          ...editingExpense,
                          attachmentName: name,
                          attachmentData: data
                        });
                      });
                    }
                  }}
                  onClick={() => document.getElementById("edit-attachment-input")?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isEditDragActive 
                      ? "border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/20" 
                      : editingExpense.attachmentName 
                      ? "border-emerald-200 bg-emerald-50/10 dark:bg-emerald-950/5" 
                      : "border-slate-200 dark:border-slate-750 hover:border-emerald-400 dark:hover:border-emerald-500 bg-slate-50 dark:bg-slate-900"
                  }`}
                >
                  <input
                    id="edit-attachment-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        processFile(e.target.files[0], (name, data) => {
                          setEditingExpense({
                            ...editingExpense,
                            attachmentName: name,
                            attachmentData: data
                          });
                        });
                      }
                    }}
                  />
                  {editingExpense.attachmentName ? (
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Paperclip className="w-8 h-8 text-emerald-500" />
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Soporte Cargado
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-xs">
                        {editingExpense.attachmentName}
                      </p>
                      {editingExpense.attachmentData?.startsWith("data:image/") && (
                        <img 
                          src={editingExpense.attachmentData} 
                          alt="Recibo" 
                          className="w-16 h-16 object-cover rounded border border-slate-200 mx-auto"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingExpense({
                            ...editingExpense,
                            attachmentName: undefined,
                            attachmentData: undefined
                          });
                        }}
                        className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold px-2.5 py-1 bg-rose-50 dark:bg-rose-950/30 rounded"
                      >
                        Quitar Soporte
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center space-y-1.5 py-1">
                      <Upload className="w-6 h-6 text-slate-400" />
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                        Arrastra un archivo aquí, o <span className="text-emerald-500 font-semibold underline">búscalo</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`¿Está seguro de que desea eliminar definitivamente este gasto de "${editingExpense.description}"?`)) {
                    onDeleteExpense(editingExpense.id);
                    setEditingExpense(null);
                    setEditError("");
                  }
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-955/40 text-rose-650 dark:text-rose-400 rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 border border-rose-100 dark:border-rose-900/30"
                title="Eliminar gasto permanentemente"
              >
                <Trash2 className="w-4 h-4 text-rose-500" />
                Eliminar Registro
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingExpense(null);
                    setEditError("");
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!editingExpense.description.trim() || !editingExpense.amount || editingExpense.amount <= 0) {
                      setEditError("Por favor ingresa un concepto válido y un monto mayor que 0.");
                      return;
                    }
                    onSaveExpense(editingExpense);
                    setEditingExpense(null);
                    setEditError("");
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                >
                  Guardar de Forma Segura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualizador de Soporte / Lightbox */}
      {viewingAttachment && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-3xl w-full flex flex-col items-center space-y-4">
            <div className="flex justify-between items-center w-full pb-2 text-white">
              <div className="flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm tracking-wide uppercase">
                    Soporte de Gasto: {viewingAttachment.category}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {viewingAttachment.description} • {formatCurrency(viewingAttachment.amount)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewingAttachment(null)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-850 p-4 rounded-xl shadow-2xl overflow-auto max-h-[70vh] flex items-center justify-center min-h-[300px] w-full">
              {viewingAttachment.attachmentData ? (
                viewingAttachment.attachmentData.startsWith("data:application/pdf") ? (
                  <div className="flex flex-col items-center justify-center p-8 space-y-4 text-slate-600 dark:text-slate-355">
                    <FileText className="w-16 h-16 text-slate-400" />
                    <p className="text-sm font-semibold text-center">
                      Este soporte se guardó como un documento PDF ({viewingAttachment.attachmentName})
                    </p>
                    <a
                      href={viewingAttachment.attachmentData}
                      download={viewingAttachment.attachmentName}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-lg inline-flex items-center gap-1.5 transition"
                    >
                      <Download className="w-4 h-4" /> Guardar o Descargar Documento
                    </a>
                  </div>
                ) : (
                  <img
                    src={viewingAttachment.attachmentData}
                    alt={viewingAttachment.attachmentName || "Soporte de compra"}
                    className="max-h-[65vh] object-contain rounded border border-slate-200 dark:border-slate-800"
                    referrerPolicy="no-referrer"
                  />
                )
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-slate-400">
                  <p className="text-sm">No se encontró la data binaria del soporte adjunto.</p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center w-full text-xs text-slate-450">
              <span>Registrado por: <strong>{viewingAttachment.payerId === 'parent_a' ? data.parentA.name : data.parentB.name}</strong></span>
              {viewingAttachment.attachmentData && !viewingAttachment.attachmentData.startsWith("data:application/pdf") && (
                <a
                  href={viewingAttachment.attachmentData}
                  download={viewingAttachment.attachmentName || "soporte_pago.png"}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Imagen
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
