
'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { CheckCircle, MoreHorizontal, XCircle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { updateRequestStatusAction, deleteRequestAction } from '@/lib/actions';
import { type RequestStatus } from '@/lib/types';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
  } from '@/components/ui/alert-dialog';

interface RequestActionsProps {
  requestId: string;
  currentStatus: RequestStatus;
}

export function RequestActions({ requestId, currentStatus }: RequestActionsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<'Aprobado' | 'Rechazado' | null>(null);

  const { toast } = useToast();

  const handleStatusChange = async () => {
    if (!actionToConfirm) return;

    setIsUpdating(true);
    const result = await updateRequestStatusAction({ id: requestId, status: actionToConfirm });
    setIsUpdating(false);
    setDialogOpen(false);


    if (result.success) {
      toast({
        title: 'Éxito',
        description: result.message,
      });
       window.location.reload();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'No se pudo actualizar el estado.',
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteRequestAction({ id: requestId });
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    
    if (result.success) {
      toast({
        title: 'Éxito',
        description: result.message,
      });
      window.location.reload();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.message || 'No se pudo eliminar la solicitud.',
      });
    }
  }

  const openConfirmation = (status: 'Aprobado' | 'Rechazado') => {
    setActionToConfirm(status);
    setDialogOpen(true);
  }

  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isUpdating || isDeleting}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Acciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus === 'Pendiente' && (
            <>
                <DropdownMenuItem onSelect={() => openConfirmation('Aprobado')}>
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <span>Aprobar</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => openConfirmation('Rechazado')}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                <span>Rechazar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
            </>
        )}
        <DropdownMenuItem onSelect={() => setDeleteDialogOpen(true)} className="text-red-500">
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Eliminar</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    {/* Status Change Dialog */}
    <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta acción cambiará el estado de la solicitud a &quot;{actionToConfirm}&quot;.
                Esta acción no se puede deshacer fácilmente.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} disabled={isUpdating}>
                {isUpdating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Actualizando...</> : `Sí, marcar como ${actionToConfirm}`}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    
    {/* Delete Confirmation Dialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de que quieres eliminar?</AlertDialogTitle>
            <AlertDialogDescription>
               Esta acción es permanente y no se puede deshacer. La solicitud se eliminará definitivamente.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
                 {isDeleting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Eliminando...</> : `Sí, eliminar`}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}
