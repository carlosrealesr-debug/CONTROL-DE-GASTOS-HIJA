import React, { useState, useEffect } from "react";
import { CoparentingData, ParentId, Agreement } from "../types";
import { 
  FileCheck, 
  Plus, 
  Trash, 
  Fingerprint, 
  ShieldCheck, 
  AlertCircle, 
  PenTool, 
  Calendar,
  Compass,
  Download,
  Lock
} from "lucide-react";

interface AgreementPanelProps {
  data: CoparentingData;
  activeParentId: ParentId;
  onSignAgreement: (agreementId: string, signatureName: string) => void;
  onSaveAgreement: (agreement: Partial<Agreement>) => void;
  onDeleteAgreement: (id: string) => void;
  textSizeClass: string;
}

export default function AgreementPanel({
  data,
  activeParentId,
  onSignAgreement,
  onSaveAgreement,
  onDeleteAgreement,
  textSizeClass
}: AgreementPanelProps) {
  const activeParent = activeParentId === "parent_a" ? data.parentA : data.parentB;
  const otherParent = activeParentId === "parent_a" ? data.parentB : data.parentA;

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Agreement["category"]>("General");
  const [signatureName, setSignatureName] = useState(activeParent.name);
  const [formError, setFormError] = useState("");

  // Load new agreement draft from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem("coparenting_draft_agreement");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.title) setTitle(parsed.title);
        if (parsed.description) setDescription(parsed.description);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.signatureName) setSignatureName(parsed.signatureName);
        if (parsed.title || parsed.description) {
          setShowAddForm(true);
        }
      } catch (e) {
        console.error("Error loading agreement draft:", e);
      }
    }
  }, []);

  // Save new agreement draft to localStorage as fields change
  useEffect(() => {
    const draft = { title, description, category, signatureName };
    if (title || description) {
      localStorage.setItem("coparenting_draft_agreement", JSON.stringify(draft));
    } else {
      localStorage.removeItem("coparenting_draft_agreement");
    }
  }, [title, description, category, signatureName]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!title.trim() || !description.trim()) {
      setFormError("Por favor completa todos los campos.");
      return;
    }

    onSaveAgreement({
      title,
      description,
      category,
      status: "draft",
      creatorId: activeParentId
    });

    setTitle("");
    setDescription("");
    setShowAddForm(false);
    localStorage.removeItem("coparenting_draft_agreement");
  };

  const handleSigningAction = (agreementId: string) => {
    if (!signatureName.trim()) {
      alert("Por favor ingresa tu nombre completo para rubricar la firma digital.");
      return;
    }
    onSignAgreement(agreementId, signatureName);
  };

  // Helper function to export agreements into high-fidelity printable agreement sheets
  const handleExportAgreementPDF = (agr: Agreement) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Por favor habilita las ventanas emergentes para poder exportar.");
      return;
    }

    const stateDesc = agr.status === "signed" ? "CONVENIO CON VALIDACIÓN JURÍDICA" : "ACUERDO PARCIAL - PENDIENTE DE FIRMA";

    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado de Acuerdo Coparental - ${agr.title}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #6366f1; padding-bottom: 20px; }
            .badge { display: inline-block; padding: 5px 15px; color: white; background-color: #6366f1; border-radius: 20px; font-size: 11px; font-weight: bold; margin-bottom: 15px; }
            .date-block { font-size: 11px; color: #64748b; margin-bottom: 25px; }
            .desc { border: 1px solid #e2e8f0; padding: 25px; border-radius: 8px; background-color: #f8fafc; margin-bottom: 35px; white-space: pre-line; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .sig-block { width: 45%; border-top: 1px solid #94a3b8; padding-top: 15px; text-align: center; }
            .sig-value { font-family: monospace; font-size: 9px; color: #64748b; word-break: break-all; margin-top: 10px; background: #f1f5f9; padding: 6px; }
            .footer { margin-top: 80px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <span class="badge">${stateDesc}</span>
            <h1 style="margin: 0; font-size: 22px; color: #1e1b4b;">ACUERDO DE CONVIVENCIA Y COPARENTALIDAD MUTUA</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569;">Bajo amparo del mutuo consentimiento familiar</p>
          </div>

          <div class="date-block">
            <strong>Identificación del Acuerdo:</strong> AGR-${agr.id}<br>
            <strong>Hija Beneficiaria:</strong> ${data.daughter.name}<br>
            <strong>Categoría:</strong> ${agr.category}<br>
            <strong>Fecha de Creación:</strong> ${agr.dateCreated}
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase;">Cláusula de Entendimiento: "${agr.title}"</h3>
          <div class="desc">
            ${agr.description}
          </div>

          <h3 style="font-size: 14px; text-transform: uppercase;">Acreditación y Firmas Digitales</h3>
          <p style="font-size: 11px; color: #64748b; margin-bottom: 30px;">
            Las partes declaran de propia voluntad estar conformes con lo redactado arriba y ratifican el acuerdo mediante validación digital en tiempo real:
          </p>

          <div class="signatures">
            <div class="sig-block">
              <strong>${data.parentA.name}</strong><br>
              <span style="font-size: 10px; color: #64748b;">${data.parentA.role}</span>
              ${agr.signatureA ? `
                <div style="color: #10b981; font-size: 11px; font-weight: bold; margin-top: 10px;">✓ Validado con Firma Digital</div>
                <div style="font-size: 9px; color: #64748b;">Fecha: ${new Date(agr.signatureA.timestamp).toLocaleString()}</div>
                <div class="sig-value">SHA-256 HASH:<br>${agr.signatureA.hash}</div>
              ` : `
                <div style="color: #ef4444; font-size: 11px; font-weight: bold; margin-top: 10px;">❌ Pendiente de firma</div>
              `}
            </div>

            <div class="sig-block">
              <strong>${data.parentB.name}</strong><br>
              <span style="font-size: 10px; color: #64748b;">${data.parentB.role}</span>
              ${agr.signatureB ? `
                <div style="color: #10b981; font-size: 11px; font-weight: bold; margin-top: 10px;">✓ Validado con Firma Digital</div>
                <div style="font-size: 9px; color: #64748b;">Fecha: ${new Date(agr.signatureB.timestamp).toLocaleString()}</div>
                <div class="sig-value">SHA-256 HASH:<br>${agr.signatureB.hash}</div>
              ` : `
                <div style="color: #ef4444; font-size: 11px; font-weight: bold; margin-top: 10px;">❌ Pendiente de firma</div>
              `}
            </div>
          </div>

          <div class="footer">
            Este acuerdo ha sido generado y firmado digitalmente en el panel 'Control de Coparentalidad' bajo cifrado inmutable para resguardo de la privacidad familiar.
          </div>

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
      {/* Cabecera del Módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-purple-500" />
            Consenso Familiar & Gestión de Acuerdos
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Redacta cláusulas mutuas en torno a educación, salud y custodia. Firma digitalmente para dar validez en tiempo real.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-550 dark:hover:bg-purple-650 text-white font-medium text-xs px-4 py-2 rounded-xl shadow-sm transition inline-flex items-center gap-1.5 self-start md:self-auto"
        >
          <PenTool className="w-4 h-4" /> Registrar Propuesta de Acuerdo
        </button>
      </div>

      {/* Formulario Agregar Propuesta */}
      {showAddForm && (
        <div className="bg-white dark:bg-slate-850 rounded-2xl border border-purple-150 dark:border-slate-800/80 p-6 shadow-md transition-all">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-150 mb-4 uppercase tracking-wider">
            Propuesta de Nuevo Acuerdo Parental
          </h3>

          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/60 rounded-xl flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Título del Acuerdo *
                </label>
                <input
                  type="text"
                  placeholder="Ej: Autorización Salida de País"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Categoría Jurídica *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Agreement["category"])}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="General">General / Convivencia</option>
                  <option value="Custodia">Custodia y Régimen Visitas</option>
                  <option value="Educación">Educación y Actividades</option>
                  <option value="Salud">Salud y Medicamentos</option>
                  <option value="Finanzas">Manutención y Finanzas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Cláusulas de Entendimiento (Escribe detalladamente cada pacto) *
              </label>
              <textarea
                rows={6}
                placeholder="Por el presente documento, ambos progenitores declaran..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-750 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500 leading-relaxed"
              />
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
                className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-650 hover:bg-purple-750 text-white shadow-sm transition"
              >
                Registrar Acuerdo Borrador
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Acuerdos */}
      <div className="space-y-4">
        {data.agreements.length > 0 ? (
          data.agreements
            .slice()
            .sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime())
            .map((agr) => {
              const signatureMe = activeParentId === "parent_a" ? agr.signatureA : agr.signatureB;
              const hasMeSigned = !!signatureMe;
              const isCreator = !agr.creatorId || agr.creatorId === activeParentId;
              const creatorName = agr.creatorId ? (agr.creatorId === "parent_a" ? data.parentA.name : data.parentB.name) : "Sistema / Ambos";

              return (
                <div 
                  key={agr.id} 
                  className="bg-white dark:bg-slate-850 rounded-2xl border border-slate-150 dark:border-slate-800/80 shadow-sm p-5 md:p-6 space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded">
                          {agr.category}
                        </span>

                        <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5" />
                          Creado: {agr.dateCreated}
                        </span>

                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 px-2.5 py-0.5 rounded-full font-sans font-medium flex items-center gap-1">
                          <Compass className="w-3 h-3 text-slate-400" />
                          Autor: {creatorName}
                        </span>

                        {agr.status === "signed" ? (
                          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-650 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Firmado Mutuamente
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            ⚠️ Pendiente Firma Digital
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-850 dark:text-slate-150">
                        {agr.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleExportAgreementPDF(agr)}
                        className="p-2 border border-slate-200 dark:border-slate-750 text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition inline-flex items-center gap-1 text-xs font-bold"
                      >
                        <Download className="w-4 h-4" /> Exportar Copia PDF
                      </button>

                      {isCreator ? (
                        <button
                          onClick={() => {
                            if (window.confirm(`¿Está seguro de que desea eliminar definitivamente el acuerdo o evento "${agr.title}"?`)) {
                              onDeleteAgreement(agr.id);
                            }
                          }}
                          className="p-2 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition inline-flex items-center gap-1 text-xs font-bold"
                          title="Eliminar acuerdo permanentemente"
                        >
                          <Trash className="w-4 h-4 text-rose-500" /> Eliminar
                        </button>
                      ) : (
                        <span 
                          className="p-2 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-xl inline-flex items-center gap-1 text-xs font-semibold cursor-not-allowed inline-flex items-center gap-1"
                          title={`Sólo el creador (${creatorName}) puede realizar los ajustes necesarios sobre este acuerdo.`}
                        >
                          <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Sólo Creador
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cuerpo Descripción Cláusula */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {agr.description}
                  </div>

                  {/* Bloques de rubricas digitales parentales */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Padre A */}
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-800 dark:text-slate-200">{data.parentA.name} ({data.parentA.role})</strong>
                        {agr.signatureA ? (
                          <span className="text-emerald-550 dark:text-emerald-450 font-bold flex items-center gap-1">✓ Validado</span>
                        ) : (
                          <span className="text-rose-500 font-bold">Sin firmar</span>
                        )}
                      </div>
                      {agr.signatureA ? (
                        <>
                          <p className="text-[10px] text-slate-500 dark:text-slate-450">Digitalizado: {new Date(agr.signatureA.timestamp).toLocaleString("es-CO")}</p>
                          <p className="text-[9px] font-mono bg-white dark:bg-slate-850 p-1.5 border border-slate-150 dark:border-slate-800 rounded text-slate-500 truncate select-all dark:text-slate-400">
                            Firma SHA-256: {agr.signatureA.hash}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-400">Esperando validación biométrica/digital.</p>
                      )}
                    </div>

                    {/* Padre B */}
                    <div className="p-3 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <strong className="text-slate-800 dark:text-slate-200">{data.parentB.name} ({data.parentB.role})</strong>
                        {agr.signatureB ? (
                          <span className="text-emerald-550 dark:text-emerald-450 font-bold flex items-center gap-1">✓ Validado</span>
                        ) : (
                          <span className="text-rose-500 font-bold">Sin firmar</span>
                        )}
                      </div>
                      {agr.signatureB ? (
                        <>
                          <p className="text-[10px] text-slate-500 dark:text-slate-450">Digitalizado: {new Date(agr.signatureB.timestamp).toLocaleString("es-CO")}</p>
                          <p className="text-[9px] font-mono bg-white dark:bg-slate-850 p-1.5 border border-slate-150 dark:border-slate-800 rounded text-slate-500 truncate select-all dark:text-slate-400">
                            Firma SHA-256: {agr.signatureB.hash}
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] text-slate-400">Esperando validación de la madre.</p>
                      )}
                    </div>

                  </div>

                  {/* Acción del Parent activo para Firmar */}
                  {!hasMeSigned && agr.status !== "signed" && (
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 p-4 bg-purple-500/5 dark:bg-purple-950/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Validar este acuerdo formalmente:</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">El rubricado inscribe su nombre completo como declaración electrónica.</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          aria-label="Nombre completo para rúbrica electrónica"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="Tu firma digital formal"
                          className="p-2 border border-slate-200 dark:border-slate-750 text-xs rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                        <button
                          onClick={() => handleSigningAction(agr.id)}
                          className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 transition"
                        >
                          <PenTool className="w-3.5 h-3.5" />
                          Dar Rúbrica Digital
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-550 bg-white dark:bg-slate-850 border border-dashed border-slate-250 dark:border-slate-800 rounded-2xl">
            <Fingerprint className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-sm">No existen propuestas de acuerdos parentales de mutuo acuerdo registradas.</p>
          </div>
        )}
      </div>
    </div>
  );
}
