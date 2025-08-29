
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Checkbox } from './ui/checkbox';
import { addRequestAction } from '@/lib/actions';
import { MultiSelect } from './ui/multi-select';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { CheckCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

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

const currentYear = new Date().getFullYear();
const yearOptions = [currentYear, currentYear + 1, currentYear + 2].map(y => ({ value: String(y), label: String(y) }));

const requestSchema = z.object({
    name: z.string().min(3, { message: 'El nombre es obligatorio y debe tener al menos 3 caracteres.' }),
    year: z.coerce.number({required_error: 'El año es obligatorio.'}),
    months: z.array(z.string()).optional(),
    isContinuous: z.boolean(),
    hours: z.coerce.number().optional(),
}).refine(data => data.isContinuous || (data.months && data.months.length > 0), {
    message: 'Debes especificar los meses si la solicitud no es de servicio continuo.',
    path: ['months'],
}).refine(data => data.isContinuous || data.hours, {
    message: 'Debes seleccionar una modalidad de horas.',
    path: ['hours'],
});

type RequestFormValues = z.infer<typeof requestSchema>;

export function PublicRequestForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      name: '',
      months: [],
      isContinuous: false,
      year: currentYear,
    },
  });

  const { isSubmitting } = form.formState;
  const isContinuous = form.watch('isContinuous');

  const handleSuccess = (message: string) => {
    toast({
      title: 'Éxito',
      description: message,
    });
    setIsSubmitted(true);
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

  if (isSubmitted) {
    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Solicitud Enviada</CardTitle>
            </CardHeader>
            <CardContent>
                <Alert variant="default" className="border-green-500 bg-green-50 text-green-800">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertTitle>¡Gracias!</AlertTitle>
                    <AlertDescription>
                        Tu solicitud ha sido enviada correctamente. El comité de servicio la revisará pronto.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
            <CardTitle className="text-2xl tracking-wide">SOLICITUD PARA SER PRECURSOR AUXILIAR</CardTitle>
            <CardDescription>Fecha de la solicitud: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
        </CardHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="flex-grow">
                            <FormLabel>Nombre</FormLabel>
                            <FormControl>
                                <Input placeholder="Tu nombre completo" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="isContinuous"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
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

                    <FormField
                        control={form.control}
                        name="year"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Sírvanse aceptar mi solicitud para servir de precursor auxiliar durante el año de:</FormLabel>
                            <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un año" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {yearOptions.map(option => (
                                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    
                    {!isContinuous && (
                      <>
                        <FormField
                          control={form.control}
                          name="hours"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Indique si va a hacer 15 o 30 horas</FormLabel>
                              <FormControl>
                                <RadioGroup
                                  onValueChange={(value) => field.onChange(parseInt(value))}
                                  defaultValue={String(field.value)}
                                  className="flex items-center space-x-4"
                                >
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="15" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      15 horas
                                    </FormLabel>
                                  </FormItem>
                                  <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                      <RadioGroupItem value="30" />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                      30 horas
                                    </FormLabel>
                                  </FormItem>
                                </RadioGroup>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                        control={form.control}
                        name="months"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Durante el mes (o meses) de:</FormLabel>
                                <MultiSelect
                                    options={monthOptions}
                                    selected={field.value || []}
                                    onChange={field.onChange}
                                    placeholder="Selecciona uno o varios meses..."
                                />
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                      </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Enviar Solicitud
                    </Button>
                </CardFooter>
            </form>
        </Form>
    </Card>
  );
}
