<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pasien extends Model
{
    use HasFactory;

    protected $table = 'pasien';
    protected $primaryKey = 'nik';
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'nik',
        'nama',
        'alamat'
    ];
}
