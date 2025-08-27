
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { EditTransactionDialog } from './edit-transaction-dialog';
import { Button } from './ui/button';
import { FilePenLine } from 'lucide-react';

export function RecentTransactions({
  transactions,
  title,
  description,
}: {
  transactions: Transaction[];
  title: string;
  description: string;
}) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const categoryLabels: Record<string, string> = {
    congregation: 'Congregación',
    worldwide_work: 'Obra Mundial',
    renovation: 'Renovación'
  }

  const typeLabels: Record<string, string> = {
    income: 'Ingreso',
    expense: 'Gasto',
    branch_transfer: 'Envío a Sucursal'
  }

  const getBadgeClass = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 border-green-200';
      case 'expense':
        return 'text-red-600 border-red-200';
      case 'branch_transfer':
        return 'text-blue-600 border-blue-200';
      default:
        return '';
    }
  }

  const getAmountClass = (type: string) => {
    switch (type) {
        case 'income':
          return 'text-green-600';
        case 'expense':
        case 'branch_transfer':
          return 'text-red-600';
        default:
          return '';
      }
  }

  const getAmountPrefix = (type: string) => {
    return type === 'income' ? '+' : '-';
  }
  
  const getStatusBadge = (transaction: Transaction) => {
    if (transaction.type === 'income' && (transaction.category === 'worldwide_work' || transaction.category === 'renovation')) {
        if (transaction.sentToBranch) {
            return <Badge variant="outline" className="text-gray-600 border-gray-200">Enviado</Badge>;
        } else {
            return <Badge variant="outline" className="text-orange-600 border-orange-200">Pendiente</Badge>;
        }
    }
    return null;
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
        </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoría</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="w-[50px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.description || 'N/A'}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn(getBadgeClass(transaction.type))}>
                        {typeLabels[transaction.type]}
                    </Badge>
                </TableCell>
                <TableCell>
                    {transaction.category ? (
                        <Badge variant="secondary">{categoryLabels[transaction.category]}</Badge>
                    ) : 'N/A'}
                </TableCell>
                <TableCell>
                    {getStatusBadge(transaction)}
                </TableCell>
                <TableCell>{format(new Date(transaction.date), 'PPP', { locale: es })}</TableCell>
                <TableCell className={cn("text-right font-semibold", getAmountClass(transaction.type))}>
                  {getAmountPrefix(transaction.type)} {formatCurrency(transaction.amount)}
                </TableCell>
                 <TableCell className="text-right">
                    {transaction.type !== 'branch_transfer' && (
                        <EditTransactionDialog transaction={transaction}>
                            <Button variant="ghost" size="icon">
                                <FilePenLine className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                            </Button>
                        </EditTransactionDialog>
                    )}
                </TableCell>
              </TableRow>
            ))}
             {transactions.length === 0 && (
                <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                        No hay transacciones para este período.
                    </TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

    