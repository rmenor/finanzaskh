
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Transaction } from './types';

// In-memory mock database moved directly into actions.ts
let transactions: Transaction[] = [
    { 
      id: '1', 
      type: 'income', 
      amount: 1250.75, 
      date: new Date('2024-07-15'), 
      description: 'Donaciones del mes - Caja A', 
      category: 'congregation',
      sentToBranch: false,
    },
    { 
      id: '2', 
      type: 'income', 
      amount: 350.00, 
      date: new Date('2024-07-20'), 
      description: 'Donación Obra Mundial', 
      category: 'worldwide_work',
      sentToBranch: true,
    },
    { 
      id: '3', 
      type: 'expense', 
      amount: 85.50, 
      date: new Date('2024-07-22'), 
      description: 'Factura de electricidad', 
    },
    { 
      id: '4', 
      type: 'income', 
      amount: 150.00, 
      date: new Date('2024-08-05'), 
      description: 'Donación para renovación', 
      category: 'renovation',
      sentToBranch: false,
    },
    { 
      id: '5', 
      type: 'income', 
      amount: 400.00, 
      date: new Date('2024-08-10'), 
      description: 'Donación Obra Mundial (electrónico)', 
      category: 'worldwide_work',
      sentToBranch: false,
    },
    {
      id: '6',
      type: 'branch_transfer',
      amount: 350.00,
      date: new Date('2024-07-28'),
      description: 'Envío a sucursal - Julio',
    },
    { 
      id: '7', 
      type: 'expense', 
      amount: 210.00, 
      date: new Date('2024-08-18'), 
      description: 'Material de limpieza', 
    },
    // ---- START 2025 DATA ----
    { 
        id: '8', 
        type: 'income', 
        amount: 1300.00, 
        date: new Date('2025-01-15'), 
        description: 'Donaciones Enero', 
        category: 'congregation',
        sentToBranch: false,
    },
    { 
        id: '9', 
        type: 'expense', 
        amount: 100.00, 
        date: new Date('2025-01-20'), 
        description: 'Factura de agua', 
    },
    { 
        id: '10', 
        type: 'income', 
        amount: 250.00, 
        date: new Date('2025-01-25'), 
        description: 'Donación Obra Mundial', 
        category: 'worldwide_work',
        sentToBranch: false,
    }
    // ---- END 2025 DATA ----
];

// Helper functions are now local to this file and not exported.
const generateId = () => String(Date.now() + Math.random());

const getTransactions = (): Transaction[] => {
    // Return a deep copy to prevent mutation of the original data.
    // JSON stringify/parse converts Dates to ISO strings.
    const transactionsAsStrings = JSON.parse(JSON.stringify(transactions));
    // We must convert the date strings back to Date objects.
    return transactionsAsStrings.map((t: any) => ({
        ...t,
        date: new Date(t.date),
    }));
};

const addTransaction = (transaction: Omit<Transaction, 'id'>): void => {
    const newTransaction: Transaction = {
        id: generateId(),
        ...transaction,
    };
    transactions.unshift(newTransaction);
};


const updateTransaction = (id: string, data: Partial<Transaction>): void => {
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        // Ensure the date is a Date object before merging.
        const updatedData = { ...data };
        if (typeof data.date === 'string') {
            updatedData.date = new Date(data.date);
        }
        transactions[index] = { ...transactions[index], ...updatedData };
    }
};

const markTransactionsAsSent = (transactionIds: string[]): void => {
    transactions = transactions.map(t => {
        if (transactionIds.includes(t.id)) {
            return { ...t, sentToBranch: true };
        }
        return t;
    });
};
// End of in-memory database logic

const IncomeSchema = z.object({
  amount: z.coerce.number().positive({ message: 'La cantidad debe ser un número positivo.' }),
  date: z.string().min(1, { message: 'La fecha es obligatoria.' }),
  description: z.string().max(100, { message: 'La descripción debe tener 100 caracteres o menos.' }).optional(),
  category: z.enum(['congregation', 'worldwide_work', 'renovation'], {
    errorMap: () => ({ message: 'Por favor, selecciona una categoría válida.' }),
  }),
});

