import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle, Eye, EyeOff, User, Lock } from 'lucide-react';
import { FormEventHandler, useState, useEffect } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

interface LoginProps {
    status?: string;
    canResetPassword: boolean;
}

export default function Login({ status }: LoginProps) {

    const [customErrors, setCustomErrors] = useState<{email?: string; password?: string}>({});
    
    const { data, setData, post, processing, errors, reset } = useForm<Required<LoginForm>>({
        email: '',
        password: '',
        remember: false,
    });


    const isValidEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };
    
    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        

        setCustomErrors({});
        

        if (!data.email) {
            setCustomErrors({...customErrors, email: 'Email harus diisi'});
            return;
        }
        
        if (!isValidEmail(data.email)) {
            setCustomErrors({...customErrors, email: 'Format email tidak valid'});
            return;
        }
        

        if (!data.password) {
            setCustomErrors({...customErrors, password: 'Password harus diisi'});
            return;
        }
        

        post(route('login'), {
            onFinish: () => reset('password'),
            onError: (formErrors) => {

                if (formErrors.email && typeof formErrors.email === 'string' && 
                    (formErrors.email.includes('auth.failed') || 
                     formErrors.email.includes('credentials') || 
                     formErrors.email.includes('These credentials'))) {

                    setCustomErrors({password: 'Email atau password salah'});
                } else {

                    const newErrors: {email?: string; password?: string} = {};
                    
                    if (formErrors.email) {
                        newErrors.email = 'Format email tidak valid';
                    }
                    
                    if (formErrors.password) {
                        newErrors.password = 'Password salah';
                    }
                    
                    setCustomErrors(newErrors);
                }
            }
        });
    };
    

    const [showPassword, setShowPassword] = useState(false);
    const [animationLoaded, setAnimationLoaded] = useState(false);


    useEffect(() => {
        setAnimationLoaded(true);
    }, []);


    

    const setError = (newErrors: Record<string, string>) => {

        Object.keys(errors).forEach(key => {
            (errors as any)[key] = undefined;
        });
        

        Object.keys(newErrors).forEach(key => {
            (errors as any)[key] = newErrors[key];
        });
    };


    const translateError = (message?: string, field: string = '') => {
        if (!message) return '';
        

        if (field === 'email') {
            if (message.includes('The email field is required'))
                return 'Email harus diisi';
            if (message.includes('The email must be a valid email address'))
                return 'Format email tidak valid, pastikan terdapat tanda @';
            if (message)
                return message;
            return '';
        }
        

        if (field === 'password') {
            if (message.includes('The password field is required'))
                return 'Password harus diisi';
            if (message.includes('These credentials do not match our records') || message.includes('auth.failed'))
                return 'Password salah';
            return 'Password tidak valid';
        }
        

        if (message.includes('throttle'))
            return 'Terlalu banyak percobaan login. Silakan coba lagi nanti.';
            
        return 'Terjadi kesalahan pada proses login';
    };

    return (
        <div className="flex min-h-screen bg-gray-900 relative">
            <Head title="Login" />
            

            <div className="fixed inset-0 z-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/noise.png')] opacity-[0.03]"></div>
            </div>
            



            <div className="relative hidden w-1/2 bg-gray-900 lg:block">
                <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: 'url(/images/bg-hero.jpeg)' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/70"></div>
                </div>
                <div className="relative z-10 flex h-full flex-col items-center justify-center text-white p-12">                    

                    <img src="/images/logo.png" alt="Logo Puskesmas" className="w-48 mb-8" />
                    
                    <h1 className="text-4xl font-bold mb-6 text-center">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-gray-300">PUSKESMAS BOJONEGARA</span>
                    </h1>
                    

                </div>
                

                <div className="absolute top-0 left-0 w-40 h-40 border-t-2 border-l-2 border-white/20 rounded-tl-3xl"></div>
                <div className="absolute bottom-0 right-0 w-40 h-40 border-b-2 border-r-2 border-white/20 rounded-br-3xl"></div>
            </div>
            

            <div className="flex w-full items-center justify-center lg:w-1/2 relative">

                <div className="absolute top-0 right-0 w-32 h-32 border-t-2 border-r-2 border-white/10 rounded-tr-3xl"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 border-b-2 border-l-2 border-white/10 rounded-bl-3xl"></div>
                
                <div className="relative z-10 w-full max-w-md p-8">
                    <div className="text-center mb-4">

                        <div className="lg:hidden mb-6">
                            <img src="/images/logo.png" alt="Logo Puskesmas" className="w-32 mx-auto" />
                            <h1 className="text-2xl font-bold mt-4 text-white">PUSKESMAS BOJONEGARA</h1>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-sky-300 to-indigo-200">
                            SISTEM E-REGISTER RAJAL
                        </h2>
                    </div>
                    

                    
                    <div className="relative">
                        <form onSubmit={submit} className="bg-gray-800/90 p-8 rounded-xl border border-white/10 shadow-lg">
                            <div className="space-y-6">
                                <div>
                                    <label htmlFor="email" className="text-sm font-medium text-gray-300 mb-1 block">Email</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><User size={16} /></div>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            autoFocus
                                            className="bg-gray-700 border-gray-600 text-white py-5 pl-10 pr-4 w-full rounded-lg focus:ring-1 focus:ring-sky-400 focus:border-sky-400 placeholder-gray-400"
                                            value={data.email}
                                            onChange={(e) => setData('email', e.target.value)}
                                            placeholder="Masukkan email anda"
                                        />
                                    </div>

                                    {customErrors.email && (
                                        <InputError message={customErrors.email} className="text-red-400 text-sm mt-1" />
                                    )}
                                </div>
                                
                                <div>
                                    <label htmlFor="password" className="text-sm font-medium text-gray-300 mb-1 block">Password</label>
                                    <div className="relative">
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><Lock size={16} /></div>
                                        <Input
                                            id="password"
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            className="bg-gray-700 border-gray-600 text-white py-5 pl-10 pr-12 w-full rounded-lg focus:ring-1 focus:ring-sky-400 focus:border-sky-400 placeholder-gray-400"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Masukkan password anda"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200 focus:outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {customErrors.password && (
                                        <InputError message={customErrors.password} className="text-red-400 text-sm mt-1" />
                                    )}
                                </div>
                                
                                <Button 
                                    type="submit" 
                                    className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 rounded-lg py-5 text-lg font-semibold"
                                    disabled={processing}
                                >
                                    {processing ? (
                                        <>
                                            <LoaderCircle className="h-5 w-5 animate-spin mr-2" />
                                            Memproses...
                                        </>
                                    ) : (
                                        'Masuk'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                    
                    {status && (
                        <div className="mt-4 text-center text-sm font-medium text-green-400 bg-green-900/50 p-4 rounded-lg border border-green-500/30">
                            {status}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
