
'use client';

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Request, FirestoreRequest } from '@/lib/types';
import { AddRequestDialog } from '@/components/add-request-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RequestActions } from '@/components/request-actions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

const serializeRequest = (doc: any): Request => {
    const data = doc.data() as FirestoreRequest;
    return {
      id: doc.id,
      ...data,
      requestDate: (data.requestDate as unknown as Timestamp).toDate(),
      endDate: data.endDate ? (data.endDate as unknown as Timestamp).toDate() : undefined,
    };
  };

const monthOptions = [
    { value: 'todos', label: 'Todos los meses' },
    { value: 'Enero', label: 'Enero' },
    { value: 'Febrero', label: 'Febrero' },
    { value: 'Marzo', label: 'Marzo' },
    { value: 'Abril', label: 'Abril' },
    { value: 'Mayo', label: 'Mayo' },
    { value: 'Junio', label: 'Junio' },
    { value: 'Julio', label: 'Julio' },
    { value: 'Agosto', label: 'Agosto' },
    { value: 'Septiembre', label: 'Septiembre' },
    { value: 'Octubre', label: 'Octubre' },
    { value: 'Noviembre', label: 'Noviembre' },
    { value: 'Diciembre', label: 'Diciembre' },
];
const monthNameToNumber: { [key: string]: number } = { Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5, Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11 };

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    const [monthFilter, setMonthFilter] = useState('todos');
    const [yearFilter, setYearFilter] = useState<string>('todos');
    const [availableYears, setAvailableYears] = useState<number[]>([]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const requestsCol = collection(db, 'requests');
                const q = query(requestsCol, orderBy('requestDate', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedRequests = querySnapshot.docs.map(serializeRequest);
                setRequests(fetchedRequests);

                const years = new Set(fetchedRequests.map(r => r.year));
                const currentYear = new Date().getFullYear();
                if (!years.has(currentYear)) {
                    years.add(currentYear);
                }
                setAvailableYears(Array.from(years).sort((a,b) => b-a));
                if (yearFilter === 'todos') {
                    setYearFilter(String(currentYear));
                }

            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        return requests.filter(request => {
            const yearMatch = yearFilter === 'todos' || request.year === parseInt(yearFilter);
            if (!yearMatch) return false;

            if (monthFilter === 'todos') return true;
            
            const selectedMonthDate = new Date(parseInt(yearFilter), monthNameToNumber[monthFilter], 1);
            
            // For continuous requests, check if the month is within the service period
            if(request.isContinuous) {
                const requestStartDate = new Date(request.requestDate.getFullYear(), request.requestDate.getMonth(), 1);

                if (selectedMonthDate < requestStartDate) return false;

                if (request.endDate) {
                    const requestEndDate = new Date(request.endDate.getFullYear(), request.endDate.getMonth(), 1);
                    return selectedMonthDate <= requestEndDate;
                }
                return true; // No end date, so it's active
            }

            // For monthly requests
            return request.months.includes(monthFilter);
        });
    }, [requests, monthFilter, yearFilter]);

    const getStatusBadge = (status: string) => {
        const statusClasses: Record<string, string> = {
            'Pendiente': 'text-orange-600 border-orange-200',
            'Aprobado': 'text-green-600 border-green-200',
            'Rechazado': 'text-red-600 border-red-200',
        };
        return <Badge variant="outline" className={cn(statusClasses[status] || 'text-gray-600 border-gray-200')}>{status}</Badge>;
    }

    return (
        <div className="flex flex-col w-full">
            <div className="flex items-center justify-between space-y-2 mb-4 print:hidden">
                <h1 className="text-2xl font-bold tracking-tight">Solicitudes de Precursorado</h1>
                <div className="flex items-center gap-2">
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            {availableYears.map(year => (
                                <SelectItem key={year} value={String(year)}>
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Select value={monthFilter} onValueChange={setMonthFilter}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Filtrar por mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {monthOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Imprimir
                    </Button>
                    <AddRequestDialog />
                </div>
            </div>
             <Card className="print:shadow-none print:border-none">
                <CardHeader>
                    <CardTitle>Lista de Solicitudes</CardTitle>
                    <CardDescription className="print:hidden">Aquí puedes ver todas las solicitudes de precursorado auxiliar.</CardDescription>
                </CardHeader>
                <CardContent>
                   {loading ? (
                        <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                   ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Solicitante</TableHead>
                                <TableHead>Fecha de Solicitud</TableHead>
                                <TableHead>Año</TableHead>
                                <TableHead>Mes(es)</TableHead>
                                <TableHead>Horas</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right print:hidden">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredRequests.length > 0 ? filteredRequests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.name}</TableCell>
                                <TableCell>{format(new Date(request.requestDate), 'PPP', { locale: es })}</TableCell>
                                <TableCell>{request.year}</TableCell>
                                <TableCell>
                                    {request.isContinuous 
                                        ? `Continuo ${request.endDate ? `(finalizado ${format(request.endDate, 'PPP', { locale: es })})` : ''}` 
                                        : request.months}
                                </TableCell>
                                <TableCell>{request.hours ? `${request.hours} hrs` : 'N/A'}</TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="text-right print:hidden">
                                    <RequestActions request={request} />
                                </TableCell>
                            </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground py-10">
                                        No hay solicitudes que coincidan con los filtros.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
