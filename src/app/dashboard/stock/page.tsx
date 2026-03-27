'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function StockPage() {
  const supabase = createClient()
  const [produits, setProduits] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase.from('produits').select('*').eq('actif', true).order('stock_total')
    setProduits(data || [])
    setLoading(false)
  }

  async function updateStock(id: string, delta: number, current: number) {
    const nouveau = Math.max(0, current + delta)
    await supabase.from('produits').update({ stock_total: nouveau }).eq('id', id)
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[#7F77DD] border-t-transparent rounded-full animate-spin"/></div>

  const alertes = produits.filter(p => p.stock_total <= 5)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h1 className="text-xl font-medium">Stock</h1>

      {alertes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">⚠️ Stock faible ({alertes.length} produit{alertes.length > 1 ? 's' : ''})</p>
          <div className="space-y-1">
            {alertes.map(p => (
              <p key={p.id} className="text-xs text-amber-700">{p.nom} — {p.stock_total} restant{p.stock_total > 1 ? 's' : ''}</p>
            ))}
          </div>
        </div>
      )}

      {produits.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-gray-500">Aucun produit. Ajoute des produits d'abord.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {produits.map(p => (
            <div key={p.id} className="card flex items-center gap-3">
              <div className={`w-2 h-10 rounded-full flex-shrink-0 ${p.stock_total === 0 ? 'bg-red-400' : p.stock_total <= 5 ? 'bg-amber-400' : 'bg-green-400'}`}/>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{p.nom}</p>
                <p className="text-xs text-gray-400">
                  {p.stock_total === 0 ? 'Rupture de stock' : p.stock_total <= 5 ? 'Stock faible' : 'En stock'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateStock(p.id, -1, p.stock_total)}
                  className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-medium">−</button>
                <span className="w-10 text-center font-medium text-sm">{p.stock_total}</span>
                <button onClick={() => updateStock(p.id, 1, p.stock_total)}
                  className="w-8 h-8 rounded-lg bg-[#7F77DD] flex items-center justify-center text-white hover:bg-[#534AB7] font-medium">+</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
