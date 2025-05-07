<?php

namespace App\Http\Controllers;

use App\Models\layanan;
use App\Models\transaksi;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display the dashboard with statistics.
     */
    public function index()
    {
        // Count total layanan
        $totalLayanan = layanan::count();
        
        // Count total transaksi
        $totalTransaksi = transaksi::count();
        
        // Get daily transaction counts for the last 7 days for chart
        $transactionsByDay = transaksi::select(
            DB::raw('DATE(created_at) as date'),
            DB::raw('COUNT(*) as count')
        )
            ->whereDate('created_at', '>=', Carbon::now()->subDays(6))
            ->groupBy('date')
            ->orderBy('date')
            ->get();
        
        // Format data for chart
        $labels = [];
        $data = [];
        
        // Define the order of days (Monday to Saturday)
        $orderedDays = [1, 2, 3, 4, 5, 6]; // Monday=1, Tuesday=2, ..., Saturday=6
        
        // Create array with ordered days (Monday to Saturday)
        foreach ($orderedDays as $dayNumber) {
            $dayName = $this->getDayName($dayNumber);
            $labels[] = $dayName;
            
            // Find if we have data for this day in the last 7 days
            $found = false;
            for ($i = 6; $i >= 0; $i--) {
                $date = Carbon::now()->subDays($i);
                if ($date->dayOfWeek == $dayNumber) {
                    // Check if we have transaction data for this date
                    foreach ($transactionsByDay as $transaction) {
                        if (Carbon::parse($transaction->date)->isSameDay($date)) {
                            $data[] = $transaction->count;
                            $found = true;
                            break;
                        }
                    }
                    break;
                }
            }
            
            // If no data for this day, add 0
            if (!$found) {
                $data[] = 0;
            }
        }
        
        return Inertia::render('dashboard', [
            'stats' => [
                'totalLayanan' => $totalLayanan,
                'totalTransaksi' => $totalTransaksi,
                'chartData' => [
                    'labels' => $labels,
                    'data' => $data
                ]
            ]
        ]);
    }
    
    /**
     * Get Indonesian day name from day of week number
     */
    private function getDayName($dayNumber)
    {
        $days = [
            'Minggu',
            'Senin',
            'Selasa',
            'Rabu',
            'Kamis',
            'Jumat',
            'Sabtu'
        ];
        
        return $days[$dayNumber];
    }
}
