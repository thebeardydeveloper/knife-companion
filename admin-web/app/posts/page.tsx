'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';

interface PostRow {
  id: string;
  content: string | null;
  images: string[];
  created_at: string;
  profiles: { username: string; avatar_url: string | null } | null;
}

const PAGE_SIZE = 30;

export default function PostsModerationPage() {
  const [posts,    setPosts]    = useState<PostRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading,  setLoading]  = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [page,     setPage]     = useState(0);
  const [hasMore,  setHasMore]  = useState(true);

  async function load(pageIndex = 0, append = false) {
    setLoading(true);
    const from = pageIndex * PAGE_SIZE;
    const { data } = await supabase
      .from('posts')
      .select('id, content, images, created_at, profiles(username, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, from + PAGE_SIZE - 1);

    const rows = (data as unknown as PostRow[]) ?? [];
    setPosts((prev) => append ? [...prev, ...rows] : rows);
    setHasMore(rows.length === PAGE_SIZE);
    setLoading(false);
  }

  useEffect(() => { load(0); }, []);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  async function deleteSelected() {
    if (!selected.size) return;
    if (!confirm(`¿Eliminar ${selected.size} post${selected.size !== 1 ? 's' : ''}? Esta acción no se puede deshacer.`)) return;
    setDeleting(true);
    await supabase.from('posts').delete().in('id', [...selected]);
    setSelected(new Set());
    await load(0);
    setDeleting(false);
  }

  async function deleteSingle(id: string) {
    if (!confirm('¿Eliminar este post?')) return;
    await supabase.from('posts').delete().eq('id', id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }

  async function loadMore() {
    const next = page + 1;
    setPage(next);
    await load(next, true);
  }

  const allSelected = posts.length > 0 && selected.size === posts.length;

  return (
    <AdminLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-forge-text tracking-tight">Posts</h1>
            <p className="text-forge-muted text-sm mt-0.5">Moderación de publicaciones</p>
          </div>
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-sm font-semibold rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Eliminando...' : `Eliminar ${selected.size} seleccionado${selected.size !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

        {loading && posts.length === 0 ? (
          <div className="flex justify-center py-16">
            <div className="w-7 h-7 border-2 border-forge-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-forge-muted">
            <p className="text-4xl mb-3">🖼️</p>
            <p>No hay posts todavía.</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="bg-forge-surface border border-forge-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-forge-border">
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="accent-forge-accent w-4 h-4 cursor-pointer"
                      />
                    </th>
                    <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider w-16">Imagen</th>
                    <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider">Autor</th>
                    <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider hidden md:table-cell">Contenido</th>
                    <th className="text-left px-4 py-3 text-forge-muted font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                    <th className="px-4 py-3 w-16" />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => {
                    const thumb = post.images?.[0];
                    const isSelected = selected.has(post.id);
                    return (
                      <tr
                        key={post.id}
                        className={`border-b border-forge-border last:border-0 transition-colors ${isSelected ? 'bg-forge-accent/5' : 'hover:bg-forge-elevated'}`}
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(post.id)}
                            className="accent-forge-accent w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-forge-elevated border border-forge-border flex-shrink-0">
                            {thumb
                              ? <img src={thumb} alt="" className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-forge-muted text-xs">—</div>
                            }
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {post.profiles?.avatar_url
                              ? <img src={post.profiles.avatar_url} className="w-7 h-7 rounded-full object-cover flex-shrink-0" alt="" />
                              : <div className="w-7 h-7 rounded-full bg-forge-elevated border border-forge-border flex items-center justify-center text-xs text-forge-muted flex-shrink-0">
                                  {post.profiles?.username?.slice(0, 1).toUpperCase() ?? '?'}
                                </div>
                            }
                            <span className="text-forge-text text-sm font-medium">
                              {post.profiles?.username ?? 'Desconocido'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-forge-muted text-xs truncate max-w-xs">
                            {post.content || <span className="italic">Sin descripción</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-forge-muted text-xs whitespace-nowrap">
                          {new Date(post.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => deleteSingle(post.id)}
                            className="text-red-400/50 hover:text-red-400 transition-colors text-xs px-2 py-1"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="text-sm text-forge-muted hover:text-forge-text border border-forge-border rounded-lg px-4 py-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
