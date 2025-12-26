import { useEffect, useState } from 'react';
import {
    Users, DollarSign, TrendingUp, Activity, Clock
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import * as api from '../services/api';
import { KpiCard } from './KpiCard';

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];
const RADIAN = Math.PI / 180;

export function Dashboard({ tenant }) {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [summary, setSummary] = useState({ total: 0, active: 0, demo: 0, conversations: 0, avg_activation_ms: 0 });
    const [finance, setFinance] = useState({ revenue: 0, cost: 0, profit: 0, margin: 0 });
    const [team, setTeam] = useState({ total_configurators: 0, assignable_users: 0 });

    const [usersTs, setUsersTs] = useState([]);
    const [financeTs, setFinanceTs] = useState([]);
    const [topProfit, setTopProfit] = useState([]);
    const [clientDist, setClientDist] = useState([]);

    useEffect(() => {
        if (!tenant) return;

        // Parallel fetch with date filters (empty string = null = since always)
        const from = startDate || null;
        const to = endDate || null;

        Promise.all([
            api.getSummary(tenant, from, to),
            api.getFinanceSummary(tenant, from, to),
            api.getTeamSummary(tenant), // Team summary usually lifetime or current
            api.getUsersTimeseries(tenant, from, to, 'day'),
            api.getFinanceTimeseries(tenant, from, to, 'month'),
            api.getTopProfitable(tenant, from, to, 5),
            api.getClientDistribution(tenant)
        ]).then(([sum, fin, tm, uTs, fTs, top, dist]) => {
            setSummary(sum || { total: 0, active: 0, demo: 0, conversations: 0, avg_activation_ms: 0 });
            setFinance(fin || { revenue: 0, cost: 0, profit: 0, margin: 0 });
            setTeam(tm || { total_configurators: 0, assignable_users: 0 });
            setUsersTs(uTs || []);
            setFinanceTs(fTs || []);
            setTopProfit(top || []);
            setClientDist(dist || []);
        }).catch(console.error);

    }, [tenant, startDate, endDate]);

    if (!tenant) {
        return (
            <div className="flex-center" style={{ height: '50vh', flexDirection: 'column', gap: '1rem' }}>
                <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Analítica de Agencias</h2>
                <p className="text-secondary">Selecciona una marca blanca arriba para comenzar.</p>
            </div>
        );
    }

    // Formatters
    const formatCurrency = (val) => `$${val?.toLocaleString()}`;
    const formatPct = (val) => `${((val || 0) * 100).toFixed(1)}%`;
    const formatDuration = (ms) => {
        if (!ms) return "0 d";
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        if (days > 0) return `${days}d ${hours}h`;
        return `${hours}h`;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Date Filters Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Desde:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Hasta:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '0.4rem 0.75rem', borderRadius: '0.5rem', outline: 'none' }}
                    />
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Top Row: User Stats */}
                <KpiCard title="Usuarios Totales" value={summary.total} icon={Users} subtext={`${summary.active} Activos, ${summary.demo} Demo`} />
                <KpiCard title="Clientes Activos" value={summary.active} icon={Activity} subtext="Estado Pagado/Activo" />
                <KpiCard title="Tiempo de Alta" value={formatDuration(summary.avg_activation_ms)} icon={Clock} subtext="Promedio desde registro" />
                <KpiCard title="Conversaciones" value={summary.conversations?.toLocaleString() || 0} icon={Activity} />
                <KpiCard title="Ingresos Totales" value={formatCurrency(finance.revenue)} icon={DollarSign} />
                <KpiCard title="Beneficio Neto" value={formatCurrency(finance.profit)} icon={TrendingUp} subtext={`Margen: ${formatPct(finance.margin)}`} />

                {/* Row 2: Charts */}
                <div className="glass-panel col-span-2" style={{ padding: '1.5rem', minHeight: '350px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Ingresos vs Costos</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financeTs}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="_id" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                            <Tooltip
                                cursor={{ fill: 'var(--bg-secondary)' }}
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Legend />
                            <Bar dataKey="revenue" name="Ingresos" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="cost" name="Costo" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-panel col-span-2" style={{ padding: '1.5rem', minHeight: '350px' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Crecimiento de Usuarios</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={usersTs}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                            <XAxis dataKey="_id" stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                            <YAxis stroke="var(--text-secondary)" tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                itemStyle={{ color: 'var(--text-primary)' }}
                            />
                            <Area type="monotone" dataKey="count" name="Nuevos Usuarios" stroke="#10b981" fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Row 3: Tables & Distribution */}
                <div className="glass-panel col-span-2" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Clientes Más Rentables</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ minWidth: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left', paddingBottom: '1rem', color: 'var(--text-muted)' }}>Cliente</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '1rem', color: 'var(--text-muted)' }}>Ingresos</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '1rem', color: 'var(--text-muted)' }}>Conversaciones</th>
                                    <th style={{ textAlign: 'right', paddingBottom: '1rem', color: 'var(--text-muted)' }}>Beneficio</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topProfit.length > 0 ? topProfit.map((c, i) => (
                                    <tr key={i} style={{ borderTop: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '1rem 0' }}>{c._id}</td>
                                        <td style={{ textAlign: 'right', padding: '1rem 0' }}>{formatCurrency(c.revenue)}</td>
                                        <td style={{ textAlign: 'right', padding: '1rem 0' }}>{c.conversations?.toLocaleString() || 0}</td>
                                        <td style={{ textAlign: 'right', padding: '1rem 0', color: '#10b981', fontWeight: 500 }}>{formatCurrency(c.profit)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={4} style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No hay datos disponibles</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="glass-panel col-span-1" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Tamaño del Cliente</h3>
                    <div style={{ height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={clientDist}
                                    dataKey="count"
                                    nameKey="_id"
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                >
                                    {clientDist.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                    itemStyle={{ color: 'var(--text-primary)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem', fontSize: '0.875rem' }}>
                        {clientDist.map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[index % CHART_COLORS.length] }} />
                                <span style={{ color: 'var(--text-secondary)' }}>{entry._id}: {entry.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel col-span-1" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.5rem' }}>Operacional</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Configuradores</p>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.25rem' }}>{team.total_configurators}</h2>
                        </div>
                        <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                            <p className="text-secondary" style={{ fontSize: '0.875rem' }}>Usuarios Asignables</p>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginTop: '0.25rem' }}>{team.assignable_users}</h2>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