const ExpenseSchema = z.object({
  amount: z.coerce.number().positive({ message: 'La cantidad debe ser un número positivo.' }),
  date: z.string().min(1, { message: 'La fecha es obligatoria.' }),
  description: z.string().max(100, { message: 'La descripción debe tener 100 caracteres o menos.' }).optional(),
});

const BranchTransferSchema = z.object({
  amount: z.coerce.number().positive({ message: 'La cantidad debe ser mayor que cero.' }),
  date: z.string().min(1, { message: 'La fecha es obligatoria.' }),
  description: z.string().max(100, { message: 'La descripción debe tener 100 caracteres o menos.' }).optional(),
  transactionIds: z.array(z.string()).min(1, { message: 'Debes seleccionar al menos una transacción.' }),
});

const UpdateTransactionSchema = z.object({
    id: z.string(),
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().positive({ message: 'La cantidad debe ser un número positivo.' }),
    date: z.string().min(1, { message: 'La fecha es obligatoria.' }),
    description: z.string().max(100, { message: 'La descripción debe tener 100 caracteres o menos.' }).optional(),
    category: z.enum(['congregation', 'worldwide_work', 'renovation']).optional(),
    sentToBranch: z.boolean().optional(),
});

export async function addIncomeAction(data: z.infer<typeof IncomeSchema>) {
  const validatedFields = IncomeSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: 'Datos inválidos.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  try {
    addTransaction({
        type: 'income',
        amount: validatedFields.data.amount,
        date: new Date(validatedFields.data.date),
        description: validatedFields.data.description || '',
        category: validatedFields.data.category,
        sentToBranch: false,
    });
    revalidatePath('/');
    return { success: true, message: 'Ingreso añadido correctamente.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Error al añadir el ingreso.' };
  }
}

export async function addExpenseAction(data: z.infer<typeof ExpenseSchema>) {
  const validatedFields = ExpenseSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: 'Datos inválidos.', errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    addTransaction({ 
        type: 'expense',
        amount: validatedFields.data.amount,
        date: new Date(validatedFields.data.date),
        description: validatedFields.data.description || '',
     });
    revalidatePath('/');
    return { success: true, message: 'Gasto añadido correctamente.' };
  } catch (e: any) {
    return { success: false, message: e.message || 'Error al añadir el gasto.' };
  }
}

export async function addBranchTransferAction(data: z.infer<typeof BranchTransferSchema>) {
    const validatedFields = BranchTransferSchema.safeParse(data);
  
    if (!validatedFields.success) {
      return { success: false, message: 'Datos inválidos.', errors: validatedFields.error.flatten().fieldErrors };
    }
  
    try {
      const { amount, date, description, transactionIds } = validatedFields.data;

      markTransactionsAsSent(transactionIds);
      addTransaction({ 
        amount, 
        date: new Date(date), 
        type: 'branch_transfer', 
        description: description || 'Envío a la sucursal',
      });

      revalidatePath('/');
      return { success: true, message: 'Envío a la sucursal añadido correctamente.' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Error al añadir el envío a la sucursal.' };
    }
  }

export async function updateTransactionAction(data: z.infer<typeof UpdateTransactionSchema>) {
    const validatedFields = UpdateTransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, message: 'Datos inválidos.', errors: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const { id, ...rest } = validatedFields.data;
        
        const transactionData: Partial<Transaction> = {
            ...rest,
            date: new Date(rest.date), // CRITICAL: Ensure date is a Date object before saving
            description: rest.description || '',
        };

        updateTransaction(id, transactionData);
        revalidatePath('/');
        return { success: true, message: 'Transacción actualizada correctamente.' };
    } catch (e: any) {
        const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `Error al actualizar la transacción: ${message}` };
    }
}


export async function getTransactionsAction() {
    try {
        const transactionsData = getTransactions();
        // The dates in our mock data are Dates, but they need to be serialized for the client.
        const serializedTransactions = transactionsData.map(t => ({
            ...t,
            date: t.date.toISOString(),
        }));
        
        return { success: true, data: serializedTransactions };
    } catch(e: any) {
        const errorMessage = e instanceof Error ? e.message : String(e);
        return { success: false, message: `Error al obtener los datos: ${errorMessage}` };
    }
}
