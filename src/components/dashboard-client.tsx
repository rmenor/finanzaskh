
'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';


import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowUpRight,
  ArrowDownLeft,
  Scale,
  Landmark,
  Globe,
  Paintbrush,
  PiggyBank,
  Users,
  LogOut,
} from 'lucide-react';
import { Button } from './ui/button';

import type { Transaction } from '@/lib/types';
import { AddTransactionDialog } from './add-transaction-dialog';
import { RecentTransactions } from './recent-transactions';
import { MonthlyOverviewChart, IncomeBreakdownChart } from './charts';
import { AppLogo } from './icons';

interface DashboardClientProps {
  transactions: Transaction[];
  allTransactions: Transaction[];
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  branchContribution: number;
  incomeByCategory: Record<string, number>;
  monthlyData: { month: string; income: number; expenses: number, branch_transfer: number }[];
  years: number[];
  selectedYear: number;
  selectedMonth: number;
  pendingBranchTransactions: Transaction[];
  totalBalance: number;
  congregationIncome: number;
  worldwideWorkIncome: number;
  renovationIncome: number;
}

export default function DashboardClient({
  transactions,
  allTransactions,
  totalIncome,
  totalExpenses,
  balance,
  branchContribution,
  incomeByCategory,
  monthlyData,
  years,
  selectedYear,
  selectedMonth,
  pendingBranchTransactions,
  totalBalance,
  congregationIncome,
  worldwideWorkIncome,
  renovationIncome,
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };
  
  const handleFilterChange = (type: 'year' | 'month', value: string) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set(type, value);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.push(`${pathname}${query}`);
  }

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/login');
  };

  const months = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, 'label': 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 z-10">
        <div className="flex items-center gap-2 font-semibold">
            <AppLogo className="h-6 w-6 text-primary" />
            <span className="">Finanzas KH</span>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <div className='flex gap-2'>
              <Select value={String(selectedYear)} onValueChange={(value) => handleFilterChange('year', value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {years.map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(selectedMonth)} onValueChange={(value) => handleFilterChange('month', value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={String(month.value)}>{month.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <AddTransactionDialog pendingBranchTransactions={pendingBranchTransactions} />
            <Button variant="outline" size="icon" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Cerrar Sesión</span>
            </Button>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Tabs defaultValue="overview" className="w-full space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="transactions">Transacciones del Mes</TabsTrigger>
            <TabsTrigger value="all">Todas</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos del Mes
                  </CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gastos del Mes
                  </CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Balance del Mes</CardTitle>
                  <Scale className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(balance)}</div>
                </CardContent>
              </Card>
               <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total en Cuenta
                  </CardTitle>
                  <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalBalance)}
                  </div>
                   <p className="text-xs text-muted-foreground">
                    Saldo total acumulado
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Congregación
                  </CardTitle>
                  <Users className="h-4 w-4 text-cyan-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(congregationIncome)}</div>
                   <p className="text-xs text-muted-foreground">
                    Donaciones del mes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Obra Mundial
                  </CardTitle>
                  <Globe className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(worldwideWorkIncome)}</div>
                   <p className="text-xs text-muted-foreground">
                    Donaciones del mes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ingresos Renovación
                  </CardTitle>
                  <Paintbrush className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(renovationIncome)}</div>
                   <p className="text-xs text-muted-foreground">
                    Donaciones del mes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Enviado a la Sucursal
                  </CardTitle>
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(branchContribution)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Total de envíos este mes
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="lg:col-span-4">
                <CardHeader>
                  <CardTitle>Resumen Anual</CardTitle>
                  <CardDescription>Ingresos y gastos de los últimos 6 meses.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <MonthlyOverviewChart data={monthlyData} />
                </CardContent>
              </Card>
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Desglose de Ingresos del Mes</CardTitle>
                  <CardDescription>
                    Desglose de ingresos por fuente para el mes seleccionado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <IncomeBreakdownChart data={incomeByCategory} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
           <TabsContent value="transactions" className="space-y-4">
                <RecentTransactions transactions={transactions} title="Transacciones del Mes" description="Una lista de todas tus transacciones para el período seleccionado."/>
           </TabsContent>
           <TabsContent value="all" className="space-y-4">
                <RecentTransactions transactions={allTransactions} title="Todas las Transacciones" description="Una lista de todas tus transacciones históricas."/>
           </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
