<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transaksi', function (Blueprint $table) {
            $table->id('id_transaksi');
            $table->unsignedBigInteger('id_admin');
            $table->foreign('id_admin')->references('id_admin')->on('admin');
            $table->string('nama_pasien', 50);
            $table->string('nik_pasien', 16)->nullable();
            $table->foreign('nik_pasien')->references('nik')->on('pasien')->onDelete('set null');
            $table->decimal('total_harga', 10, 2);
            $table->decimal('total_bayar', 10, 2);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksi');
    }
};
