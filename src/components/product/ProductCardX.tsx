import { Eye, Heart, ShoppingCart } from "lucide-react"
import { BASE_IMG_URL } from "../images/VoirImage"
import { useNavigate } from "react-router-dom"
import { formatCurrency } from "@/constants"

const ProductCardX = ({ product }) => {
    const navigate = useNavigate()

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {product.map(product => (
            <div key={product.id} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="relative h-80 overflow-hidden">
                <img 
                    src={BASE_IMG_URL + product.image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {product.isNew && (
                    <span className="absolute top-4 left-4 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Nouveau
                    </span>
                )}
                <button className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-full text-slate-400 hover:text-red-600 transition-colors">
                    <Heart className="w-5 h-5" />
                </button>
                </div>
                <div className="p-6">
                <p className="text-xs text-slate-400 uppercase tracking-widest mb-1">{product.category}</p>
                <h3 className="font-bold text-lg mb-2 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xl font-black text-red-600">{formatCurrency(product.price)}</span>
                    <button 
                    onClick={() => navigate(`/boutique/produit/${product.slug}`)}
                    className="bg-slate-100 text-slate-900 p-3 rounded-xl hover:bg-slate-200 transition-colors"
                    title="Voir les détails"
                    >
                    <Eye size={20} />
                    </button>
                    
                </div>
                </div>
            </div>
            ))}
        </div>
    )
}

export default ProductCardX;