'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n))

export default function RapportsPage() {
  const supabase = createClient()
  const [periode, setPeriode] = useState<'jour' | 'semaine' | 'mois'>('semaine')
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const now = new Date()
    let from = new Date()
    if (periode === 'jour') from.setHours(0,0,0,0)
    else if (periode === 'semaine') { from.setDate(now.getDate() - 7) }
    else { from.setDate(1); from.setHours(0,0,0,0) }

    const { data } = await supabase
      .from('commandes_detail').select('*')
      .gte('created_at', from.toISOString())
      .order('created_at')
    setData(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [periode])

  const livrees = data.filter(c => c.statut === 'livre')
  const ca = data.reduce((s, c) => s + (c.total_vente || 0), 0)
  const benefice = data.reduce((s, c) => s + (c.benefice || 0), 0)
  const couts_livraison = data.reduce((s, c) => s + (c.cout_livraison || 0), 0)
  const taux = data.length > 0 ? Math.round(livrees.length * 100 / data.length) : 0

  const byDay: Record<string, { ca: number; benefice: number; nb: number }> = {}
  data.forEach(c => {
    const day = new Date(c.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit' })
    if (!byDay[day]) byDay[day] = { ca: 0, benefice: 0, nb: 0 }
    byDay[day].ca += c.total_vente || 0
    byDay[day].benefice += c.benefice || 0
    byDay[day].nb += 1
  })
  const days = Object.entries(byDay)
  const maxCA = Math.max(...days.map(d => d[1].ca), 1)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-medium">Rapports</h1>
        <div className="flex gap-2">
          {(['jour','semaine','mois'] as const).map(p => (
            <button key={p} onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${periode === p ? 'bg-[#7F77DD] text-white' : 'bg-white text-gray-500 border border-gray-200'}`}>
              {p === 'jour' ? 'Aujourd\'hui' : p === 'semaine' ? '7 jours' : 'Ce mois'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/></div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Chiffre d\'affaires', val: fmt(ca) + ' F', color: 'text-gray-900' },
              { label: 'Bénéfice net', val: fmt(benefice) + ' F', color: 'text-green-600' },
              { label: 'Commandes', val: data.length.toString(), color: 'text-gray-900' },
              { label: 'Taux de livraison', val: taux + '%', color: taux >= 70 ? 'text-green-600' : 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className="card">
                <p className="text-xs text-gray-400 mb-1">{s.label}</p>
                <p className={`text-xl font-medium ${s.color}`}>{s.val}</p>
              </div>
            ))}
          </div>

          {days.length > 0 && (
            <div className="card">
              <p className="text-sm font-medium mb-4">Évolution CA</p>
              <div className="space-y-2">
                {days.map(([day, stats]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-12 flex-shrink-0">{day}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-5 relative">
                      <div className="bg-[#7F77DD] h-5 rounded-full transition-all"
                        style={{ width: `${Math.max(4, (stats.ca / maxCA) * 100)}%` }}/>
                      <span className="absolute right-2 top-0 bottom-0 flex items-center text-xs text-gray-600 font-medium">
                        {fmt(stats.ca)} F
                      </span>
                    </div>
                    <span className="text-xs text-green-600 w-20 text-right flex-shrink-0">+{fmt(stats.benefice)} F</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <p className="text-sm font-medium mb-3">Résumé financier</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Ventes totales</span><span className="font-medium">{fmt(ca)} FCFA</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Coûts produits</span><span className="text-red-500">- {fmt(ca - benefice - couts_livraison)} FCFA</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Coûts livraison</span><span className="text-red-500">- {fmt(couts_livraison)} FCFA</span></div>
              <div className="flex justify-between pt-2 border-t border-gray-100"><span className="font-medium">Bénéfice net</span><span className="font-medium text-green-600">{fmt(benefice)} FCFA</span></div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
