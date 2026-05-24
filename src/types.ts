export type ParentId = 'parent_a' | 'parent_b';

export interface Parent {
  id: ParentId;
  name: string;
  email: string;
  role: 'Madre' | 'Padre';
}

export interface Daughter {
  name: string;
  birthDate?: string;
}

export interface VisitEvent {
  id: string;
  title: string;
  startDate: string; // ISO format YYYY-MM-DDTHH:mm
  endDate: string; // ISO format YYYY-MM-DDTHH:mm
  pickupLocation: string;
  deliveryLocation: string;
  responsibleParentId: ParentId;
  notes?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  creatorId?: ParentId;
  signedOffMap?: {
    parent_a?: boolean;
    parent_b?: boolean;
  };
  signatures?: {
    parent_a?: string; // Base64 signature image drawn on canvas
    parent_b?: string; // Base64 signature image drawn on canvas
  };
}

export type ExpenseCategory = 'Alimentación' | 'Merienda' | 'Extra';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  payerId: ParentId;
  invoiceRef?: string;
  status: 'pending' | 'approved' | 'rejected';
  signedByOtherParent?: {
    signature?: string;
    timestamp?: string;
  };
  attachmentName?: string;
  attachmentData?: string;
}

export interface Message {
  id: string;
  senderId: ParentId;
  text: string;
  encryptedText: string; // showing simulated End-to-End Encryption
  timestamp: string; // ISO format
  read: boolean;
  attachmentName?: string;
  attachmentData?: string;
  voiceNoteData?: string;
  voiceNoteDuration?: number;
}

export interface Agreement {
  id: string;
  title: string;
  description: string;
  category: 'Educación' | 'Salud' | 'Finanzas' | 'Custodia' | 'General';
  dateCreated: string;
  status: 'draft' | 'pending_parent_a' | 'pending_parent_b' | 'signed';
  creatorId?: ParentId;
  signatureA?: {
    name: string;
    timestamp: string;
    hash: string;
  };
  signatureB?: {
    name: string;
    timestamp: string;
    hash: string;
  };
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DDTHH:mm or YYYY-MM-DD
  category: 'Gasto' | 'Visita' | 'Acuerdo' | 'Salud' | 'Escuela';
  isRead: boolean;
  completed: boolean;
}

export interface CoparentingData {
  parentA: Parent;
  parentB: Parent;
  daughter: Daughter;
  visits: VisitEvent[];
  expenses: Expense[];
  messages: Message[];
  agreements: Agreement[];
  reminders: Reminder[];
}
