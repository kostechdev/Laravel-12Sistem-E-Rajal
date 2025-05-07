import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const [currentTime, setCurrentTime] = useState(new Date());
    
    // Update waktu setiap detik
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        
        return () => {
            clearInterval(timer);
        };
    }, []);
    
    // Format tanggal dalam Bahasa Indonesia
    const formatDate = (date: Date) => {
        const options: Intl.DateTimeFormatOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        return date.toLocaleDateString('id-ID', options);
    };
    
    // Format waktu HH:MM:SS
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <>
            <Head title="Selamat Datang">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            
            {/* Hero Section dengan Background Image */}
            <div className="relative min-h-screen overflow-hidden bg-gray-900">
                {/* Background image dengan overlay */}
                <div 
                    className="absolute inset-0 bg-cover bg-center z-0" 
                    style={{ backgroundImage: 'url(/images/bg-hero.jpeg)' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/70"></div>
                </div>
                
                {/* Navbar */}
                <header className="relative z-10 px-6 py-4">
                    <nav className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center space-x-2">
                            <img src="/images/logo.png" alt="Logo Puskesmas" className="w-12 h-12" />
                            <h1 className="text-xl font-bold text-white">PUSKESMAS BOJONEGARA</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="px-5 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 transition-colors"
                                >
                                    Masuk
                                </Link>
                            )}
                        </div>
                    </nav>
                </header>
                
                {/* Main Content */}
                <main className="relative z-10 flex flex-col items-center justify-center px-6 py-24 min-h-[70vh]">
                    <div className="max-w-4xl w-full mx-auto text-center">
                        {/* Tanggal dan Waktu */}
                        <div className="mb-8 inline-block px-6 py-3 bg-white/10 backdrop-blur-md rounded-full text-white">
                            <span className="text-xl">{formatDate(currentTime)}</span>
                            <span className="mx-3 text-indigo-300">|</span>
                            <span className="text-xl">{formatTime(currentTime)}</span>
                        </div>
                        
                        <h2 className="text-5xl font-bold text-white mb-8">Selamat Datang di</h2>
                        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-indigo-600 mb-10">
                            SISTEM E-REGISTER RAJAL
                        </h1>
                        <p className="text-2xl text-gray-300 mb-12">
                            Sistem Informasi Pelayanan Rawat Jalan Terpadu
                        </p>
                        
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="px-10 py-4 rounded-lg text-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 transition-colors shadow-lg"
                            >
                                Lihat Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={route('login')}
                                className="px-10 py-4 rounded-lg text-xl bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 transition-colors shadow-lg"
                            >
                                Masuk Sekarang
                            </Link>
                        )}
                    </div>
                </main>
                
                {/* Footer */}
                <footer className="relative z-10 bg-black/50 py-6">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-gray-400">
                            &copy; {new Date().getFullYear()} Puskesmas Bojonegara. Hak Cipta Dilindungi.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
}