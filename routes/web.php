<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Admin\LayananController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\LaporanController;
use App\Http\Controllers\DashboardController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // User management routes
    Route::resource('pengguna', UserController::class)->parameters([
        'pengguna' => 'id_user'
    ]);
    
    // Layanan management routes
    Route::resource('layanan', LayananController::class);
    
    // Pasien management routes
    Route::resource('pasien', App\Http\Controllers\Admin\PasienController::class)->names([
        'index' => 'admin.pasien.index',
        'create' => 'admin.pasien.create',
        'store' => 'admin.pasien.store',
        'edit' => 'admin.pasien.edit',
        'update' => 'admin.pasien.update',
        'destroy' => 'admin.pasien.destroy'
    ])->parameters([
        'pasien' => 'nik'
    ]);
    
    // Transaksi routes
    Route::resource('transaksi', TransaksiController::class);
    Route::get('search-layanan', [TransaksiController::class, 'searchLayanan'])->name('transaksi.search-layanan');
    Route::get('search-pasien', [TransaksiController::class, 'searchPasien'])->name('transaksi.search-pasien');
    Route::post('register-pasien', [TransaksiController::class, 'registerPasien'])->name('transaksi.register-pasien');
    
    // Laporan routes
    Route::get('laporan/harian', [LaporanController::class, 'harian'])->name('laporan.harian');
    Route::get('laporan/mingguan', [LaporanController::class, 'mingguan'])->name('laporan.mingguan');
    Route::get('laporan/bulanan', [LaporanController::class, 'bulanan'])->name('laporan.bulanan');
    
    // Laporan API routes
    Route::get('api/laporan/harian', [LaporanController::class, 'apiHarian']);
    Route::get('api/laporan/mingguan', [LaporanController::class, 'apiMingguan']);
    Route::get('api/laporan/bulanan', [LaporanController::class, 'apiBulanan']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
