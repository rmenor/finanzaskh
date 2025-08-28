
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import HomePageContent from '@/components/home-page-content';

function DashboardPage() {
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
    
    if (!isClient || !localStorage.getItem('isAuthenticated')) {
        return <div className="flex h-screen w-full items-center justify-center">Cargando...</div>;
    }

    return (
        <HomePageContent monthParam={monthParam} yearParam={yearParam} />
    );
}

export default function Dashboard() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full items-center justify-center">Cargando...</div>}>
            <DashboardPage />
        </Suspense>
    );
}
