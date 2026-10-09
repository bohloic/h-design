import { useEffect, useState } from 'react';
import { authFetch } from '../../utils/apiClient';
import CollectionCarousel from '../../../pages/products/CollectionCarousel';
import { ProductGridSkeleton } from '../tools/ProductCardSkeleton';

const TrendingSection = () => {
    // 🪄 Typage direct du state pour éviter les "as any" plus bas
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fonction de nettoyage (identique à Home)
    const formatProducts = (data: any[]) => {
        if (!Array.isArray(data)) return [];
        return data.map((p: any) => {
            let cleanVariants = p.variants || [];
            if (typeof cleanVariants === 'string') {
                try { cleanVariants = JSON.parse(cleanVariants); } catch(e) {}
            }
            let cleanSizes = p.sizes || [];
            if (typeof cleanSizes === 'string') {
                try { cleanSizes = JSON.parse(cleanSizes); } catch(e) {}
            }
            const hasOptions = (cleanVariants.length > 0) || (cleanSizes.length > 0);

            return {
                ...p,
                price: parseFloat(p.price),
                variants: Array.isArray(cleanVariants) ? cleanVariants : [],
                sizes: Array.isArray(cleanSizes) ? cleanSizes : [],
                hasOptions: hasOptions
            };
        });
    };

    useEffect(() => {
        authFetch('/api/products/trending')
            .then(res => res.json())
            .then(data => {
                // On applique le formatage ici
                const cleanData = formatProducts(data);
                setProducts(cleanData); 
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    // 🪄 SKELETON SCREEN FOR PERCEIVED PERFORMANCE
    if (loading) {
        return (
            <div className="py-8 bg-transparent dark:bg-[#111827] transition-colors max-w-7xl mx-auto px-4">
                <ProductGridSkeleton count={4} />
            </div>
        );
    }

    // On ne rend rien s'il n'y a pas de produits tendance
    if (products.length === 0) return null;

    return (
        <div className="py-8 bg-transparent dark:bg-carbon transition-colors">
            <div className="max-w-7xl mx-auto px-4 ">
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3 text-slate-900 dark:text-pure">
                    {/* 🪄 DÉCORATION DU TITRE DYNAMIQUE (Cohérence avec le ProductCarousel) */}
                    <span 
                        className="w-2 h-8 rounded-full" 
                        style={{ backgroundColor: 'var(--theme-primary)' }}
                    ></span>
                    🔥 Les Plus Populaires
                </h2>
                <p className="text-slate-500 dark:text-slate-400 mb-8 ml-5">Les articles que tout le monde s'arrache en ce moment.</p>
                
                <CollectionCarousel 
                    data={products} 
                    targetCollection="" 
                    overrideTitle="" 
                />
            </div>
        </div>
    );
}

export default TrendingSection;