import { useState, useEffect, useRef, useMemo } from 'react';
import { generateReceiptHtml, formatRupiah as formatReceiptRupiah } from '@/utils/receiptGenerator';
import { CreditCard, ShoppingCart, ShoppingBag, X, Loader2, Pencil, CheckCircle2, ArrowLeft } from 'lucide-react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Search, Printer } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { debounce } from 'lodash';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

interface Layanan {
    id_layanan: number;
    nama_layanan: string;
    total_harga: number;
}

interface Transaksi {
    id_transaksi: number;
    id_admin: number;
    nama_pasien: string;
    pasien?: Pasien | null;
    total_harga: number;
    total_bayar: number;
    created_at: string;
    transaksiDetails?: {
        id_transaksi_detail: number;
        id_transaksi: number;
        id_layanan: number;
        layanan: Layanan;
    }[];
}

interface PopularLayanan extends Layanan {
    transaction_count: number;
}

interface Pasien {
    nik: string;
    nama: string;
    alamat: string;
    created_at?: string;
    updated_at?: string;
}

interface TransaksiIndexProps {
    transaksi: Transaksi[];
    layanan: Layanan[];
    popularLayanan: PopularLayanan[];
}

const STORAGE_KEYS = {
    NAMA_PASIEN: 'transaksi_nama_pasien',
    SELECTED_LAYANAN: 'transaksi_selected_layanan',
    TOTAL_BAYAR: 'transaksi_total_bayar'
};

