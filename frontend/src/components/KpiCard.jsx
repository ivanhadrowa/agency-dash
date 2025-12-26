export function KpiCard({ title, value, subtext, icon: Icon }) {
    return (
        <div className="glass-panel col-span-1" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{title}</p>
                    <h3 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>{value}</h3>
                </div>
                {Icon && (
                    <div style={{ padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: '0.5rem' }}>
                        <Icon size={24} style={{ color: 'var(--primary)' }} />
                    </div>
                )}
            </div>
            {subtext && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{subtext}</p>}
        </div>
    )
}
