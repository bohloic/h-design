import React, { useEffect, useState } from 'react';
import { authFetch } from '../../utils/apiClient';
import CollectionCarousel from '../../../pages/products/CollectionCarousel';

const TrendingSection = () => {
    const [products, setProducts] = useState([]);
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
                setProducts(cleanData as any); // Cast any pour éviter erreur TS rapide
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) return <div className="py-6 text-center text-slate-400">Chargement des tendances...</div>;

    return (
        <div className="py-6 bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 ">
                <h2 className="text-3xl font-bold mb-2">🔥 Les Plus Populaires</h2>
                <p className="text-slate-500 mb-8">Les articles que tout le monde s'arrache en ce moment.</p>
                
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