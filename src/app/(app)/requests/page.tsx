
'use client';

import { useState, useEffect } from 'react';
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

const serializeRequest = (doc: any): Request => {
    const data = doc.data() as FirestoreRequest;
    return {
      id: doc.id,
      ...data,
      requestDate: (data.requestDate as unknown as Timestamp).toDate(),
    };
  };

export default function RequestsPage() {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const requestsCol = collection(db, 'requests');
                const q = query(requestsCol, orderBy('requestDate', 'desc'));
                const querySnapshot = await getDocs(q);
                const fetchedRequests = querySnapshot.docs.map(serializeRequest);
                setRequests(fetchedRequests);
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

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
            <div className="flex items-center justify-between space-y-2 mb-4">
                <h1 className="text-2xl font-bold tracking-tight">Solicitudes de Precursorado</h1>
                <AddRequestDialog />
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Lista de Solicitudes</CardTitle>
                    <CardDescription>Aquí puedes ver todas las solicitudes de precursorado auxiliar.</CardDescription>
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
                                <TableHead>Mes(es) Solicitado(s)</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.length > 0 ? requests.map((request) => (
                            <TableRow key={request.id}>
                                <TableCell className="font-medium">{request.name}</TableCell>
                                <TableCell>{format(new Date(request.requestDate), 'PPP', { locale: es })}</TableCell>
                                <TableCell>{request.isContinuous ? 'Continuo' : request.months}</TableCell>
                                <TableCell>{getStatusBadge(request.status)}</TableCell>
                                <TableCell className="text-right">
                                    <RequestActions requestId={request.id} currentStatus={request.status} />
                                </TableCell>
                            </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground py-10">
                                        No hay solicitudes registradas.
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