export default function TransaksiIndex({ transaksi, layanan, popularLayanan = [] }: TransaksiIndexProps) {
    const [namaPasien, setNamaPasien] = useState('');
    const [searchLayanan, setSearchLayanan] = useState('');
    const [searchResults, setSearchResults] = useState<Layanan[]>([]);
    const [selectedLayanan, setSelectedLayanan] = useState<Layanan[]>([]);
    const [totalHarga, setTotalHarga] = useState(0);
    const [totalBayar, setTotalBayar] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [swipingItemId, setSwipingItemId] = useState<number | null>(null);
    const [swipePosition, setSwipePosition] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [kembalian, setKembalian] = useState(0);
    const [previouslyPaid, setPreviouslyPaid] = useState<number>(0);
    const [sisaTagihan, setSisaTagihan] = useState<number>(0);
    const [isSearching, setIsSearching] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    
    const [viewingTransaksi, setViewingTransaksi] = useState<Transaksi | null>(null);
    const [showTransaksiDetails, setShowTransaksiDetails] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showAllTransaksiModal, setShowAllTransaksiModal] = useState(false);
    const [searchTransaksi, setSearchTransaksi] = useState('');
    const [filteredTransaksi, setFilteredTransaksi] = useState<Transaksi[]>([]);
    
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [savedTransactionId, setSavedTransactionId] = useState<number | null>(null);
    const [editingTransaksiId, setEditingTransaksiId] = useState<number | null>(null);
    const [receiptData, setReceiptData] = useState<{
        id_transaksi?: number;
        nama_pasien: string;
        layanan: Layanan[];
        total_harga: number;
        total_bayar: number;
        kembalian: number;
        tanggal: string;
    }>({
        nama_pasien: '',
        layanan: [],
        total_harga: 0,
        total_bayar: 0,
        kembalian: 0,
        tanggal: new Date().toISOString()
    });
    const [isInitialized, setIsInitialized] = useState(false);
    
    // State untuk pencarian dan pengelolaan pasien
    const [searchPasien, setSearchPasien] = useState('');
    const [pasienResults, setPasienResults] = useState<Pasien[]>([]);
    const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
    const [isPasienDropdownVisible, setIsPasienDropdownVisible] = useState(false);
    const pasienDropdownRef = useRef<HTMLDivElement>(null);
    
    // State untuk form pendaftaran pasien baru
    const [showRegisterPasien, setShowRegisterPasien] = useState(false);
    const [newPasien, setNewPasien] = useState<{
        nik: string;
        nama: string;
        alamat: string;
    }>({ nik: '', nama: '', alamat: '' });
    const [registerLoading, setRegisterLoading] = useState(false);


    useEffect(() => {
        try {
            const storedNamaPasien = localStorage.getItem(STORAGE_KEYS.NAMA_PASIEN);
            const storedSelectedLayanan = localStorage.getItem(STORAGE_KEYS.SELECTED_LAYANAN);
            const storedTotalBayar = localStorage.getItem(STORAGE_KEYS.TOTAL_BAYAR);
            
            if (storedNamaPasien) {
                setNamaPasien(storedNamaPasien);
            }
            
            if (storedSelectedLayanan) {
                const layananDariStorage: Layanan[] = JSON.parse(storedSelectedLayanan);
                setSelectedLayanan(layananDariStorage);
            }
            
            if (storedTotalBayar) {
                setTotalBayar(storedTotalBayar);
            }
            
            setIsInitialized(true);
        } catch (error) {
            console.error('Error loading data from localStorage:', error);
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        if (!isInitialized) return;
        
        try {
            localStorage.setItem(STORAGE_KEYS.NAMA_PASIEN, namaPasien);
            localStorage.setItem(STORAGE_KEYS.SELECTED_LAYANAN, JSON.stringify(selectedLayanan));
            localStorage.setItem(STORAGE_KEYS.TOTAL_BAYAR, totalBayar);
        } catch (error) {
            console.error('Error saving data to localStorage:', error);
        }
    }, [namaPasien, selectedLayanan, totalBayar, isInitialized]);

    useEffect(() => {
        const paymentAmount = parseFloat(totalBayar.replace(/[^0-9]/g, '') || '0');
        const currentTotalHarga = selectedLayanan.reduce((acc, item) => acc + (item.total_harga || 0), 0);

        if (editingTransaksiId) {
            // Always calculate the full current price of all selected items (including new ones)
            // Then subtract what was previously paid to get the actual remaining balance
            const remaining = currentTotalHarga - previouslyPaid;
            // Always show the remaining balance, even if negative (which indicates overpayment)
            setSisaTagihan(remaining);
            setTotalHarga(currentTotalHarga); // Ensure total price reflects all items

            if (paymentAmount > 0) {
                // If there's a payment, calculate change based on absolute remaining
                const newRemaining = remaining - paymentAmount;
                if (newRemaining <= 0) {
                    // If payment covers the remaining, show change
                    setKembalian(Math.abs(newRemaining));
                    setSisaTagihan(0); // No more remaining balance
                } else {
                    // If payment doesn't cover remaining, show partial payment
                    setKembalian(0);
                    setSisaTagihan(newRemaining);
                }
            } else {
                // No new payment, just show remaining
                setKembalian(0);
            }
        } else {
            setSisaTagihan(0); // Not in edit mode
            const change = paymentAmount - currentTotalHarga;
            setKembalian(change > 0 ? change : 0);
        }
    }, [totalBayar, selectedLayanan, editingTransaksiId, previouslyPaid]);

    const isKurangBayar = useMemo(() => {
        const paymentInput = parseFloat(totalBayar.replace(/[^0-9]/g, '') || '0');
        if (editingTransaksiId) {
            // In edit mode, check if payment is less than remaining balance
            // and there is still a remaining balance to pay
            return sisaTagihan > 0 && paymentInput < sisaTagihan;
        }
        // In new transaction mode, check if payment is less than total price
        return paymentInput < totalHarga;
    }, [totalBayar, totalHarga, editingTransaksiId, sisaTagihan]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownVisible(false);
            }
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearching(false);
            }
            if (pasienDropdownRef.current && !pasienDropdownRef.current.contains(event.target as Node)) {
                setIsPasienDropdownVisible(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (showAllTransaksiModal) {
            if (searchTransaksi.trim() === '') {
                setFilteredTransaksi(transaksi);
            } else {
                const filtered = transaksi.filter(item => 
                    item.nama_pasien.toLowerCase().includes(searchTransaksi.toLowerCase())
                );
                setFilteredTransaksi(filtered);
            }
        }
    }, [searchTransaksi, transaksi, showAllTransaksiModal]);

    useEffect(() => {
        if (window.location.search.includes('debug=true')) {
            console.log('Transaksi data:', transaksi);
            if (transaksi.length > 0) {
                console.log('First transaction:', transaksi[0]);
                console.log('Transaction details:', transaksi[0].transaksiDetails);
                if (transaksi[0].transaksiDetails && transaksi[0].transaksiDetails.length > 0) {
                    console.log('First detail:', transaksi[0].transaksiDetails[0]);
                    console.log('Layanan in first detail:', transaksi[0].transaksiDetails[0].layanan);
                }
            }
        }
    }, [transaksi]);

    const handleDeleteTransaction = async (id: number) => {
        try {
            const toastLoading = toast.loading('Menghapus transaksi...');
            await axios.delete(route('transaksi.destroy', id));
            toast.dismiss(toastLoading);
            toast.success('Transaksi berhasil dihapus');
            setShowConfirmDelete(false);
            setConfirmDeleteId(null);
            router.reload();
        } catch (error) {
            console.error('Error deleting transaction:', error);
            toast.error('Gagal menghapus transaksi');
        }
    };

    const handleViewTransactionDetails = (transaksi: Transaksi) => {
        console.log("Transaction to view:", transaksi);
        if (transaksi.transaksiDetails) {
            console.log("Details count:", transaksi.transaksiDetails.length);
            transaksi.transaksiDetails.forEach((detail, i) => {
                console.log(`Detail ${i}:`, detail);
                console.log(`Layanan for detail ${i}:`, detail.layanan);
            });
        }
        setViewingTransaksi(transaksi);
        setShowTransaksiDetails(true);
    };

    const handlePrintReceipt = () => {
        if (!receiptData) {
            toast.error('Data receipt tidak tersedia');
            return;
        }

        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            toast.error('Popup blocked. Please allow popups for printing.');
            return;
        }

        const logoKiri = '/images/logokiri.png';
        const logoKanan = '/images/logokanan.png';

        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const today = new Date(receiptData.tanggal);
        const dayName = days[today.getDay()];
        
        const formattedDate = today.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '-');
        
        const receiptHtml = generateReceiptHtml({
            logoKiri,
            logoKanan,
            dayName,
            formattedDate,
            receiptData
        });

        printWindow.document.write(receiptHtml);
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    };

    const handleReprintReceipt = (transaction: Transaksi) => {
        if (!transaction.transaksiDetails?.length) {
            toast.error('Tidak ada detail transaksi untuk dicetak ulang.');
            return;
        }

        const layananItems = transaction.transaksiDetails.map(detail => detail.layanan);
        
        const newReceiptData = {
            id_transaksi: transaction.id_transaksi,
            nama_pasien: transaction.nama_pasien,
            layanan: layananItems,
            total_harga: transaction.total_harga,
            total_bayar: transaction.total_bayar,
            kembalian: transaction.total_bayar - transaction.total_harga,
            tanggal: transaction.created_at
        };

        setReceiptData(newReceiptData);

        setTimeout(() => {
            handlePrintReceipt();
        }, 100);
    };

    const handleSearchLayanan = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        console.log('Search input changed:', query);
        
        setSearchLayanan(query);
        
        setIsSearching(true);
        
        if (!query || query.trim() === '') {
            console.log('Empty query, showing popular items');
            setSearchResults(popularLayanan.length > 0 ? 
                popularLayanan.slice(0, 10) : 
                layanan.slice(0, 10));
            return;
        }
        
        console.log('Searching in', layanan?.length || 0, 'items');
        try {
            const normalizedQuery = query.toLowerCase().trim();
            let results: Layanan[] = [];
            
            if (layanan && Array.isArray(layanan)) {
                results = layanan.filter(item => {
                    if (!item) return false;
                    
                    const nameMatch = item.nama_layanan && 
                        item.nama_layanan.toLowerCase().includes(normalizedQuery);
                    
                    const idMatch = item.id_layanan !== undefined && 
                        String(item.id_layanan).includes(normalizedQuery);
                    
                    return nameMatch || idMatch;
                });
            }
            
            console.log(`Found ${results.length} matches`);
            setSearchResults(results);
            
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults(popularLayanan.slice(0, 10));
        }
    };
    
    const handleSearchFocus = () => {
        console.log('Search input focused');
        setIsSearching(true);
        
        if (!searchLayanan || searchLayanan.trim() === '') {
            setSearchResults(popularLayanan.length > 0 ? 
                popularLayanan.slice(0, 10) : 
                layanan.slice(0, 10));
        }
    };

    const addLayanan = (layanan: Layanan) => {
        console.log('Adding layanan:', layanan);
        if (!selectedLayanan.some(item => item.id_layanan === layanan.id_layanan)) {
            const layananToAdd = {
                ...layanan,
                total_harga: Number(layanan.total_harga)
            };
            console.log('Layanan to add (with number conversion):', layananToAdd);
            
            // Force recalculation with the new item
            const newTotal = selectedLayanan.reduce((sum, item) => sum + Number(item.total_harga || 0), 0) + Number(layananToAdd.total_harga || 0);
            console.log(`New total with ${layananToAdd.nama_layanan}: ${newTotal}`);
            
            // Update both states
            setSelectedLayanan([...selectedLayanan, layananToAdd]);
            setTotalHarga(newTotal);
            
            setSearchLayanan('');
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const handleRemoveLayanan = (id: number) => {
        // Find the item to be removed
        const itemToRemove = selectedLayanan.find(item => item.id_layanan === id);
        
        // Filter out the removed item
        const newSelectedLayanan = selectedLayanan.filter(item => item.id_layanan !== id);
        
        // Directly calculate the new total by subtracting the removed item's price
        const newTotal = itemToRemove ? 
            totalHarga - Number(itemToRemove.total_harga || 0) : 
            newSelectedLayanan.reduce((sum, item) => sum + Number(item.total_harga || 0), 0);
        
        console.log(`Removing item ID ${id}, new total: ${newTotal}`);
        
        // Update both states
        setSelectedLayanan(newSelectedLayanan);
        setTotalHarga(newTotal);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!namaPasien.trim()) {
            toast.error('Nama pasien harus diisi');
            return;
        }

        if (selectedLayanan.length === 0) {
            toast.error('Minimal pilih satu layanan');
            return;
        }

        if (isKurangBayar) {
            const errorMessage = editingTransaksiId 
                ? 'Pembayaran kurang dari sisa tagihan.'
                : 'Nominal bayar kurang dari total harga.';
            toast.error(errorMessage);
            return;
        }

        setIsProcessing(true);

        const paymentInput = parseFloat(totalBayar.replace(/[^0-9]/g, '') || '0');
        const finalTotalBayar = editingTransaksiId ? previouslyPaid + paymentInput : paymentInput;
        const layananIds = selectedLayanan.map(item => item.id_layanan);

        const dataToSubmit = {
            nama_pasien: namaPasien,
            nik_pasien: selectedPasien?.nik || null,
            layanan_ids: layananIds,
            total_harga: totalHarga,
            total_bayar: finalTotalBayar,
        };

        const onFinish = () => {
            setIsProcessing(false);
        };

        const handleSuccess = (page: any) => {
            const flash = page.props.flash as any;
            if (flash?.transaction_failed) {
                toast.error(flash.error || 'Gagal memproses transaksi.');
                return;
            }
            
            const successMessage = editingTransaksiId ? 'Transaksi berhasil diperbarui' : 'Transaksi berhasil disimpan';
            toast.success(flash?.success || successMessage);

            // Prepare data for both receipt and success modal
            const transactionId = flash?.saved_transaction_id || editingTransaksiId;
            setSavedTransactionId(transactionId);
            
            if (transactionId) {
                setReceiptData({
                    id_transaksi: transactionId,
                    nama_pasien: namaPasien,
                    layanan: selectedLayanan,
                    total_harga: totalHarga,
                    total_bayar: paymentInput,
                    kembalian: paymentInput - totalHarga,
                    tanggal: new Date().toISOString()
                });
                
                // Show success modal instead of automatically returning to transaction list
                setShowSuccessModal(true);
                
                // Clear form in background
                setNamaPasien('');
                setSelectedLayanan([]);
                setTotalBayar('');
                setTotalHarga(0);
                setKembalian(0);
                setEditingTransaksiId(null);
                setPreviouslyPaid(0);
                setSelectedPasien(null);
                localStorage.removeItem(STORAGE_KEYS.NAMA_PASIEN);
                localStorage.removeItem(STORAGE_KEYS.SELECTED_LAYANAN);
                localStorage.removeItem(STORAGE_KEYS.TOTAL_BAYAR);
            } else {
                // If no transaction ID (unusual case), fallback to old behavior
                router.reload({ only: ['transaksi'] });
            }
        };

        const handleError = (errors: any) => {
            console.error('Error submitting transaction:', errors);
            const errorMessage = editingTransaksiId ? 'Gagal memperbarui transaksi' : 'Terjadi kesalahan saat menyimpan transaksi';
            toast.error(errorMessage);
            if (errors) {
                Object.values(errors).flat().forEach((err: any) => toast.error(err));
            }
        };

        if (editingTransaksiId) {
            router.put(route('transaksi.update', editingTransaksiId), dataToSubmit, {
                onSuccess: handleSuccess,
                onError: handleError,
                onFinish: onFinish,
            });
        } else {
            router.post(route('transaksi.store'), dataToSubmit, {
                onSuccess: handleSuccess,
                onError: handleError,
                onFinish: onFinish,
            });
        }
    };

    const handleReset = () => {
        setNamaPasien('');
        setSelectedLayanan([]);
        setTotalBayar('');
        setEditingTransaksiId(null);
        setPreviouslyPaid(0);
        setSelectedPasien(null);
        localStorage.removeItem(STORAGE_KEYS.NAMA_PASIEN);
        localStorage.removeItem(STORAGE_KEYS.SELECTED_LAYANAN);
        localStorage.removeItem(STORAGE_KEYS.TOTAL_BAYAR);
        toast.info('Form transaksi telah direset.');
    };

    const handleTotalBayarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setTotalBayar(value);
    };

    const handleSearchPasien = debounce(async (query: string) => {
        if (!query || query.length < 3) {
            setPasienResults([]);
            return;
        }
        try {
            const response = await axios.get(route('transaksi.search-pasien'), { params: { search: query } });
            setPasienResults(response.data);
        } catch (error) {
            console.error('Error searching patients:', error);
            toast.error('Gagal mencari data pasien');
            setPasienResults([]);
        }
    }, 300);

    const handleSelectPasien = (pasien: Pasien) => {
        setSelectedPasien(pasien);
        setNamaPasien(pasien.nama);
        setIsPasienDropdownVisible(false);
    };

    // Calculate and update total price whenever selected services change
    useEffect(() => {
        // Ensure all items have total_harga as a number
        const updatedLayanan = selectedLayanan.map(item => ({
            ...item,
            total_harga: Number(item.total_harga)
        }));
        
        // If the conversion changed anything, update the state
        const needsUpdate = updatedLayanan.some(
            (item, idx) => typeof selectedLayanan[idx].total_harga !== 'number'
        );
        
        if (needsUpdate) {
            console.log('Converting price values to numbers');
            setSelectedLayanan(updatedLayanan);
        }
        
        // Calculate new total
        const newTotal = updatedLayanan.reduce((acc, item) => {
            const price = Number(item.total_harga) || 0;
            console.log(`Item in total calc: ${item.nama_layanan}, Price: ${price}`);
            return acc + price;
        }, 0);
        
        setTotalHarga(newTotal);
        console.log('Updated totalHarga:', newTotal, 'from', selectedLayanan.length, 'items with details:', 
            updatedLayanan.map(item => `${item.nama_layanan}: ${item.total_harga}`).join(', '));
    }, [selectedLayanan]);

    const handleEditTransaction = (transaksi: Transaksi) => {
        setEditingTransaksiId(transaksi.id_transaksi);
        setNamaPasien(transaksi.nama_pasien);
        setSelectedPasien(transaksi.pasien || null);
        
        // Convert layanan items and ensure total_harga is a number
        const layananAwal: Layanan[] = transaksi.transaksiDetails?.map(detail => ({
            ...detail.layanan,
            total_harga: Number(detail.layanan.total_harga)
        })) || [];
        
        console.log('Initial services for edit mode:', layananAwal);
        setSelectedLayanan(layananAwal);
        
        // Use total_harga instead of total_bayar for the previously paid amount
        setPreviouslyPaid(transaksi.total_harga);
        console.log('Setting previouslyPaid to total_harga:', transaksi.total_harga, 'instead of total_bayar:', transaksi.total_bayar);
        
        setTotalBayar('');
        setShowAllTransaksiModal(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info(`Mode edit untuk transaksi #${transaksi.id_transaksi}.`);
    };

    const handleRegisterPasien = async () => {
        if (!newPasien.nik || newPasien.nik.length !== 16) {
            toast.error('NIK harus 16 digit');
            return;
        }
        if (!newPasien.nama) {
            toast.error('Nama pasien harus diisi');
            return;
        }
        if (!newPasien.alamat) {
            toast.error('Alamat harus diisi');
            return;
        }
        setRegisterLoading(true);
        try {
            const response = await axios.post(route('transaksi.register-pasien'), newPasien);
            setSelectedPasien(response.data.data);
            setNamaPasien(response.data.data.nama);
            toast.success('Pasien berhasil didaftarkan');
            setShowRegisterPasien(false);
            setNewPasien({ nik: '', nama: '', alamat: '' });
        } catch (error: any) {
            const errors = error.response?.data?.errors;
            if (errors) {
                Object.values(errors).flat().forEach((err: any) => toast.error(err));
            } else {
                toast.error('Gagal mendaftarkan pasien.');
            }
        } finally {
            setRegisterLoading(false);
        }
    };

    const formatRupiah = (amount: number) => {
        // Ensure amount is a number
        const safeAmount = typeof amount === 'number' ? amount : Number(amount) || 0;
        return formatReceiptRupiah(safeAmount);
    };

    const breadcrumbs = [
        { title: 'Dashboard', href: route('dashboard') },
        { title: 'Transaksi', href: route('transaksi.index') },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Transaksi" />
            <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                    <div className="space-y-6 lg:col-span-6">
                        <Card className="shadow-lg rounded-xl border-primary/20 bg-white dark:bg-[#0A0A0A]">
                            <CardContent className="p-4">
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="cari_pasien" className="block text-sm font-medium mb-1">Cari Pasien (NIK/Nama)</label>
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input id="cari_pasien" type="text" value={searchPasien} onChange={(e) => { setSearchPasien(e.target.value); handleSearchPasien(e.target.value); setIsPasienDropdownVisible(e.target.value.length >= 3); }} onFocus={() => { if (searchPasien.length >= 3) setIsPasienDropdownVisible(true); }} placeholder="Cari berdasarkan NIK atau nama" className="pl-8" />
                                        </div>
                                        {isPasienDropdownVisible && (
                                            <div ref={pasienDropdownRef} className="border rounded-lg shadow-md max-h-60 overflow-y-auto mt-1">
                                                {pasienResults.length > 0 ? pasienResults.map((pasien) => (
                                                    <div key={pasien.nik} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#111] cursor-pointer" onClick={() => handleSelectPasien(pasien)}>
                                                        <div className="font-medium">{pasien.nama}</div>
                                                        <div className="text-xs text-muted-foreground">NIK: {pasien.nik}</div>
                                                    </div>
                                                )) : (
                                                    <div className="p-4 text-center">
                                                        <p className="text-muted-foreground">Tidak ada hasil</p>
                                                    </div>
                                                )}
                                                <div className="p-2 text-center border-t">
                                                    <Button variant="link" className="text-primary text-xs" onClick={() => { setShowRegisterPasien(true); setIsPasienDropdownVisible(false); if (/^\d+$/.test(searchPasien)) { setNewPasien({ ...newPasien, nik: searchPasien, nama: '' }); } else { setNewPasien({ ...newPasien, nama: searchPasien, nik: '' }); } }}>Daftarkan Pasien Baru</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="nama_pasien" className="block text-sm font-medium mb-1">Nama Pasien {selectedPasien && <Badge className="ml-2">Terdaftar</Badge>}</label>
                                        <Input id="nama_pasien" value={namaPasien} onChange={(e) => { setNamaPasien(e.target.value); if (selectedPasien && selectedPasien.nama !== e.target.value) setSelectedPasien(null); }} placeholder="Masukkan nama pasien" />
                                    </div>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <label htmlFor="layanan" className="block text-sm font-medium">Layanan</label>
                                    <div ref={searchRef} className="relative">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="layanan" type="text" value={searchLayanan} onChange={handleSearchLayanan} onFocus={handleSearchFocus} placeholder="Cari layanan" className="pl-8" />
                                        {isSearching && (
                                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#111] border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {searchResults.map((item) => (
                                                    <div key={item.id_layanan} className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-[#222] cursor-pointer flex justify-between items-center" onClick={() => addLayanan(item)}>
                                                        <span>{item.nama_layanan}</span>
                                                        <span className="font-semibold text-primary">{formatRupiah(item.total_harga)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="shadow-lg rounded-xl">
                            <CardContent className="p-4">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-primary">Layanan Populer</h3>
                                    <Button variant="outline" size="sm" onClick={() => { setShowAllTransaksiModal(true); setFilteredTransaksi(transaksi); setSearchTransaksi(''); }}>Semua Transaksi</Button>
                                </div>
                                <Table>
                                    <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead className="text-right">Harga</TableHead><TableHead className="text-right">Aksi</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {popularLayanan.slice(0, 5).map((item) => (
                                            <TableRow key={item.id_layanan}>
                                                <TableCell>{item.nama_layanan}</TableCell>
                                                <TableCell className="text-right">{formatRupiah(item.total_harga)}</TableCell>
                                                <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => addLayanan(item)}><Plus className="h-4 w-4 mr-1" />Tambah</Button></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                    <div className="space-y-6 lg:col-span-4">
                        <Card className="shadow-xl rounded-xl">
                            <CardContent className="p-5">
                                <div className="flex items-center space-x-2 mb-4"><ShoppingBag className="h-5 w-5 text-primary" /><h3 className="text-base font-semibold">Ringkasan Transaksi</h3></div>
                                <div className="space-y-4">
                                    {selectedLayanan.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">Belum ada layanan dipilih</div>
                                     ) : (
                                         <div className="space-y-4">
                                             <div className="max-h-60 overflow-y-auto custom-scrollbar">
                                                 {selectedLayanan.map((layanan) => (
                                                     <div key={layanan.id_layanan} className="flex justify-between items-center">
                                                         <span className="text-sm flex-1 truncate pr-2">{layanan.nama_layanan}</span>
                                                         <span className="text-sm font-medium">{formatRupiah(layanan.total_harga)}</span>
                                                         <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleRemoveLayanan(layanan.id_layanan)}><X className="h-4 w-4" /></Button>
                                                     </div>
                                                 ))}
                                             </div>
                                             <Separator />
                                             <div className="flex justify-between font-bold text-lg">
                                                <span>Total</span>
                                                {/* Calculate total directly from the current items */}
                                                <span>{formatRupiah(selectedLayanan.reduce((acc, item) => {
                                                    const itemPrice = Number(item.total_harga) || 0;
                                                    console.log(`Item: ${item.nama_layanan}, Price: ${itemPrice}`);
                                                    return acc + itemPrice;
                                                }, 0))}</span>
                                             </div>
                                         </div>
                                     )}
                                </div>
                                <Separator className="my-5" />
                                <div className="space-y-4">
                                    {editingTransaksiId ? (
                                        <>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm text-muted-foreground">Sudah Dibayar</span>
                                                <span className="font-bold text-green-600">{formatRupiah(previouslyPaid)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium">Sisa Tagihan</span>
                                                <span className="font-bold text-destructive">{formatRupiah(sisaTagihan)}</span>
                                            </div>
                                            <div>
                                                <label htmlFor="total_bayar" className="block text-sm font-medium mb-1">Pembayaran Tagihan</label>
                                                <div className="relative">
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                                                    <Input 
                                                        id="total_bayar" 
                                                        type="text" 
                                                        value={totalBayar ? new Intl.NumberFormat('id-ID').format(Number(totalBayar)) : ''} 
                                                        onChange={handleTotalBayarChange} 
                                                        className="pl-8 text-right" 
                                                        placeholder="0" 
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div>
                                            <label htmlFor="total_bayar" className="block text-sm font-medium mb-1">Nominal Bayar</label>
                                            <div className="relative">
                                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">Rp</span>
                                                <Input 
                                                    id="total_bayar" 
                                                    type="text" 
                                                    value={totalBayar ? new Intl.NumberFormat('id-ID').format(Number(totalBayar)) : ''} 
                                                    onChange={handleTotalBayarChange} 
                                                    placeholder="0" 
                                                    className="pl-8 text-right font-semibold text-lg" 
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-base">
                                        <span>Kembalian</span>
                                        <span className={`font-semibold ${kembalian < 0 ? 'text-destructive' : 'text-green-600'}`}>{formatRupiah(kembalian)}</span>
                                    </div>
                                </div>
                                <div className="mt-6">
                                    <Button className="w-full font-medium rounded-xl py-6 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={isProcessing || isKurangBayar} onClick={handleSubmit}>
                                        {isProcessing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <CreditCard className="mr-2 h-5 w-5" />}
                                        {editingTransaksiId ? 'Update & Bayar' : 'Konfirmasi Pembayaran'}
                                    </Button>
                                    <Button variant="outline" className="w-full mt-2" onClick={handleReset}>Reset</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={showAllTransaksiModal} onOpenChange={setShowAllTransaksiModal}><DialogContent className="max-w-4xl"><DialogHeader><DialogTitle>Semua Transaksi</DialogTitle></DialogHeader><div className="relative"><Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" /><Input placeholder="Cari berdasarkan nama pasien..." value={searchTransaksi} onChange={(e) => setSearchTransaksi(e.target.value)} className="pl-8" /></div><div className="max-h-[60vh] overflow-y-auto"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Nama Pasien</TableHead><TableHead>Total</TableHead><TableHead>Tanggal</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{filteredTransaksi.map((item) => (<TableRow key={item.id_transaksi}><TableCell>{item.id_transaksi}</TableCell><TableCell>{item.nama_pasien}</TableCell><TableCell>{formatRupiah(item.total_harga)}</TableCell><TableCell>{new Date(item.created_at).toLocaleDateString('id-ID')}</TableCell><TableCell><div className="flex items-center space-x-1"><Button variant="ghost" size="icon" onClick={() => handleViewTransactionDetails(item)}><Eye className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleReprintReceipt(item)}><Printer className="h-4 w-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleEditTransaction(item)}><Pencil className="h-4 w-4 text-blue-500" /></Button><Button size="icon" variant="ghost" className="text-destructive" onClick={() => { setConfirmDeleteId(item.id_transaksi); setShowConfirmDelete(true); }}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></div></DialogContent></Dialog>
            <Dialog open={showTransaksiDetails} onOpenChange={setShowTransaksiDetails}><DialogContent><DialogHeader><DialogTitle>Detail Transaksi #{viewingTransaksi?.id_transaksi}</DialogTitle></DialogHeader>{viewingTransaksi && (<div><p><strong>Nama Pasien:</strong> {viewingTransaksi.nama_pasien}</p><p><strong>Total Harga:</strong> {formatRupiah(viewingTransaksi.total_harga)}</p><p><strong>Tanggal:</strong> {new Date(viewingTransaksi.created_at).toLocaleString('id-ID')}</p><h4 className="font-semibold mt-4">Layanan:</h4><ul>{viewingTransaksi.transaksiDetails?.map(detail => <li key={detail.id_transaksi_detail}>{detail.layanan.nama_layanan} - {formatRupiah(detail.layanan.total_harga)}</li>)}</ul></div>)}</DialogContent></Dialog>
            <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}><DialogContent><DialogHeader><DialogTitle>Konfirmasi Hapus</DialogTitle></DialogHeader><p>Apakah Anda yakin ingin menghapus transaksi ini?</p><DialogFooter><Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Batal</Button><Button variant="destructive" onClick={() => confirmDeleteId && handleDeleteTransaction(confirmDeleteId)}>Hapus</Button></DialogFooter></DialogContent></Dialog>
            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transaksi Berhasil</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="text-center mb-4 text-green-600">
                            <CheckCircle2 className="h-16 w-16 mx-auto" />
                        </div>
                        <p className="text-center text-lg font-medium mb-2">Transaksi #{savedTransactionId} telah berhasil disimpan</p>
                        <p className="text-center text-muted-foreground mb-4">Silahkan cetak struk pembayaran atau kembali ke halaman transaksi</p>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => {
                            setShowSuccessModal(false);
                            router.reload({ only: ['transaksi'] });
                        }}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                        <Button className="flex-1" onClick={() => {
                            setShowSuccessModal(false);
                            setShowReceiptModal(true);
                        }}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Struk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Struk Pembayaran</DialogTitle>
                    </DialogHeader>
                    <p>Cetak struk pembayaran transaksi #{savedTransactionId}?</p>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setShowReceiptModal(false);
                            router.reload({ only: ['transaksi'] });
                        }}>Tutup</Button>
                        <Button onClick={handlePrintReceipt}>
                            <Printer className="mr-2 h-4 w-4" />Cetak Struk
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={showRegisterPasien} onOpenChange={setShowRegisterPasien}><DialogContent><DialogHeader><DialogTitle>Daftarkan Pasien Baru</DialogTitle></DialogHeader><div className="space-y-4"><div><label htmlFor="new_nik">NIK</label><Input id="new_nik" value={newPasien.nik} onChange={(e) => setNewPasien({...newPasien, nik: e.target.value})} maxLength={16} /></div><div><label htmlFor="new_nama">Nama</label><Input id="new_nama" value={newPasien.nama} onChange={(e) => setNewPasien({...newPasien, nama: e.target.value})} /></div><div><label htmlFor="new_alamat">Alamat</label><Input id="new_alamat" value={newPasien.alamat} onChange={(e) => setNewPasien({...newPasien, alamat: e.target.value})} /></div></div><DialogFooter><Button variant="outline" onClick={() => setShowRegisterPasien(false)}>Batal</Button><Button onClick={handleRegisterPasien} disabled={registerLoading}>{registerLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Daftar</Button></DialogFooter></DialogContent></Dialog>
        </AppLayout>
    );
}
