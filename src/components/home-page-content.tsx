
'use client';

import { useEffect, useState } from 'react';
import { getTransactionsAction } from '@/lib/actions';
import type { Transaction } from '@/lib/types';
import DashboardClient from '@/components/dashboard-client';
import { Skeleton } from '@/components/ui/skeleton';

interface HomePageContentProps {
  monthParam: string | null;
  yearParam: string | null;
}

export default function HomePageContent({ monthParam, yearParam }: HomePageContentProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        // This action now gets data from the mock DB
        const result = await getTransactionsAction();
        
        if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to fetch transactions");
        }

        const allTransactions = result.data.map(t => ({
            ...t,
            date: new Date(t.date) 
        })).sort((a,b) => b.date.getTime() - a.date.getTime());

        const pendingBranchTransactions = allTransactions
            .filter(t => 
                t.type === 'income' && 
                (t.category === 'worldwide_work' || t.category === 'renovation') && 
                !t.sentToBranch
            );

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;
        
        const selectedYear = yearParam ? parseInt(yearParam) : currentYear;
        const selectedMonth = monthParam ? parseInt(monthParam) : currentMonth;

        const transactionsForSelectedPeriod = allTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getFullYear() === selectedYear && transactionDate.getMonth() + 1 === selectedMonth;
        });

        let years = [...new Set(allTransactions.map(t => new Date(t.date).getFullYear()))].sort((a,b) => b - a);
        if (years.length === 0) {
          years.push(currentYear);
        }

        const totalIncome = transactionsForSelectedPeriod
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactionsForSelectedPeriod
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalBranchTransfers = transactionsForSelectedPeriod
          .filter((t) => t.type === 'branch_transfer')
          .reduce((sum, t) => sum + t.amount, 0);

        const balance = totalIncome - totalExpenses - totalBranchTransfers;

        const incomeByCategory = transactionsForSelectedPeriod
          .filter((t): t is Transaction & { type: 'income' } => t.type === 'income')
          .reduce((acc, t) => {
            if (t.category) {
              acc[t.category] = (acc[t.category] || 0) + t.amount;
            }
            return acc;
          }, {} as Record<string, number>);
          
        const worldwideWorkIncome = incomeByCategory['worldwide_work'] || 0;
        const renovationIncome = incomeByCategory['renovation'] || 0;

        const totalIncomeAllTime = allTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const totalExpensesAllTime = allTransactions
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalBranchTransfersAllTime = allTransactions
          .filter((t) => t.type === 'branch_transfer')
          .reduce((sum, t) => sum + t.amount, 0);

        const totalBalance = totalIncomeAllTime - totalExpensesAllTime - totalBranchTransfersAllTime;
        
        const monthlyDataAllYears = allTransactions.reduce((acc, t) => {
          const transactionDate = new Date(t.date);
          // Use UTC dates to prevent timezone issues
          const month = new Date(Date.UTC(transactionDate.getFullYear(), transactionDate.getMonth(), 1)).toISOString();
          if (!acc[month]) {
            acc[month] = { month, income: 0, expenses: 0 };
          }
          if (t.type === 'income') {
            acc[month].income += t.amount;
          } else if (t.type === 'expense') {
            acc[month].expenses += t.amount;
          }
          return acc;
        }, {} as Record<string, { month: string; income: number; expenses: number }>);
        
        const sortedMonthlyData = Object.values(monthlyDataAllYears).sort((a,b) => new Date(a.month) < new Date(b.month) ? -1 : 1).slice(-6);

        setData({
          transactions: transactionsForSelectedPeriod,
          allTransactions: allTransactions,
          totalIncome,
          totalExpenses,
          balance,
          branchContribution: totalBranchTransfers,
          incomeByCategory,
          monthlyData: sortedMonthlyData,
          years,
          selectedYear,
          selectedMonth,
          pendingBranchTransactions,
          totalBalance,
          worldwideWorkIncome,
          renovationIncome
        });

      } catch (e: any) {
        console.error("Error fetching data.", e);
        setError(e.message || 'Ocurrió un error desconocido.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [yearParam, monthParam]);

  if (loading) {
    return (
        <div className="flex flex-col min-h-screen">
            <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 z-10">
                <Skeleton className="h-6 w-32" />
                <div className="ml-auto flex items-center gap-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-32" />
                </div>
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                    <Skeleton className="lg:col-span-4 h-96" />
                    <Skeleton className="lg:col-span-3 h-96" />
                </div>
            </main>
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-red-50 text-red-700 p-4">
        <h2 className="text-2xl font-bold mb-4">Error al cargar los datos</h2>
        <p className="mb-4 text-center">No se pudieron obtener los datos. Por favor, revisa el siguiente error:</p>
        <pre className="w-full max-w-2xl bg-red-100 p-4 rounded-md text-sm text-left whitespace-pre-wrap break-words">
          {error}
        </pre>
      </div>
    );
  }

  if (!data) {
    return <div className="flex h-screen w-full items-center justify-center">Iniciando...</div>;
  }

  return (
    <DashboardClient
      transactions={data.transactions}
      allTransactions={data.allTransactions}
      totalIncome={data.totalIncome}
      totalExpenses={data.totalExpenses}
      balance={data.balance}
      branchContribution={data.branchContribution}
      incomeByCategory={data.incomeByCategory}
      monthlyData={data.monthlyData}
      years={data.years}
      selectedYear={data.selectedYear}
      selectedMonth={data.selectedMonth}
      pendingBranchTransactions={data.pendingBranchTransactions}
      totalBalance={data.totalBalance}
      worldwideWorkIncome={data.worldwideWorkIncome}
      renovationIncome={data.renovationIncome}
    />
  );
}
