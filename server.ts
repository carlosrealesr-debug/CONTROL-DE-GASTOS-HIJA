import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { CoparentingData, Message, Expense, VisitEvent, Agreement, Reminder } from "./src/types";

// Database file path
const DB_FILE = path.join(process.cwd(), "db.json");

// Helper function to encrypt message text (simulating ultra-secure E2EE)
function simulateE2EEEncrypt(text: string = ""): string {
  // A simple simulated AES-256 base64 mock encryption for visual demonstration
  const buffer = Buffer.from(text || "", "utf-8");
  return "e2ee::hex_" + buffer.toString("hex");
}

// Initial/Seed Data
const INITIAL_DATA: CoparentingData = {
  parentA: {
    id: "parent_a",
    name: "Carlos Reales",
    email: "carlosrealesr@correo.unicordoba.edu.co",
    role: "Padre"
  },
  parentB: {
    id: "parent_b",
    name: "Stefania Doria Matta",
    email: "stefania@ejemplo.com",
    role: "Madre"
  },
  daughter: {
    name: "MIA ISABELLA REALES DORIA"
  },
  visits: [
    {
      id: "v-1",
      title: "Fin de semana ordinario",
      startDate: "2026-05-29T17:00",
      endDate: "2026-05-31T19:00",
      pickupLocation: "Colegio San José",
      deliveryLocation: "Casa Materna",
      responsibleParentId: "parent_a",
      notes: "Llevar la mochila con ropa deportiva y la merienda favorita.",
      status: "confirmed",
      signedOffMap: {
        parent_a: true,
        parent_b: true
      }
    },
    {
      id: "v-2",
      title: "Recogida escolar semanal",
      startDate: "2026-06-02T16:00",
      endDate: "2026-06-02T20:00",
      pickupLocation: "Colegio San José",
      deliveryLocation: "Casa Materna",
      responsibleParentId: "parent_a",
      notes: "Terapia de lenguaje programada para las 5:00 PM.",
      status: "pending",
      signedOffMap: {
        parent_a: true,
        parent_b: false
      }
    }
  ],
  expenses: [
    {
      id: "exp-1",
      category: "Alimentación",
      description: "Cuota de alimentación mensual - Mayo 2026",
      amount: 250000,
      date: "2026-05-15",
      payerId: "parent_a",
      invoiceRef: "TR-0982-BANCO",
      status: "approved",
      signedByOtherParent: {
        signature: "Stefania Doria Matta",
        timestamp: "2026-05-15T18:30:00Z"
      }
    },
    {
      id: "exp-2",
      category: "Merienda",
      description: "Snacks saludables y meriendas escolares para el mes",
      amount: 45000,
      date: "2026-05-20",
      payerId: "parent_a",
      invoiceRef: "REC-7392-COLSUBSIDIO",
      status: "pending"
    },
    {
      id: "exp-3",
      category: "Extra",
      description: "Consulta Odontopediatría de urgencia (Mía Isabella)",
      amount: 110000,
      date: "2026-05-22",
      payerId: "parent_a",
      invoiceRef: "FAC-8822-ODONTO",
      status: "approved",
      signedByOtherParent: {
        signature: "Stefania Doria Matta",
        timestamp: "2026-05-22T21:15:00Z"
      }
    }
  ],
  messages: [
    {
      id: "m-1",
      senderId: "parent_b",
      text: "Hola Carlos, ¿todo listo para la recogida de Mía Isabella este fin de semana?",
      encryptedText: simulateE2EEEncrypt("Hola Carlos, ¿todo listo para la recogida de Mía Isabella este fin de semana?"),
      timestamp: "2026-05-22T15:30:00Z",
      read: true
    },
    {
      id: "m-2",
      senderId: "parent_a",
      text: "Hola Stefania, sí, ya coordiné todo. La recogeré directamente en el colegio a las 5:00 PM.",
      encryptedText: simulateE2EEEncrypt("Hola Stefania, sí, ya coordiné todo. La recogeré directamente en el colegio a las 5:00 PM."),
      timestamp: "2026-05-22T15:35:00Z",
      read: true
    },
    {
      id: "m-3",
      senderId: "parent_b",
      text: "Excelente. Recuerda llevar su uniforme de fútbol para el sábado por la mañana.",
      encryptedText: simulateE2EEEncrypt("Excelente. Recuerda llevar su uniforme de fútbol para el sábado por la mañana."),
      timestamp: "2026-05-22T15:38:00Z",
      read: true
    },
    {
      id: "m-4",
      senderId: "parent_a",
      text: "Entendido, ya lo tengo empacado con sus guayos. Saludos.",
      encryptedText: simulateE2EEEncrypt("Entendido, ya lo tengo empacado con sus guayos. Saludos."),
      timestamp: "2026-05-22T15:40:00Z",
      read: true
    }
  ],
  agreements: [],
  reminders: [
    {
      id: "rem-1",
      title: "Fecha límite: Cuota de Alimentación de Junio",
      description: "Registrar y pagar el aporte de alimentación mensual correspondiente al mes de Junio.",
      dueDate: "2026-06-05T12:00",
      category: "Gasto",
      isRead: false,
      completed: false
    },
    {
      id: "rem-2",
      title: "Fin de Semana Ordinario con Papá",
      description: "Recogida de Mía Isabella en el Colegio San José este viernes a las 5:00 PM.",
      dueDate: "2026-05-29T17:00",
      category: "Visita",
      isRead: false,
      completed: false
    }
  ]
};

