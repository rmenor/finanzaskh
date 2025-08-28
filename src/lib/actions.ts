
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { db } from './firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  writeBatch,
  Timestamp,
  deleteDoc,
} from 'firebase/firestore';
import type { TransactionStatus } from './types';

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
    status: z.enum(['Completado', 'Pendiente de envío', 'Enviado']).optional(),
});

const DeleteTransactionSchema = z.object({
    id: z.string().min(1, { message: 'El ID de la transacción es obligatorio.' }),
});

export async function addIncomeAction(data: z.infer<typeof IncomeSchema>) {
  const validatedFields = IncomeSchema.safeParse(data);

  if (!validatedFields.success) {
    return { success: false, message: 'Datos inválidos.', errors: validatedFields.error.flatten().fieldErrors };
  }
  
  if (!db) {
    return { success: false, message: 'La base de datos no está disponible.' };
  }

  try {
    const { amount, date, description, category } = validatedFields.data;

    let status: TransactionStatus;
    if (category === 'congregation') {
        status = 'Completado';
    } else {
        status = 'Pendiente de envío';
    }

    await addDoc(collection(db, 'transactions'), {
        type: 'income',
        amount,
        date: Timestamp.fromDate(new Date(date)),
        description: description || '',
        category,
        status,
    });
    revalidatePath('/dashboard');
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

  if (!db) {
    return { success: false, message: 'La base de datos no está disponible.' };
  }

  try {
    const { amount, date, description } = validatedFields.data;
    await addDoc(collection(db, 'transactions'), {
        type: 'expense',
        amount,
        date: Timestamp.fromDate(new Date(date)),
        description: description || '',
        status: 'Completado',
     });
    revalidatePath('/dashboard');
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

    if (!db) {
      return { success: false, message: 'La base de datos no está disponible.' };
    }
  
    try {
      const { amount, date, description, transactionIds } = validatedFields.data;
      
      const batch = writeBatch(db);

      // Mark selected transactions as sent
      transactionIds.forEach(id => {
          const docRef = doc(db, 'transactions', id);
          batch.update(docRef, { status: 'Enviado' });
      });

      // Add the new branch_transfer transaction
      const newTransferRef = doc(collection(db, 'transactions'));
      batch.set(newTransferRef, {
        amount, 
        date: Timestamp.fromDate(new Date(date)), 
        type: 'branch_transfer', 
        description: description || 'Envío a la sucursal',
        status: 'Completado',
      });

      await batch.commit();

      revalidatePath('/dashboard');
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

    if (!db) {
        return { success: false, message: 'La base de datos no está disponible.' };
    }

    try {
        const { id, ...rest } = validatedFields.data;
        
        const transactionRef = doc(db, 'transactions', id);
        
        // Firestore requires a plain object.
        const updateData: any = {
            ...rest,
            date: Timestamp.fromDate(new Date(rest.date)),
            description: rest.description || '',
        };

        // If category is being updated, status might need to change too
        if (rest.type === 'income' && rest.category) {
            if (rest.category === 'congregation') {
                updateData.status = 'Completado';
            } else if (updateData.status !== 'Enviado') {
                // Only change to pending if it wasn't already sent
                updateData.status = 'Pendiente de envío';
            }
        }

        // Remove undefined fields so Firestore doesn't overwrite them
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
        
        await updateDoc(transactionRef, updateData);

        revalidatePath('/dashboard');
        return { success: true, message: 'Transacción actualizada correctamente.' };
    } catch (e: any) {
        const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `Error al actualizar la transacción: ${message}` };
    }
}

export async function deleteTransactionAction(data: z.infer<typeof DeleteTransactionSchema>) {
    const validatedFields = DeleteTransactionSchema.safeParse(data);

    if (!validatedFields.success) {
        return { success: false, message: 'Datos inválidos.' };
    }

    if (!db) {
        return { success: false, message: 'La base de datos no está disponible.' };
    }

    try {
        const { id } = validatedFields.data;
        await deleteDoc(doc(db, 'transactions', id));
        revalidatePath('/dashboard');
        return { success: true, message: 'Transacción eliminada correctamente.' };
    } catch (e: any) {
        const message = e instanceof Error ? e.message : 'Ocurrió un error desconocido.';
        return { success: false, message: `Error al eliminar la transacción: ${message}` };
    }
}
