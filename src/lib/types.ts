
import { Timestamp } from 'firebase/firestore';

export type IncomeCategory = 'congregation' | 'worldwide_work' | 'renovation';

export type TransactionType = 'income' | 'expense' | 'branch_transfer';

export type TransactionStatus = 'Completado' | 'Pendiente de envío' | 'Enviado';

// This is the type for client-side objects, using native Date
export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date;
  description: string;
  category?: IncomeCategory;
  status?: TransactionStatus;
};

// This is the type for objects coming from Firestore, using Timestamp
export type FirestoreTransaction = Omit<Transaction, 'id' | 'date'> & {
    date: Timestamp; 
};
