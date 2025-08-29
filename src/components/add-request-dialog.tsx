
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from './ui/checkbox';
import { addRequestAction } from '@/lib/actions';
import { MultiSelect } from './ui/multi-select';

const monthOptions = [
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

const requestSchema = z.object({
    name: z.string().min(3, { message: 'El nombre es obligatorio y debe tener al menos 3 caracteres.' }),
    months: z.array(z.string()).optional(),
    isContinuous: z.boolean(),
    requestDate: z.date({ required_error: 'La fecha es obligatoria.' }),
}).refine(data => !data.isContinuous ? data.months && data.months.length > 0 : true, {
    message: 'Debes especificar los meses si la solicitud no es de servicio continuo.',
    path: ['months'],
});

type RequestFormValues = z.infer<typeof requestSchema>;


export function AddRequestDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      name: '',
      months: [],
      isContinuous: false,
    },
  });

  const { isSubmitting } = form.formState;
  const isContinuous = form.watch('isContinuous');

  const handleSuccess = (message: string) => {
    toast({
      title: 'Éxito',
      description: message,
    });
    setOpen(false);
    form.reset();
    // Reload to show the new request
     window.location.reload();
  };

  const handleError = (message: string) => {
    toast({
      variant: 'destructive',
      title: 'Error',
      description: message,
    });
  };

  async function onSubmit(values: RequestFormValues) {
    const result = await addRequestAction(values);
    if (result.success) {
      handleSuccess(result.message);
    } else {
      handleError(result.message || 'Ocurrió un error desconocido.');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Añadir Solicitud</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Nueva Solicitud de Precursorado Auxiliar</DialogTitle>
          <DialogDescription>
            Rellena los datos para crear una nueva solicitud.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre del Solicitante</FormLabel>
                    <FormControl>
                        <Input placeholder="Nombre completo" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <FormField
                    control={form.control}
                    name="isContinuous"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                            <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>
                                Marque la casilla si desea ser precursor auxiliar de continuo
                            </FormLabel>
                        </div>
                        </FormItem>
                    )}
                />
                
                {!isContinuous && (
                    <FormField
                    control={form.control}
                    name="months"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mes(es) de servicio</FormLabel>
                            <MultiSelect
                                options={monthOptions}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Selecciona los meses..."
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                )}
                
                <FormField
                    control={form.control}
                    name="requestDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                        <FormLabel>Fecha de la Solicitud</FormLabel>
                        <Popover>
                            <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                variant={'outline'}
                                className={cn(
                                    'w-full pl-3 text-left font-normal',
                                    !field.value && 'text-muted-foreground'
                                )}
                                >
                                {field.value ? (
                                    format(field.value, 'PPP', { locale: es })
                                ) : (
                                    <span>Elige una fecha</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                                }
                                initialFocus
                                locale={es}
                            />
                            </PopoverContent>
                        </Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />

                <DialogFooter className="pt-4">
                    <DialogClose asChild>
                        <Button type="button" variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Crear Solicitud
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
