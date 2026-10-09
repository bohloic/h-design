import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1F2937] rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 animate-pulse flex flex-col h-80 shadow-sm">
      <div className="w-full aspect-[3/4] bg-slate-200 dark:bg-slate-800 rounded-xl mb-3 skeleton-shimmer" />
      <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/3 mb-2 skeleton-shimmer" />
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-3 skeleton-shimmer" />
      <div className="flex gap-1.5 mb-3">
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
        <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800 skeleton-shimmer" />
      </div>
      <div className="flex justify-between items-center mt-auto">
        <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-2/5 skeleton-shimmer" />
        <div className="w-9 h-9 bg-slate-200 dark:bg-slate-800 rounded-full skeleton-shimmer" />
      </div>
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6 lg:gap-8 pb-12">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default ProductCardSkeleton;
