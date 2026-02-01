import React from 'react';
import { LogOut } from 'lucide-react';
import { useLogout } from '../utils/hooks/useLogout';

// En JavaScript, on enlève "interface" et ": React.FC"
const LogoutButton = ({ className = "" }) => {
    const logout = useLogout();
    const deconnect = () => {
        localStorage.clear() 
        logout()   
    }
    
    

    return (
        <button 
            onClick={deconnect} 
            className={`flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors font-medium ${className}`}
        >
            <LogOut size={20} />
            <span>Se déconnecter</span>
        </button>
    );
};

export default LogoutButton;