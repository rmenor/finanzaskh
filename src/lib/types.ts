
export type IncomeCategory = 'congregation' | 'worldwide_work' | 'renovation';

export type TransactionType = 'income' | 'expense' | 'branch_transfer';

export type Transaction = {
  id: string;
  type: TransactionType;
  amount: number;
  date: Date; // Keep as Date for client-side objects
  description: string;
  category?: IncomeCategory;
  sentToBranch?: boolean;
};

// No longer needed, but kept for reference
export type FirestoreTransaction = Omit<Transaction, 'date'> & {
    date: any; 
};
