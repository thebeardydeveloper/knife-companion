'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import type { RankTier } from '@/lib/supabase';

interface EditingTier extends RankTier {
  _isNew?: boolean;
}

export default function RanksPage() {
  const [tiers, setTiers]       = useState<RankTier[]>([]);
  const [editing, setEditing]   = useState<Record<number, EditingTier>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<Record<number, boolean>>({});
  const [deleting, setDeleting] = useState<Record<number, boolean>>({});

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('rank_tiers')
      .select('*')
      .order('min_posts', { ascending: true });
    setTiers((data as RankTier[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  function startEdit(tier: RankTier) {
    setEditing((prev) => ({ ...prev, [tier.id]: { ...tier } }));
  }

  function cancelEdit(id: number) {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    // If it was a new unsaved tier, remove it from list
    setTiers((prev) => prev.filter((t) => !(t.id === id && (editing[id] as EditingTier)?._isNew)));
  }

  function updateField(id: number, field: keyof RankTier, value: string | number) {
    setEditing((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }

  async function save(id: number) {
    const e = editing[id];
    if (!e) return;
    setSaving((prev) => ({ ...prev, [id]: true }));

    const payload = {
      name:       e.name.trim(),
      min_posts:  Number(e.min_posts),
      color:      e.color.trim(),
      sort_order: Number(e.sort_order),
    };

    if ((e as EditingTier)._isNew) {
      const { error } = await supabase.from('rank_tiers').insert(payload);
      if (error) { alert('Error: ' + error.message); }
    } else {
      const { error } = await supabase.from('rank_tiers').update(payload).eq('id', id);
      if (error) { alert('Error: ' + error.message); }
    }

    setSaving((prev) => ({ ...prev, [id]: false }));
    setEditing((prev) => { const next = { ...prev }; delete next[id]; return next; });
    await load();
  }

  async function deleteTier(id: number) {
    if (!confirm('¿Eliminar este rango?')) return;
    setDeleting((prev) => ({ ...prev, [id]: true }));
    await supabase.from('rank_tiers').delete().eq('id', id);
    setDeleting((prev) => { const next = { ...prev }; delete next[id]; return next; });
    await load();
  }

  function addNew() {
    const tempId = Date.now(); // temporary client-side id
    const newTier: EditingTier = {
      id: tempId,
      name: '',
      min_posts: 0,
      color: '#8A837A',
      sort_order: tiers.length,
      _isNew: true,
    };
    setTiers((prev) => [...prev, newTier]);
    setEditing((prev) => ({ ...prev, [tempId]: newTier }));
  }

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-forge-text tracking-tight">Rangos</h1>
            <p className="text-forge-muted text-sm mt-0.5">
              Configurá los niveles según la cantidad de publicaciones
            </p>
          </div>
          <button
            onClick={addNew}
            className="bg-forge-accent hover:opacity-90 text-white font-semibold rounded-lg px-4 py-2 text-sm transition-opacity"
          >
            + Agregar rango
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forge-border">
                  <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Color</th>
                  <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Publicaciones mínimas</th>
                  <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Orden</th>
                  <th className="px-4 py-3 w-36" />
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier) => {
                  const e = editing[tier.id];
                  const isSaving   = saving[tier.id];
                  const isDeleting = deleting[tier.id];
                  const displayColor = e ? e.color : tier.color;

                  return (
                    <tr key={tier.id} className="border-b border-forge-border last:border-0 hover:bg-forge-elevated transition-colors">
                      {/* Color swatch */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-5 h-5 rounded-full border border-forge-border flex-shrink-0"
                            style={{ backgroundColor: displayColor }}
                          />
                          {e ? (
                            <input
                              type="text"
                              value={e.color}
                              onChange={(ev) => updateField(tier.id, 'color', ev.target.value)}
                              className="w-24 bg-forge-elevated border border-forge-border rounded px-2 py-1 text-xs text-forge-text focus:border-forge-accent transition-colors"
                              placeholder="#8A837A"
                            />
                          ) : (
                            <span className="text-forge-muted text-xs">{tier.color}</span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        {e ? (
                          <input
                            type="text"
                            value={e.name}
                            onChange={(ev) => updateField(tier.id, 'name', ev.target.value)}
                            className="w-full bg-forge-elevated border border-forge-border rounded px-2 py-1.5 text-sm text-forge-text focus:border-forge-accent transition-colors"
                            placeholder="Nombre del rango..."
                          />
                        ) : (
                          <span
                            className="text-sm font-semibold px-2 py-0.5 rounded"
                            style={{
                              color: tier.color,
                              backgroundColor: tier.color + '18',
                              border: `1px solid ${tier.color}55`,
                            }}
                          >
                            {tier.name}
                          </span>
                        )}
                      </td>

                      {/* Min posts */}
                      <td className="px-4 py-3">
                        {e ? (
                          <input
                            type="number"
                            min={0}
                            value={e.min_posts}
                            onChange={(ev) => updateField(tier.id, 'min_posts', ev.target.value)}
                            className="w-24 bg-forge-elevated border border-forge-border rounded px-2 py-1.5 text-sm text-forge-text focus:border-forge-accent transition-colors"
                          />
                        ) : (
                          <span className="text-forge-text text-sm">≥ {tier.min_posts} posts</span>
                        )}
                      </td>

                      {/* Sort order */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {e ? (
                          <input
                            type="number"
                            min={0}
                            value={e.sort_order}
                            onChange={(ev) => updateField(tier.id, 'sort_order', ev.target.value)}
                            className="w-16 bg-forge-elevated border border-forge-border rounded px-2 py-1.5 text-sm text-forge-text focus:border-forge-accent transition-colors"
                          />
                        ) : (
                          <span className="text-forge-muted text-sm">{tier.sort_order}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-end">
                          {e ? (
                            <>
                              <button
                                onClick={() => save(tier.id)}
                                disabled={isSaving}
                                className="bg-forge-accent hover:opacity-90 disabled:opacity-50 text-white text-xs font-semibold rounded px-3 py-1.5 transition-opacity"
                              >
                                {isSaving ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => cancelEdit(tier.id)}
                                className="text-forge-muted hover:text-forge-text text-xs px-2 py-1.5 transition-colors"
                              >
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(tier)}
                                className="text-forge-muted hover:text-forge-text text-xs px-2 py-1.5 transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => deleteTier(tier.id)}
                                disabled={isDeleting}
                                className="text-red-400/50 hover:text-red-400 text-xs px-2 py-1.5 transition-colors disabled:opacity-50"
                              >
                                {isDeleting ? '...' : '✕'}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {tiers.length === 0 && (
              <div className="text-center py-12 text-forge-muted">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-sm">No hay rangos configurados.</p>
              </div>
            )}
          </div>
        )}

        <p className="text-forge-muted text-xs mt-4">
          Los rangos se calculan automáticamente según la cantidad de publicaciones de cada usuario.
          Un usuario adquiere el rango más alto para el cual cumple el mínimo de publicaciones.
        </p>
      </div>
    </AdminLayout>
  );
}
