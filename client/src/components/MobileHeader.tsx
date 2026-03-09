import React from 'react';
import { Menu } from 'lucide-react';

interface MobileHeaderProps {
    onOpenSidebar: () => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpenSidebar }) => {
    return (
        <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#121212] border-b border-white/5 flex items-center justify-between px-6 z-[40]">
            <div className="flex items-center space-x-3">
                <img src="/logo_hth.png" alt="HTH Logo" className="w-8 h-8 object-contain rounded-lg" />
                <span className="text-lg font-bold tracking-tight">HTH Gestión</span>
            </div>

            <button
                onClick={onOpenSidebar}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <Menu size={24} />
            </button>
        </header>
    );
};

export default MobileHeader;
