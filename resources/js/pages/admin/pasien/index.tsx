import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
// Import default dan juga named export dari pagination
import Pagination, { PaginationItem, PaginationEllipsis } from '../../../components/ui/pagination';
import { Badge } from '@/components/ui/badge';
// Import langsung dari file relatif untuk menghindari masalah resolusi path
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '../../../components/ui/alert-dialog';
import { toast } from 'sonner';

interface Pasien {
    nik: string;
    nama: string;
    alamat: string;
    created_at: string;
    updated_at: string;
}

interface Meta {
    current_page: number;
    from: number;
    last_page: number;
    links: any[];
    path: string;
    per_page: number;
    to: number;
    total: number;
}

interface PasienIndexProps {
    // Mengubah tipe data untuk menerima format pagination Laravel
    pasien: {
        data: Pasien[];
        current_page: number;
        from: number;
        last_page: number;
        links: {
            url: string | null;
            label: string;
            active: boolean;
        }[];
        path: string;
        per_page: number;
        to: number;
        total: number;
    };
    filters: {
        search: string;
    };
}

export default function PasienIndex({ pasien, filters }: PasienIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [pasienToDelete, setPasienToDelete] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.pasien.index'), { search }, { preserveState: true });
    };

    const handleDelete = (nik: string) => {
        setPasienToDelete(nik);
        setShowDeleteDialog(true);
    };

    const confirmDelete = () => {
        if (pasienToDelete) {
            router.delete(route('admin.pasien.destroy', pasienToDelete), {
                onSuccess: () => {
                    toast.success('Data pasien berhasil dihapus');
                    setShowDeleteDialog(false);
                },
                onError: (errors) => {
                    toast.error('Gagal menghapus data pasien');
                    console.error(errors);
                    setShowDeleteDialog(false);
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <AppLayout>
            <Head title="Data Pasien" />

            <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-3xl font-bold tracking-tight">Data Pasien</h2>
                    <Button asChild>
                        <Link href={route('admin.pasien.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Tambah Pasien
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader className="px-6 py-4">
                        <div className="flex items-center justify-between">
                            <CardTitle>Daftar Pasien</CardTitle>
                            <form onSubmit={handleSearch} className="flex items-center gap-2">
                                <Input
                                    type="search"
                                    placeholder="Cari NIK atau nama..."
                                    className="max-w-xs"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                                <Button type="submit" variant="outline" size="icon">
                                    <Search className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardHeader>
                    <CardContent className="px-6 py-4">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NIK</TableHead>
                                    <TableHead>Nama Lengkap</TableHead>
                                    <TableHead>Alamat</TableHead>
                                    <TableHead>Tanggal Registrasi</TableHead>
                                    <TableHead className="text-right">Aksi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pasien.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">
                                            Tidak ada data pasien
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    pasien.data.map((item) => (
                                        <TableRow key={item.nik}>
                                            <TableCell className="font-medium">{item.nik}</TableCell>
                                            <TableCell>{item.nama}</TableCell>
                                            <TableCell>{item.alamat}</TableCell>
                                            <TableCell>{formatDate(item.created_at)}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button
                                                    asChild
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                >
                                                    <Link href={route('admin.pasien.edit', item.nik)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-8 w-8 text-red-500"
                                                    onClick={() => handleDelete(item.nik)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                        
                        {pasien.last_page > 1 && (
                            <div className="mt-4 flex items-center justify-center">
                                <Pagination>
                                    {pasien.links.map((link, i) => {
                                        if (link.url === null) {
                                            return (
                                                <PaginationItem key={i} disabled>
                                                    {link.label.replace(/&laquo;|&raquo;/g, '')}
                                                </PaginationItem>
                                            );
                                        }
                                        
                                        return (
                                            <PaginationItem
                                                key={i}
                                                active={link.active}
                                                onClick={() => link.url && router.get(link.url)}
                                            >
                                                {link.label.replace(/&laquo;|&raquo;/g, '')}
                                            </PaginationItem>
                                        );
                                    })}
                                </Pagination>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus data pasien ini? Tindakan ini tidak dapat dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-red-500 text-white hover:bg-red-600">
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}
