import { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// Mengganti import textarea dengan textarea sederhana
const Textarea = ({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      className={`flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${className}`}
      {...props}
    />
);
import { toast } from 'sonner';

export default function PasienCreate() {
    const { data, setData, post, processing, errors } = useForm({
        nik: '',
        nama: '',
        alamat: '',
    });

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        post(route('admin.pasien.store'), {
            onSuccess: () => {
                toast.success('Data pasien berhasil disimpan');
            },
            onError: (errors) => {
                toast.error('Gagal menyimpan data pasien');
                console.error(errors);
            },
        });
    };

    return (
        <AppLayout>
            <Head title="Tambah Pasien Baru" />

            <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
                <div className="flex items-center">
                    <Button variant="outline" size="icon" asChild className="mr-4">
                        <Link href={route('admin.pasien.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <h2 className="text-3xl font-bold tracking-tight">Tambah Pasien Baru</h2>
                </div>

                <Card>
                    <CardHeader className="px-6 py-4">
                        <CardTitle>Form Pasien</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 py-4">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="nik">NIK</Label>
                                <Input
                                    id="nik"
                                    type="text"
                                    maxLength={16}
                                    value={data.nik}
                                    onChange={(e) => setData('nik', e.target.value)}
                                    placeholder="Masukkan NIK (16 digit)"
                                    className={errors.nik ? 'border-red-500' : ''}
                                />
                                {errors.nik && (
                                    <p className="text-red-500 text-sm mt-1">{errors.nik}</p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="nama">Nama Lengkap</Label>
                                <Input
                                    id="nama"
                                    type="text"
                                    value={data.nama}
                                    onChange={(e) => setData('nama', e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className={errors.nama ? 'border-red-500' : ''}
                                />
                                {errors.nama && (
                                    <p className="text-red-500 text-sm mt-1">{errors.nama}</p>
                                )}
                            </div>
                            
                            <div className="space-y-2">
                                <Label htmlFor="alamat">Alamat</Label>
                                <Textarea
                                    id="alamat"
                                    value={data.alamat}
                                    onChange={(e) => setData('alamat', e.target.value)}
                                    placeholder="Masukkan alamat lengkap"
                                    className={errors.alamat ? 'border-red-500' : ''}
                                    rows={4}
                                />
                                {errors.alamat && (
                                    <p className="text-red-500 text-sm mt-1">{errors.alamat}</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => window.history.back()}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
