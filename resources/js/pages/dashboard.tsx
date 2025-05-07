import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type SharedData } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { TrendingUp } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Chart colors
const CHART_COLOR = '#3b82f6'; // Blue color

export default function Dashboard() {
    const { stats } = usePage<SharedData>().props as any;
    
    // Transform the stats data for the chart
    const chartData = stats?.chartData?.labels.map((day: string, index: number) => ({
        day: day,
        transaksi: stats.chartData.data[index] || 0
    })) || [];
    
    // Calculate percentage change
    const calculateTrend = () => {
        if (!chartData || chartData.length < 2) return { value: 0, isUp: true };
        
        const lastValue = chartData[chartData.length - 1].transaksi;
        const previousValue = chartData[chartData.length - 2].transaksi;
        
        if (previousValue === 0) return { value: lastValue > 0 ? 100 : 0, isUp: lastValue > 0 };
        
        const percentChange = ((lastValue - previousValue) / previousValue) * 100;
        return {
            value: Math.abs(parseFloat(percentChange.toFixed(1))),
            isUp: percentChange >= 0
        };
    };
    
    const trend = calculateTrend();
    
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-6 p-4 bg-white dark:bg-[#0A0A0A] text-gray-800 dark:text-white transition-colors duration-200">
                {/* Header */}
                <div className="pt-4 pb-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">Selamat Datang Di Sistem RAJAL</h1>
                </div>
                
                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Data Layanan Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex justify-between items-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                        <div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Data Layanan</h2>
                            <p className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">{stats?.totalLayanan || 0}</p>
                        </div>
                        <div className="text-4xl bg-blue-100 dark:bg-blue-900/30 p-4 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11h6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 15h6" />
                            </svg>
                        </div>
                    </div>
                    
                    {/* Jumlah Transaksi Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex justify-between items-center shadow-lg border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
                        <div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-700 dark:text-gray-200">Jumlah Transaksi</h2>
                            <p className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-400">{stats?.totalTransaksi || 0}</p>
                        </div>
                        <div className="text-4xl bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-full">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                    </div>
                </div>
                
                {/* Chart Card */}
                <Card className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-lg rounded-xl overflow-hidden">
                    <CardHeader className="border-b border-gray-100 dark:border-gray-700">
                        <CardTitle className="text-gray-800 dark:text-white font-bold">Grafik Transaksi</CardTitle>
                        <CardDescription className="text-gray-500 dark:text-gray-300">
                            Menampilkan jumlah transaksi selama seminggu terakhir
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex flex-col w-full">
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{
                                            top: 10,
                                            right: 30,
                                            left: 0,
                                            bottom: 0,
                                        }}
                                    >
                                        <defs>
                                            <linearGradient id="colorTransaksi" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={CHART_COLOR} stopOpacity={0.8}/>
                                                <stop offset="95%" stopColor={CHART_COLOR} stopOpacity={0.1}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" className="dark:stroke-gray-700" />
                                        <XAxis 
                                            dataKey="day" 
                                            tick={false}
                                            tickLine={false}
                                            axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                                            className="dark:text-gray-300"
                                        />
                                        <YAxis hide={true} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                backgroundColor: 'var(--tooltip-bg, white)', 
                                                border: '1px solid var(--tooltip-border, rgba(0,0,0,0.1))',
                                                borderRadius: '0.5rem',
                                                color: 'var(--tooltip-text, #374151)'
                                            }}
                                            labelStyle={{ color: 'var(--tooltip-label, #374151)', fontWeight: 'bold', marginBottom: '0.5rem' }}
                                            itemStyle={{ color: 'var(--tooltip-item, #374151)' }}
                                            formatter={(value) => [`${value} Transaksi`, 'Jumlah']}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="transaksi" 
                                            stroke={CHART_COLOR} 
                                            fillOpacity={1} 
                                            fill="url(#colorTransaksi)" 
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            
                            {/* Custom day labels */}
                            <div className="flex justify-between px-4 mt-2">
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Senin</div>
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Selasa</div>
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Rabu</div>
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Kamis</div>
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Jumat</div>
                                <div className="text-center text-sm text-gray-600 dark:text-gray-300 font-medium">Sabtu</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add CSS variables for dark/light mode */}
            <style dangerouslySetInnerHTML={{ __html: `
                :root {
                    --color-text: #374151;
                    --tooltip-bg: white;
                    --tooltip-border: rgba(0,0,0,0.1);
                    --tooltip-text: #374151;
                    --tooltip-label: #374151;
                    --tooltip-item: #374151;
                }
                .dark {
                    --color-text: #f3f4f6;
                    --tooltip-bg: #1f2937;
                    --tooltip-border: rgba(255,255,255,0.1);
                    --tooltip-text: white;
                    --tooltip-label: white;
                    --tooltip-item: white;
                }
            `}} />
        </AppLayout>
    );
}
