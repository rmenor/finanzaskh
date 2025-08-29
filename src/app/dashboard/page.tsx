
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AppLogo } from "@/components/icons";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <AppLogo className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl">¡Bienvenido a Finanzas KH!</CardTitle>
          <CardDescription className="text-lg">
            Tu panel de control para la gestión financiera.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-muted-foreground">
            Desde aquí puedes acceder a todas las herramientas para gestionar las finanzas.
            Comienza por revisar el panel de finanzas.
          </p>
          <Link href="/finance">
            <Button>
                Ir a Finanzas
                <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
