<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class transaksi extends Model
{
    protected $table = 'transaksi';
    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'id_transaksi',
        'id_admin',
        'nama_pasien',
        'nik_pasien', // Tambahkan field nik_pasien
        'total_harga',
        'total_bayar',
    ];

    protected $casts = [
        'total_harga' => 'decimal:2',
        'total_bayar' => 'decimal:2',
    ];
    
    /**
     * Get the transaction details for this transaction
     */
    public function transaksiDetails()
    {
        return $this->hasMany(transaksi_detail::class, 'id_transaksi', 'id_transaksi');
    }
    
    /**
     * Get the patient data for this transaction
     */
    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'nik_pasien', 'nik');
    }
}
