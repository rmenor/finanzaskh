
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HomePageContent from '@/components/home-page-content';

function FinancePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const isAuthenticated = localStorage.getItem('isAuthenticated');
        if (!isAuthenticated) {
            router.replace('/login');
        }
    }, [router]);

    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    
    // Render a loading state on the server or if not authenticated client-side
    if (!isClient) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }
    
    // After client-side check, if not authenticated, this will trigger the redirect in useEffect.
    // We can show a loading state or nothing while redirecting.
    if (!localStorage.getItem('isAuthenticated')) {
        return <div className="flex h-screen w-full items-center justify-center">Redireccionando...</div>;
    }

    return (
        <HomePageContent monthParam={monthParam} yearParam={yearParam} />
    );
}

export default function Finance() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
            <FinancePage />
        </Suspense>
    );
}