// Database read/write helpers
function readDB(): CoparentingData {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(content);
    } else {
      writeDB(INITIAL_DATA);
      return INITIAL_DATA;
    }
  } catch (error) {
    console.error("Error reading DB file, returning initial template:", error);
    return INITIAL_DATA;
  }
}

function writeDB(data: CoparentingData) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error writing DB file:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Standard JSON middleware with high body limit for base64 file attachments/signatures
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Log all API requests for trace debugging
  app.use((req, res, next) => {
    console.log(`[API ${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // REST Interface API Endpoints

  // Get complete application state
  app.get("/api/data", (req, res) => {
    const data = readDB();
    res.json(data);
  });

  // Save/Overwrite whole datasets (Backup restore)
  app.post("/api/data/restore", (req, res) => {
    const data = req.body;
    if (data && data.parentA && data.visits && data.expenses) {
      writeDB(data);
      res.json({ success: true, message: "Datos restaurados correctamente.", data });
    } else {
      res.status(400).json({ error: "Datos de restauración inválidos." });
    }
  });

  // Update parent/daughter profile names
  app.post("/api/profile/update", (req, res) => {
    const { parentA_name, parentB_name, daughter_name } = req.body;
    const db = readDB();
    if (parentA_name) db.parentA.name = parentA_name;
    if (parentB_name) db.parentB.name = parentB_name;
    if (daughter_name) db.daughter.name = daughter_name;
    writeDB(db);
    res.json({ success: true, data: db });
  });

  // Add a new message (Simulated dynamic parental messaging)
  app.post("/api/messages", (req, res) => {
    const { senderId, text, attachmentName, attachmentData, voiceNoteData, voiceNoteDuration } = req.body;
    if (!senderId) {
      return res.status(400).json({ error: "Falta el parámetro senderId." });
    }
    if (!text && !attachmentData && !voiceNoteData) {
      return res.status(400).json({ error: "Faltan parámetros de contenido en el mensaje." });
    }

    const db = readDB();
    const newMessage: Message = {
      id: "m-" + Date.now(),
      senderId,
      text: text || "",
      encryptedText: simulateE2EEEncrypt(text || ""),
      timestamp: new Date().toISOString(),
      read: false,
      attachmentName,
      attachmentData,
      voiceNoteData,
      voiceNoteDuration
    };

    db.messages.push(newMessage);
    writeDB(db);
    res.status(201).json(newMessage);
  });

  // Mark all messages as read
  app.post("/api/messages/read-all", (req, res) => {
    const db = readDB();
    db.messages = db.messages.map(msg => ({ ...msg, read: true }));
    writeDB(db);
    res.json({ success: true });
  });

  // Add/Update Expense
  app.post("/api/expenses", (req, res) => {
    const expenseData = req.body;
    const db = readDB();

    if (!expenseData.id) {
      // Create mode
      const newExpense: Expense = {
        id: "exp-" + Date.now(),
        category: expenseData.category || "Extra",
        description: expenseData.description || "Gasto sin descripción",
        amount: Number(expenseData.amount) || 0,
        date: expenseData.date || new Date().toISOString().split("T")[0],
        payerId: expenseData.payerId || "parent_a",
        invoiceRef: expenseData.invoiceRef || "",
        attachmentName: expenseData.attachmentName || undefined,
        attachmentData: expenseData.attachmentData || undefined,
        status: expenseData.status || "pending"
      };
      db.expenses.push(newExpense);
      writeDB(db);
      res.status(201).json(newExpense);
    } else {
      // Edit/Update mode
      const idx = db.expenses.findIndex(e => e.id === expenseData.id);
      if (idx !== -1) {
        db.expenses[idx] = {
          ...db.expenses[idx],
          ...expenseData,
          amount: Number(expenseData.amount) || db.expenses[idx].amount
        };
        writeDB(db);
        res.json(db.expenses[idx]);
      } else {
        res.status(404).json({ error: "Gasto no encontrado." });
      }
    }
  });

  // Delete Expense
  app.delete("/api/expenses/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.expenses.length;
    db.expenses = db.expenses.filter(e => e.id !== id);
    if (db.expenses.length < initialLen) {
      writeDB(db);
      res.json({ success: true, message: "Gasto eliminado correctamente." });
    } else {
      res.status(404).json({ error: "Gasto no encontrado." });
    }
  });

  // Add/Update Visit Event
  app.post("/api/visits", (req, res) => {
    const visitData = req.body;
    const db = readDB();

    if (!visitData.id) {
      const newVisit: VisitEvent = {
        id: "v-" + Date.now(),
        title: visitData.title || "Intercambio",
        startDate: visitData.startDate || new Date().toISOString(),
        endDate: visitData.endDate || new Date().toISOString(),
        pickupLocation: visitData.pickupLocation || "Casa",
        deliveryLocation: visitData.deliveryLocation || "Casa",
        responsibleParentId: visitData.responsibleParentId || "parent_a",
        notes: visitData.notes || "",
        status: visitData.status || "pending",
        creatorId: visitData.creatorId,
        signedOffMap: visitData.signedOffMap || { parent_a: false, parent_b: false },
        signatures: visitData.signatures || { parent_a: "", parent_b: "" }
      };
      db.visits.push(newVisit);
      writeDB(db);
      res.status(201).json(newVisit);
    } else {
      const idx = db.visits.findIndex(v => v.id === visitData.id);
      if (idx !== -1) {
        db.visits[idx] = {
          ...db.visits[idx],
          ...visitData
        };
        writeDB(db);
        res.json(db.visits[idx]);
      } else {
        res.status(404).json({ error: "Visita no encontrada." });
      }
    }
  });

  // Delete Visit Event
  app.delete("/api/visits/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.visits.length;
    db.visits = db.visits.filter(v => v.id !== id);
    if (db.visits.length < initialLen) {
      writeDB(db);
      res.json({ success: true, message: "Visita eliminada correctamente." });
    } else {
      res.status(404).json({ error: "Visita no encontrada." });
    }
  });

  // Toggle agreement signature
  app.post("/api/agreements/sign", (req, res) => {
    const { agreementId, parentId, signatureName } = req.body;
    if (!agreementId || !parentId || !signatureName) {
      return res.status(400).json({ error: "Parámetros incompletos de firma." });
    }

    const db = readDB();
    const idx = db.agreements.findIndex(a => a.id === agreementId);
    if (idx === -1) {
      return res.status(404).json({ error: "Acuerdo no encontrado." });
    }

    const agr = db.agreements[idx];
    const hash = "e2ee::hash_" + Math.random().toString(16).slice(2, 10) + "_" + Date.now().toString(16);

    const signatureBlock = {
      name: signatureName,
      timestamp: new Date().toISOString(),
      hash: hash
    };

    if (parentId === "parent_a") {
      agr.signatureA = signatureBlock;
    } else {
      agr.signatureB = signatureBlock;
    }

    // Evaluate status
    if (agr.signatureA && agr.signatureB) {
      agr.status = "signed";
    } else if (agr.signatureA) {
      agr.status = "pending_parent_b";
    } else if (agr.signatureB) {
      agr.status = "pending_parent_a";
    }

    db.agreements[idx] = agr;
    writeDB(db);
    res.json(agr);
  });

  // Add/Update Agreement document
  app.post("/api/agreements", (req, res) => {
    const agrData = req.body;
    const db = readDB();

    if (!agrData.id) {
      const newAgr: Agreement = {
        id: "agr-" + Date.now(),
        title: agrData.title || "Nuevo Acuerdo",
        description: agrData.description || "",
        category: agrData.category || "General",
        dateCreated: new Date().toISOString().split("T")[0],
        status: "draft",
        creatorId: agrData.creatorId
      };
      db.agreements.push(newAgr);
      writeDB(db);
      res.status(201).json(newAgr);
    } else {
      const idx = db.agreements.findIndex(a => a.id === agrData.id);
      if (idx !== -1) {
        db.agreements[idx] = {
          ...db.agreements[idx],
          ...agrData
        };
        writeDB(db);
        res.json(db.agreements[idx]);
      } else {
        res.status(404).json({ error: "Acuerdo no encontrado." });
      }
    }
  });

  // Delete Agreement
  app.delete("/api/agreements/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const initialLen = db.agreements.length;
    db.agreements = db.agreements.filter(a => a.id !== id);
    if (db.agreements.length < initialLen) {
      writeDB(db);
      res.json({ success: true, id });
    } else {
      res.status(404).json({ error: "Acuerdo no encontrado." });
    }
  });

  // Reminders / Alerts Toggle Complete
  app.post("/api/reminders/toggle", (req, res) => {
    const { id } = req.body;
    const db = readDB();
    const idx = db.reminders.findIndex(r => r.id === id);
    if (idx !== -1) {
      db.reminders[idx].completed = !db.reminders[idx].completed;
      writeDB(db);
      res.json(db.reminders[idx]);
    } else {
      res.status(404).json({ error: "Recordatorio no encontrado." });
    }
  });

  // Create new Reminder
  app.post("/api/reminders", (req, res) => {
    const remData = req.body;
    const db = readDB();
    const newRem: Reminder = {
      id: "rem-" + Date.now(),
      title: remData.title || "Recordatorio",
      description: remData.description || "",
      dueDate: remData.dueDate || new Date().toISOString(),
      category: remData.category || "Gasto",
      isRead: false,
      completed: false
    };
    db.reminders.push(newRem);
    writeDB(db);
    res.status(201).json(newRem);
  });

  // Check if server is running inside the environment's production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

startServer();
