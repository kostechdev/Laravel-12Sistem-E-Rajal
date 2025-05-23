<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Pasien;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class PasienController extends Controller
{
    /**
     * Display a listing of the patients.
     */
    public function index(Request $request)
    {
        $search = $request->input('search');
        
        $pasien = Pasien::when($search, function($query) use ($search) {
            return $query->where('nama', 'like', "%$search%")
                       ->orWhere('nik', 'like', "%$search%");
        })
        ->orderBy('created_at', 'desc')
        ->paginate(10);

        return Inertia::render('admin/pasien/index', [
            'pasien' => $pasien,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Show the form for creating a new patient.
     */
    public function create()
    {
        return Inertia::render('admin/pasien/create');
    }

    /**
     * Store a newly created patient in storage.
     */
    public function store(Request $request)
    {
        $messages = [
            'nik.required' => 'NIK harus diisi',
            'nik.size' => 'NIK harus 16 digit',
            'nik.unique' => 'NIK sudah terdaftar',
            'nama.required' => 'Nama pasien harus diisi',
            'nama.max' => 'Nama maksimal 255 karakter',
            'alamat.required' => 'Alamat harus diisi',
        ];
        
        $validated = $request->validate([
            'nik' => 'required|string|size:16|unique:pasien',
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
        ], $messages);

        try {
            Pasien::create($validated);
            return redirect()->route('admin.pasien.index')->with('success', 'Data pasien berhasil disimpan');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the form for editing the specified patient.
     */
    public function edit($nik)
    {
        $pasien = Pasien::where('nik', $nik)->firstOrFail();
        
        return Inertia::render('admin/pasien/edit', [
            'pasien' => $pasien
        ]);
    }

    /**
     * Update the specified patient in storage.
     */
    public function update(Request $request, $nik)
    {
        $pasien = Pasien::where('nik', $nik)->firstOrFail();
        
        $messages = [
            'nik.required' => 'NIK harus diisi',
            'nik.size' => 'NIK harus 16 digit',
            'nik.unique' => 'NIK sudah terdaftar',
            'nama.required' => 'Nama pasien harus diisi',
            'nama.max' => 'Nama maksimal 255 karakter',
            'alamat.required' => 'Alamat harus diisi',
        ];
        
        $validated = $request->validate([
            'nik' => 'required|string|size:16|unique:pasien,nik,' . $nik . ',nik',
            'nama' => 'required|string|max:255',
            'alamat' => 'required|string',
        ], $messages);

        try {
            $pasien->update($validated);
            return redirect()->route('admin.pasien.index')->with('success', 'Data pasien berhasil diperbarui');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified patient from storage.
     */
    public function destroy($nik)
    {
        try {
            $pasien = Pasien::where('nik', $nik)->firstOrFail();
            $pasien->delete();
            return redirect()->route('admin.pasien.index')->with('success', 'Data pasien berhasil dihapus');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Terjadi kesalahan: ' . $e->getMessage()]);
        }
    }
}
