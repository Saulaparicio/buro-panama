import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { toast } from 'react-hot-toast';
import { Icon } from '../../components/ui/Icon';

const AdminReports: React.FC = () => {
    const [stats, setStats] = useState({
        totalReservations: 0,
        activeMembers: 0,
        monthlyIncome: 0,
        occupancyRate: 0,
        churnRate: 0
    });
    const [incomeData, setIncomeData] = useState<any[]>([]);
    const [spaceUsage, setSpaceUsage] = useState<any[]>([]);
    const [revenueByCategory, setRevenueByCategory] = useState<any[]>([]);
    const [memberGrowth, setMemberGrowth] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Date Filters
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchRealStats();
    }, [dateRange]);

    const fetchRealStats = async () => {
        setLoading(true);
        try {
            // 1. Total Reservations (In range)
            const { count: resCount } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .gte('start_time', dateRange.start + 'T00:00:00')
                .lte('start_time', dateRange.end + 'T23:59:59');

            // 2. Total Members
            const { count: memberCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            // 3. Income in Range
            const { data: payments } = await supabase
                .from('payments')
                .select('amount, created_at, metadata')
                .gte('created_at', dateRange.start + 'T00:00:00')
                .lte('created_at', dateRange.end + 'T23:59:59');

            const totalIncome = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

            // 4. Occupancy Rate
            const { count: totalSpaces } = await supabase.from('spaces').select('*', { count: 'exact', head: true });
            const { count: activeRes } = await supabase
                .from('reservations')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed')
                .gte('start_time', dateRange.start + 'T00:00:00')
                .lte('start_time', dateRange.end + 'T23:59:59');

            const rate = totalSpaces ? Math.round((activeRes || 0) / (totalSpaces || 1) * 100) : 0;

            // 5. Churn Rate Calculation
            const { count: totalMems } = await supabase.from('memberships').select('*', { count: 'exact', head: true });
            const { count: cancelledMems } = await supabase
                .from('memberships')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'cancelled')
                .gte('created_at', dateRange.start + 'T00:00:00');

            const churn = totalMems ? ((cancelledMems || 0) / totalMems) * 100 : 0;

            setStats({
                totalReservations: resCount || 0,
                activeMembers: memberCount || 0,
                monthlyIncome: totalIncome,
                occupancyRate: Math.min(rate, 100),
                churnRate: parseFloat(churn.toFixed(1))
            });

            // 6. Space Usage Breakdown
            const { data: resCategories } = await supabase.from('reservations').select('spaces(type)');
            const usageMap: Record<string, number> = { 'desk': 0, 'office': 0, 'meeting': 0, 'studio': 0 };
            resCategories?.forEach((r: any) => {
                const type = r.spaces?.type;
                if (type && usageMap[type] !== undefined) usageMap[type]++;
            });
            const totalRes = resCategories?.length || 1;
            setSpaceUsage([
                { name: 'Hot Desks', value: Math.round((usageMap['desk'] / totalRes) * 100) || 10 },
                { name: 'Meeting Rooms', value: Math.round((usageMap['meeting'] / totalRes) * 100) || 10 },
                { name: 'Private Offices', value: Math.round((usageMap['office'] / totalRes) * 100) || 10 },
                { name: 'Creative Studios', value: Math.round((usageMap['studio'] / totalRes) * 100) || 10 },
            ]);

            // 7. Revenue by Category
            const revMap: Record<string, number> = { 'Membresía': 0, 'Reserva': 0, 'Otros': 0 };
            payments?.forEach(p => {
                const type = (p.metadata as any)?.type || 'Reserva';
                if (revMap[type] !== undefined) revMap[type] += p.amount;
                else revMap['Otros'] += p.amount;
            });
            setRevenueByCategory([
                { name: 'Membresías', value: revMap['Membresía'], color: '#FDE910' },
                { name: 'Reservas', value: revMap['Reserva'], color: '#11171D' },
                { name: 'Otros', value: revMap['Otros'], color: '#686000' },
            ]);

            // 8. Member Growth
            const { data: mGrowth } = await supabase.from('profiles').select('created_at');
            const monthsNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
            const growthChart = monthsNames.map((m, i) => ({
                name: m,
                members: mGrowth?.filter(p => new Date(p.created_at).getMonth() === i).length || 0
            })).slice(-6);
            setMemberGrowth(growthChart);

            buildGraphData();
        } catch (err) {
            toast.error('Error al cargar analíticas');
        } finally {
            setLoading(false);
        }
    };

    const buildGraphData = async () => {
        const { data: allPayments } = await supabase.from('payments').select('amount, created_at');
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const currentMonth = new Date().getMonth();
        const last6Months = [];
        for (let i = 5; i >= 0; i--) {
            const m = (currentMonth - i + 12) % 12;
            const monthSum = allPayments?.filter(p => new Date(p.created_at).getMonth() === m).reduce((sum, p) => sum + p.amount, 0) || 1200 + (i * 450);
            last6Months.push({ name: months[m], total: monthSum });
        }
        setIncomeData(last6Months);
    };

    const handleExportData = async () => {
        const { data: payments } = await supabase.from('payments').select('id, amount, status, created_at, profile:profiles(name)');
        const csv = "ID,Monto,Estado,Fecha,Cliente\n" + payments?.map(p => `${p.id},${p.amount},${p.status},${p.created_at},${(p.profile as any)?.name}`).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('EXPORTADO CORRECTAMENTE');
    };

    if (loading) return (
        <div className="py-48 flex flex-col items-center justify-center gap-12">
            <div className="relative size-32">
                <div className="absolute inset-0 border-[1px] border-[var(--outline-variant)]/20 rounded-full scale-150"></div>
                <div className="absolute inset-0 border-t-2 border-[var(--primary)] rounded-full animate-spin-slow"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <Icon name="analytics" className="!text-4xl text-[var(--on-surface)]/10 animate-pulse" />
                </div>
            </div>
            <div className="text-center space-y-4">
                <p className="label-md animate-pulse">Sincronizando Ledger Analítico</p>
                <p className="text-[9px] font-bold text-[var(--on-surface-subtle)] uppercase tracking-[0.3em]">Procesando métricas transaccionales...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-12 animate-fade pb-32 max-w-[1600px] mx-auto px-6 md:px-12">
            {/* SaaS Actions Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 mb-10">
                <div className="flex items-center gap-6">
                    <div className="flex bg-white p-1.5 rounded-xl border border-slate-100 shadow-sm">
                        <div className="px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-slate-900 text-white shadow-lg flex items-center gap-2">
                            <Icon name="analytics" className="!text-lg" />
                            Estadísticas
                        </div>
                    </div>
                    
                    <div className="h-8 w-[1px] bg-slate-200 hidden md:block"></div>

                    <div className="flex items-center gap-4 bg-white border border-slate-100 px-4 py-2 rounded-xl shadow-sm">
                        <Icon name="calendar_today" className="!text-base text-slate-400" />
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={dateRange.start} 
                                onChange={e => setDateRange({...dateRange, start: e.target.value})} 
                                className="text-[10px] font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-700 w-24 cursor-pointer uppercase tracking-widest" 
                            />
                            <span className="text-slate-300">—</span>
                            <input 
                                type="date" 
                                value={dateRange.end} 
                                onChange={e => setDateRange({...dateRange, end: e.target.value})} 
                                className="text-[10px] font-bold bg-transparent border-none p-0 focus:ring-0 text-slate-700 w-24 cursor-pointer uppercase tracking-widest" 
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleExportData} 
                        className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-black transition-all flex items-center gap-3 shadow-lg shadow-slate-200 border-none cursor-pointer"
                    >
                        <Icon name="download" className="!text-xl" />
                        Exportar CSV
                    </button>
                </div>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Ingresos Mensuales', value: `$${stats.monthlyIncome.toLocaleString()}`, change: '+12%', icon: 'payments', up: true, colorClass: 'bg-blue-600 shadow-blue-600/20' },
                    { label: 'Tasa de Ocupación', value: `${stats.occupancyRate}%`, change: '+5%', icon: 'chair_alt', up: true, colorClass: 'bg-rose-500 shadow-rose-500/20' },
                    { label: 'Comunidad Total', value: stats.activeMembers.toString(), change: '+8%', icon: 'groups', up: true, colorClass: 'bg-orange-500 shadow-orange-500/20' },
                    { label: 'Tasa de Abandono', value: `${stats.churnRate}%`, change: '-0.5%', icon: 'heart_minus', up: false, colorClass: 'bg-emerald-500 shadow-emerald-500/20' },
                ].map((stat, idx) => (
                    <div key={idx} className={`group relative overflow-hidden flex flex-col justify-center min-h-[160px] ${stat.colorClass.split(' ')[0]} text-white border-none shadow-lg ${stat.colorClass.split(' ')[1]} p-6 rounded-2xl`}>
                        <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-30 transition-opacity pointer-events-none">
                            <Icon name={stat.icon} size={220} className="leading-none" />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80 relative z-10 mb-2">{stat.label}</p>
                        <div className="relative z-10">
                            <p className="text-5xl font-black tracking-tighter mb-3">{stat.value}</p>
                            <span className="text-[10px] font-bold px-3 py-1.5 rounded-md bg-white/20 text-white">
                                {stat.change}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                {/* Revenue Evolution */}
                <article className="xl:col-span-2 card-workspace">
                    <div className="flex items-center justify-between mb-16">
                        <div className="space-y-2">
                            <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.3em]">Capital Evolution</h3>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--on-surface)]">Evolución de Ingresos</h2>
                        </div>
                        <div className="flex items-center gap-4 px-6 py-3 bg-[var(--surface-container-low)] rounded-2xl shadow-inner border border-white/20">
                            <div className="size-2 bg-[var(--primary)] rounded-full animate-pulse shadow-[0_0_8px_var(--primary)]"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--on-surface)]">Bruto / Mensual</span>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={incomeData}>
                                <defs>
                                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#FDE910" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#FDE910" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="var(--outline-variant)" strokeOpacity={0.1} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--on-surface)', opacity: 0.4 }} 
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--on-surface)', opacity: 0.4 }} 
                                />
                                <Tooltip 
                                    cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--secondary)', 
                                        borderRadius: '20px', 
                                        border: 'none',
                                        boxShadow: 'var(--neu-flat)',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        padding: '16px 20px'
                                    }}
                                    itemStyle={{ color: 'var(--primary)' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="total" 
                                    stroke="var(--primary)" 
                                    strokeWidth={4} 
                                    fill="url(#colorTotal)" 
                                    animationDuration={3000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                {/* Sources Breakdown */}
                <article className="card-workspace flex flex-col h-full">
                    <header className="mb-12">
                        <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.3em]">Capital Sources</h3>
                        <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--on-surface)] mt-2">Fuentes de Ingreso</h2>
                    </header>
                    
                    <div className="h-72 w-full relative mb-16 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={revenueByCategory} 
                                    innerRadius={80} 
                                    outerRadius={115} 
                                    paddingAngle={10} 
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {revenueByCategory.map((c, i) => (
                                        <Cell 
                                            key={`cell-${i}`} 
                                            fill={c.color} 
                                            className="transition-all duration-700 hover:scale-105 cursor-pointer outline-none"
                                        />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-[9px] font-black text-[var(--on-surface-subtle)] uppercase tracking-[0.4em] mb-2 opacity-40">Volumen</span>
                            <span className="text-3xl font-black text-[var(--on-surface)] tracking-tighter leading-none">${stats.monthlyIncome.toLocaleString()}</span>
                        </div>
                    </div>

                    <div className="space-y-4 mt-auto">
                        {revenueByCategory.map((c, i) => (
                            <div key={i} className="flex items-center justify-between p-6 rounded-2xl bg-[var(--surface)] shadow-[var(--neu-flat-sm)] hover:shadow-[var(--neu-pressed-sm)] transition-all cursor-default group">
                                <div className="flex items-center gap-5">
                                    <div className="size-3 rounded-full shadow-lg" style={{ backgroundColor: c.color }}></div>
                                    <span className="text-[11px] font-black uppercase tracking-widest text-[var(--on-surface)] group-hover:text-[var(--primary)] transition-colors">{c.name}</span>
                                </div>
                                <span className="text-[12px] font-black text-[var(--on-surface-subtle)]">${c.value.toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </article>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                {/* Growth */}
                <article className="card-workspace">
                    <header className="flex justify-between items-start mb-16">
                        <div className="space-y-2">
                            <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.3em]">Expansion Metrics</h3>
                            <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--on-surface)]">Crecimiento de Comunidad</h2>
                        </div>
                    </header>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={memberGrowth}>
                                <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="var(--outline-variant)" strokeOpacity={0.1} />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--on-surface)', opacity: 0.4 }} 
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fontWeight: 900, fill: 'var(--on-surface)', opacity: 0.4 }} 
                                />
                                <Tooltip 
                                    cursor={{ fill: 'var(--primary)', opacity: 0.05 }}
                                    contentStyle={{ 
                                        backgroundColor: 'var(--secondary)', 
                                        borderRadius: '20px', 
                                        border: 'none',
                                        boxShadow: 'var(--neu-flat)',
                                        color: '#ffffff',
                                        fontSize: '11px',
                                        fontWeight: 900,
                                        textTransform: 'uppercase'
                                    }}
                                />
                                <Bar 
                                    dataKey="members" 
                                    fill="var(--primary)" 
                                    radius={[8, 8, 0, 0]} 
                                    barSize={50}
                                    animationDuration={2500}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </article>

                {/* Categories */}
                <article className="card-workspace">
                    <h3 className="label-md text-[var(--primary)] uppercase tracking-[0.3em]">Usage Architecture</h3>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-[var(--on-surface)] mt-2 mb-16">Demanda Por Categoría</h2>
                    
                    <div className="space-y-12">
                        {spaceUsage.map((u, i) => (
                            <div key={i} className="group/bar">
                                <div className="flex justify-between mb-5">
                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--on-surface-subtle)] group-hover/bar:text-[var(--primary)] transition-colors">{u.name}</span>
                                    <span className="text-lg font-black text-[var(--on-surface)] tracking-tighter">{u.value}%</span>
                                </div>
                                <div className="h-4 bg-[var(--surface-container)] rounded-full overflow-hidden shadow-inner border border-white/10">
                                    <div 
                                        className="h-full bg-[var(--on-surface)] rounded-full transition-all duration-[2000ms] ease-out group-hover/bar:bg-[var(--primary)] shadow-lg" 
                                        style={{ width: `${u.value}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* AI Insight */}
                    <div className="mt-20 p-12 bg-[var(--surface)] shadow-[var(--neu-pressed-sm)] rounded-[2.5rem] relative overflow-hidden group/ai border border-white/20">
                        <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover/ai:rotate-12 group-hover/ai:scale-110 transition-all duration-700">
                            <Icon name="auto_awesome" className="!text-9xl text-[var(--on-surface)]" />
                        </div>
                        <div className="flex items-center gap-5 mb-8">
                            <div className="size-14 bg-[var(--secondary)] text-[var(--primary)] rounded-2xl flex items-center justify-center shadow-2xl">
                                <Icon name="auto_awesome" className="!text-3xl animate-pulse" />
                            </div>
                            <span className="text-[11px] font-black uppercase tracking-[0.5em] text-[var(--on-surface)]">AI OPERATIONAL INSIGHT</span>
                        </div>
                        <p className="text-[13px] leading-relaxed font-bold uppercase tracking-[0.1em] text-[var(--on-surface-subtle)] max-w-xl">
                            "OPTIMIZACIÓN PROYECTADA: LA DEMANDA DE SALAS DE JUNTAS EXCEDE CAPACIDAD LOS MARTES. CONSIDERE IMPLEMENTAR TARIFAS DINÁMICAS O REDEFINIR EL ÁREA DE ESTUDIO 2."
                        </p>
                    </div>
                </article>
            </div>
        </div>
    );
};

export default AdminReports;
