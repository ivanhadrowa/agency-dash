import { useState, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { LayoutDashboard, ChevronDown, ChevronUp } from 'lucide-react'
import * as api from './services/api'

function App() {
  const [brands, setBrands] = useState([])
  const [expandedBrand, setExpandedBrand] = useState(null)

  useEffect(() => {
    api.getBrands().then(data => {
      // Ensure data is array, if not use empty
      setBrands(Array.isArray(data) ? data : [])
    }).catch(console.error)
  }, [])

  const toggleExpand = (brandId) => {
    if (expandedBrand === brandId) {
      setExpandedBrand(null)
    } else {
      setExpandedBrand(brandId)
    }
  }

  return (
    <div className="layout">
      <header className="glass-panel" style={{ margin: '1rem', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #6366f1, #a855f7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LayoutDashboard size={18} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0, letterSpacing: '-0.025em' }}>Panel de Agencias</h1>
        </div>
      </header>

      <main style={{ padding: '0 1rem 2rem 1rem' }}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Ranking de Marcas Blancas</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 2fr 1fr 1fr 40px', padding: '0.5rem 1rem', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              <div>#</div>
              <div>Marca Blanca</div>
              <div style={{ textAlign: 'right' }}>Usuarios Totales</div>
              <div style={{ textAlign: 'right' }}>Usuarios Activos</div>
              <div></div>
            </div>

            {/* List Rows */}
            {brands.map((brand, index) => {
              const isExpanded = expandedBrand === brand._id
              return (
                <div key={brand._id} style={{ background: 'var(--bg-secondary)', borderRadius: '0.5rem', overflow: 'hidden', transition: 'all 0.2s' }}>
                  <div
                    onClick={() => toggleExpand(brand._id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '60px 2fr 1fr 1fr 40px',
                      padding: '1rem',
                      alignItems: 'center',
                      cursor: 'pointer',
                      background: isExpanded ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                    }}
                  >
                    <div style={{ fontWeight: 600, color: index < 3 ? '#6366f1' : 'var(--text-secondary)' }}>{index + 1}</div>
                    <div style={{ fontWeight: 500 }}>{brand._id}</div>
                    <div style={{ textAlign: 'right' }}>{brand.total_users}</div>
                    <div style={{ textAlign: 'right', color: '#10b981' }}>{brand.active_users}</div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-color)', animation: 'fadeIn 0.3s ease' }}>
                      <Dashboard tenant={brand._id} />
                    </div>
                  )}
                </div>
              )
            })}

            {brands.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando ranking...</div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
