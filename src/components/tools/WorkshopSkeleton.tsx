import React from 'react';

/**
 * 🎨 WorkshopSkeleton - Skeleton Screen moderne pour l'Atelier de Création
 * Remplace les spinners bloquants par une structure fluide (Shimmer)
 */
export const WorkshopSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-[calc(100vh-64px)] bg-slate-50 dark:bg-[#111827] overflow-hidden animate-pulse">
      {/* HEADER SKELETON */}
      <div className="bg-white dark:bg-[#111827] border-b border-slate-200 dark:border-slate-800 p-3 h-16 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          <div className="flex flex-col gap-1.5">
            <div className="w-36 h-4 rounded bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
            <div className="w-24 h-3 rounded bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          <div className="w-24 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
        </div>
      </div>

      {/* WORKSHOP MAIN LAYOUT */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* SIDEBAR GAUCHE SKELETON (Desktop) */}
        <aside className="hidden lg:flex w-80 bg-white dark:bg-[#111827] border-r border-slate-200 dark:border-slate-800 p-4 flex-col gap-4 shrink-0">
          <div className="w-full h-8 rounded-xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
            ))}
          </div>
        </aside>

        {/* CANVAS CENTRAL SKELETON */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 bg-slate-100 dark:bg-slate-900/40">
          <div className="w-full max-w-[480px] aspect-square rounded-3xl bg-white dark:bg-[#1F2937] shadow-xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="w-4/5 h-4/5 rounded-2xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          </div>
        </main>

        {/* SIDEBAR DROITE / OUTILS SKELETON (Desktop) */}
        <aside className="hidden lg:flex w-80 bg-white dark:bg-[#111827] border-l border-slate-200 dark:border-slate-800 p-4 flex-col gap-4 shrink-0">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-1 h-9 rounded-lg bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
            ))}
          </div>
          <div className="w-full h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
          <div className="grid grid-cols-5 gap-2 pt-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
            ))}
          </div>
        </aside>
      </div>

      {/* BOTTOM NAV SKELETON (Mobile) */}
      <div className="lg:hidden bg-white dark:bg-[#111827] border-t border-slate-200 dark:border-slate-800 p-3 flex justify-around">
        <div className="w-20 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
        <div className="w-20 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
        <div className="w-20 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
      </div>
    </div>
  );
};

export default WorkshopSkeleton;
