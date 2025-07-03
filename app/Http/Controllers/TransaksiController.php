<?php

namespace App\Http\Controllers;

use App\Models\transaksi;
use App\Models\transaksi_detail;
use App\Models\layanan;
use App\Models\Pasien;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class TransaksiController extends Controller
{
    /**
     * Display a listing of the transactions.
     */
    public function index()
    {
        $transaksiCollection = transaksi::with(['transaksiDetails.layanan', 'pasien'])->latest()->get();
        
        $transaksi = $transaksiCollection->map(function($item) {
            $namaPasien = $item->pasien ? $item->pasien->nama : $item->nama_pasien;

            $details = $item->transaksiDetails->map(function($detail) {
                return [
                    'id_transaksi_detail' => $detail->id_transaksi_detail,
                    'id_transaksi' => $detail->id_transaksi,
                    'id_layanan' => $detail->id_layanan,
                    'created_at' => $detail->created_at,
                    'updated_at' => $detail->updated_at,
                    'layanan' => $detail->layanan
                ];
            });
            
            return [
                'id_transaksi' => $item->id_transaksi,
                'id_admin' => $item->id_admin,
                'nama_pasien' => $namaPasien,
                'pasien' => $item->pasien,
                'total_harga' => $item->total_harga,
                'total_bayar' => $item->total_bayar,
                'created_at' => $item->created_at,
                'updated_at' => $item->updated_at,
                'transaksiDetails' => $details->toArray()
            ];
        });
        
        $layanan = layanan::all();

        $popularLayanan = layanan::select('layanan.*')
            ->selectRaw('COUNT(transaksi_detail.id_layanan) as transaction_count')
            ->leftJoin('transaksi_detail', 'layanan.id_layanan', '=', 'transaksi_detail.id_layanan')
            ->groupBy('layanan.id_layanan', 'layanan.nama_layanan', 'layanan.trf_kunjungan', 
                     'layanan.layanan_dokter', 'layanan.layanan_tindakan', 'layanan.total_harga',
                     'layanan.created_at', 'layanan.updated_at')
            ->orderByDesc('transaction_count')
            ->limit(10)
            ->get();

        if ($popularLayanan->isEmpty() && $layanan->isNotEmpty()) {
            $popularLayanan = $layanan->map(function($item) {
                $item->transaction_count = 0;
                return $item;
            })->take(10);
        }

        return Inertia::render('transaksi/index', [
            'transaksi' => $transaksi,
            'layanan' => $layanan,
            'popularLayanan' => $popularLayanan
        ]);
    }

    /**
     * Store a newly created transaction in storage.
     */
    public function store(Request $request)
    {
        $messages = [
            'nama_pasien.required' => 'Nama pasien harus diisi',
            'nama_pasien.max' => 'Nama pasien maksimal 50 karakter',
            'layanan_ids.required' => 'Layanan harus dipilih',
            'total_bayar.required' => 'Nominal bayar harus diisi',
            'total_bayar.numeric' => 'Nominal bayar harus berupa angka',
        ];
        
        $validated = $request->validate([
            'nama_pasien' => 'required|string|max:50',
            'nik_pasien' => 'nullable|string|size:16|exists:pasien,nik',
            'layanan_ids' => 'required|array',
            'layanan_ids.*' => 'exists:layanan,id_layanan',
            'total_harga' => 'required|numeric',
            'total_bayar' => 'required|numeric',
        ], $messages);

        // Logging request data untuk debugging
        \Log::info('Mencoba menyimpan transaksi baru', [
            'request_data' => $request->all()
        ]);

        DB::beginTransaction();
        try {
            $transaksi = new transaksi();
            $transaksi->nama_pasien = $request->nama_pasien;
            if ($request->has('nik_pasien') && $request->nik_pasien) {
                $transaksi->nik_pasien = $request->nik_pasien;
            }
            $transaksi->total_harga = $request->total_harga;
            $transaksi->total_bayar = $request->total_bayar;
            
            $transaksi->id_admin = auth()->id() ?? 1; 
            
            // Simpan transaksi dan log hasilnya
            $saveResult = $transaksi->save();
            \Log::info('Hasil penyimpanan transaksi utama', [
                'id_transaksi' => $transaksi->id_transaksi,
                'save_result' => $saveResult
            ]);
            
            if (!$saveResult) {
                throw new \Exception('Gagal menyimpan transaksi utama');
            }
            
            // Pastikan transaksi berhasil disimpan dan punya ID valid
            if (!$transaksi->id_transaksi) {
                throw new \Exception('Transaksi tersimpan tetapi tidak mendapatkan ID valid');
            }
            
            // Simpan detail transaksi
            $detailsSaved = 0;
            foreach ($request->layanan_ids as $key => $layanan_id) {
                try {
                    $detail = new transaksi_detail();
                    $detail->id_transaksi = $transaksi->id_transaksi;
                    $detail->id_layanan = $layanan_id;
                    
                    $detailSaveResult = $detail->save();
                    
                    if ($detailSaveResult) {
                        $detailsSaved++;
                        \Log::info('Detail transaksi tersimpan', [
                            'id_transaksi_detail' => $detail->id_transaksi_detail,
                            'id_transaksi' => $detail->id_transaksi,
                            'id_layanan' => $detail->id_layanan
                        ]);
                    } else {
                        \Log::warning('Gagal menyimpan detail transaksi', [
                            'id_transaksi' => $transaksi->id_transaksi,
                            'id_layanan' => $layanan_id
                        ]);
                    }
                } catch (\Exception $detailEx) {
                    \Log::error('Error saat menyimpan detail transaksi', [
                        'id_transaksi' => $transaksi->id_transaksi,
                        'id_layanan' => $layanan_id,
                        'error' => $detailEx->getMessage()
                    ]);
                    throw $detailEx; 
                }
            }
            
            // Pastikan minimal ada satu detail transaksi tersimpan
            if ($detailsSaved === 0) {
                throw new \Exception('Transaksi utama tersimpan tetapi tidak ada detail yang tersimpan');
            }

            DB::commit();
            
            // Log transaksi yang berhasil disimpan
            \Log::info('Transaksi berhasil disimpan', [
                'id_transaksi' => $transaksi->id_transaksi,
                'nama_pasien' => $transaksi->nama_pasien,
                'nik_pasien' => $transaksi->nik_pasien,
                'total_harga' => $transaksi->total_harga,
                'total_bayar' => $transaksi->total_bayar
            ]);
            
            session()->flash('saved_transaction_id', $transaksi->id_transaksi);
            
            return redirect()->route('transaksi.index')
                ->with('success', 'Transaksi berhasil disimpan')
                ->with('saved_transaction_id', $transaksi->id_transaksi);
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log error
            \Log::error('Transaksi gagal disimpan: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            return redirect()->route('transaksi.index')
                ->with('error', 'Transaksi gagal disimpan: ' . $e->getMessage())
                ->with('transaction_failed', true);
        }
    }

    /**
     * Get layanan by ID or name for search functionality
     */
    public function searchLayanan(Request $request)
    {
        $search = $request->input('search');
        
        $layanan = layanan::where('nama_layanan', 'LIKE', "%{$search}%")
            ->orWhere('id_layanan', 'LIKE', "%{$search}%")
            ->select('id_layanan', 'nama_layanan', 'total_harga')
            ->get();
        
        return response()->json($layanan);
    }
    
    /**
     * Search for patients by NIK or name
     */
    public function searchPasien(Request $request)
    {
        $search = $request->input('search');
        
        if (empty($search)) {
            return response()->json([]);
        }
        
        try {
            $pasien = Pasien::where('nik', 'LIKE', "%{$search}%")
                ->orWhere('nama', 'LIKE', "%{$search}%")
                ->limit(10)
                ->get();
            
            return response()->json($pasien);
        } catch (\Exception $e) {
            \Log::error('Error searching patients: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
    
    /**
     * Register a new patient
     */
    public function registerPasien(Request $request)
    {
        \Log::info('Registering new patient', $request->all());
        
        $messages = [
            'nik.required' => 'NIK harus diisi',
            'nik.size' => 'NIK harus 16 digit',
            'nik.unique' => 'NIK sudah terdaftar',
            'nama.required' => 'Nama pasien harus diisi',
            'nama.max' => 'Nama maksimal 255 karakter',
            'alamat.required' => 'Alamat harus diisi',
        ];
        
        try {
            $validated = $request->validate([
                'nik' => 'required|string|size:16|unique:pasien,nik',
                'nama' => 'required|string|max:255',
                'alamat' => 'required|string',
            ], $messages);

            $pasien = Pasien::create($validated);
            
            \Log::info('Patient registered successfully', ['nik' => $pasien->nik]);
            
            return response()->json([
                'success' => true,
                'message' => 'Data pasien berhasil disimpan',
                'data' => $pasien
            ]);
        } catch (\Exception $e) {
            \Log::error('Error registering patient: ' . $e->getMessage(), [
                'exception' => $e,
                'request' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Terjadi kesalahan: ' . $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Update the specified transaction in storage.
     */
    public function update(Request $request, $id)
    {
        $messages = [
            'layanan_ids.required' => 'Layanan harus dipilih',
            'total_bayar.required' => 'Nominal bayar harus diisi',
            'total_bayar.numeric' => 'Nominal bayar harus berupa angka',
        ];
        
        $request->validate([
            'layanan_ids' => 'required|array',
            'layanan_ids.*' => 'exists:layanan,id_layanan',
            'total_harga' => 'required|numeric',
            'total_bayar' => 'required|numeric',
        ], $messages);

        \Log::info('Mencoba memperbarui transaksi', [
            'id_transaksi' => $id,
            'request_data' => $request->all()
        ]);

        DB::beginTransaction();
        try {
            $transaksi = transaksi::findOrFail($id);
            
            $transaksi->total_harga = $request->total_harga;
            $transaksi->total_bayar = $request->total_bayar;
            $transaksi->save();
            
            transaksi_detail::where('id_transaksi', $id)->delete();
            
            $detailsSaved = 0;
            foreach ($request->layanan_ids as $layanan_id) {
                $detail = new transaksi_detail();
                $detail->id_transaksi = $transaksi->id_transaksi;
                $detail->id_layanan = $layanan_id;
                
                if ($detail->save()) {
                    $detailsSaved++;
                }
            }
            
            if ($detailsSaved === 0) {
                throw new \Exception('Transaksi diperbarui tetapi tidak ada detail yang tersimpan');
            }

            DB::commit();
            
            \Log::info('Transaksi berhasil diperbarui', [
                'id_transaksi' => $transaksi->id_transaksi,
            ]);
            
            return redirect()->route('transaksi.index')
                ->with('success', 'Transaksi berhasil diperbarui');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            \Log::error('Transaksi gagal diperbarui: ' . $e->getMessage(), [
                'exception' => $e,
                'request_data' => $request->all()
            ]);
            
            return redirect()->route('transaksi.index')
                ->with('error', 'Transaksi gagal diperbarui: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified transaction from storage.
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $transaksi = transaksi::findOrFail($id);
            
            transaksi_detail::where('id_transaksi', $id)->delete();
            
            $transaksi->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Transaksi berhasil dihapus'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus transaksi: ' . $e->getMessage()
            ], 500);
        }
    }
}
