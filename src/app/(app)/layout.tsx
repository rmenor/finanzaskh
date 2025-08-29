
'use client';

import { Sidebar } from '@/components/sidebar';
import { useRouter } from 'next/navigation';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const authStatus = localStorage.getItem('isAuthenticated') === 'true';
        setIsAuthenticated(authStatus);
        if (!authStatus) {
            router.replace('/login');
        }
    }, [router]);
    
    if (!isClient || !isAuthenticated) {
        return (
            <div className="flex flex-col min-h-screen">
                <header className="sticky top-0 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 z-10">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-32" />
                    <div className="ml-auto flex items-center gap-4">
                        <Skeleton className="h-10 w-24" />
                    </div>
                </header>
                <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 md:gap-8 md:p-8">
                    <div className="text-center">
                        <p className="text-lg text-muted-foreground">Verificando autenticación y redirigiendo...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <Sidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 print:pl-0 print:py-0">
                <main className="flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 print:p-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
