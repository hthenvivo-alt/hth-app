import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { AlertCircle, CheckCircle2, TrendingUp, DollarSign, MousePointerClick, Megaphone } from 'lucide-react';

interface MetaAdSetDetails {
    id: string;
    name: string;
    status: string;
    insights: {
        last_30d: any;
        last_7d: any;
    };
}

interface MetaAlert {
    funcionId: string;
    obraNombre: string;
    ciudad: string;
    fecha: string;
    status: 'OK' | 'NO_CAMPAIGN' | 'NO_ADSET';
    campaign: { id: string; name: string; status: string } | null;
    adSet: { id: string; name: string; status: string } | null;
    adSets?: MetaAdSetDetails[];
    insights: {
        last_30d: any;
        last_7d: any;
    };
}

const MetaCampaignAlerts: React.FC = () => {
    const { data: alerts, isLoading } = useQuery({
        queryKey: ['meta-campaign-alerts', 'v2'],
        queryFn: async () => {
            const res = await api.get('/meta/campaigns/alerts');
            return res.data as MetaAlert[];
        }
    });

    if (isLoading) {
        return (
            <div className="animate-pulse flex flex-col gap-4">
                <div className="h-12 bg-white/5 rounded-xl w-64 mb-4"></div>
                <div className="h-32 bg-white/5 rounded-xl w-full"></div>
                <div className="h-32 bg-white/5 rounded-xl w-full"></div>
            </div>
        );
    }

    if (!alerts || alerts.length === 0) {
        return (
            <div className="space-y-6">
                <div className="flex items-center space-x-3 text-white mb-6">
                    <div className="p-3 bg-blue-600/20 text-blue-500 rounded-xl">
                        <Megaphone size={28} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black italic uppercase tracking-tight">Campañas Publicitarias</h2>
                        <p className="text-gray-400 text-sm">Monitoreo y Alertas de Meta Ads (Facebook/Instagram)</p>
                    </div>
                </div>
                <div className="bg-[#121212] border border-white/5 rounded-2xl p-8 text-center">
                    <p className="text-gray-500 font-medium">No se detectaron próximas funciones para monitorear.</p>
                </div>
            </div>
        );
    }

    const functionsWithoutAds = alerts.filter(a => a.status !== 'OK');
    const functionsWithAds = alerts.filter(a => a.status === 'OK');

    const formatCurrency = (val: string) => {
        const num = parseFloat(val);
        return isNaN(num) ? '-' : `$${num.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const getDaysAway = (fecha: string) => {
        const functionDate = new Date(fecha);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffTime = functionDate.getTime() - today.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 text-white mb-6">
                <div className="p-3 bg-blue-600/20 text-blue-500 rounded-xl">
                    <Megaphone size={28} />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic uppercase tracking-tight">Campañas Publicitarias</h2>
                    <p className="text-gray-400 text-sm">Monitoreo y Alertas de Meta Ads (Facebook/Instagram)</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Rendimiento de Campañas Activas (Ocupa 2 columnas) */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-white font-bold flex items-center space-x-2 ml-1">
                        <TrendingUp size={20} className="text-green-500" />
                        <span>Rendimiento de Campañas Activas</span>
                    </h3>
                    
                    {functionsWithAds.length === 0 ? (
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-8 text-center">
                            <p className="text-gray-500 font-medium">No hay campañas con métricas activas en este momento.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {functionsWithAds.map((alert) => {
                                const insights30d = alert.insights?.last_30d || {};
                                const insights7d = alert.insights?.last_7d || {};

                                return (
                                    <div key={alert.funcionId} className="bg-[#121212] border border-white/5 rounded-2xl p-5 hover:border-blue-500/30 transition-all group">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h4 className="text-white font-black">{alert.obraNombre}</h4>
                                                <p className="text-blue-400 text-sm font-semibold">{alert.ciudad}</p>
                                                <p className="text-gray-500 text-xs mt-1">{new Date(alert.fecha).toLocaleDateString('es-AR')}</p>
                                            </div>
                                            <CheckCircle2 size={24} className="text-green-500" />
                                        </div>

                                        <div className="space-y-4">
                                            {alert.adSets && alert.adSets.length > 0 ? (
                                                alert.adSets.map((adSet) => {
                                                    const insights30d = adSet.insights?.last_30d || {};
                                                    const insights7d = adSet.insights?.last_7d || {};

                                                    return (
                                                        <div key={adSet.id} className="border-t border-white/5 pt-4 first:border-t-0 first:pt-0 space-y-2">
                                                            <div className="flex justify-between items-center px-1">
                                                                <span className="text-xs font-bold text-blue-400 truncate max-w-[200px]" title={adSet.name}>
                                                                    {adSet.name}
                                                                </span>
                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold uppercase ${
                                                                    adSet.status === 'ACTIVE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/10'
                                                                }`}>
                                                                    {adSet.status}
                                                                </span>
                                                            </div>
                                                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                                {/* Métricas 30D */}
                                                                <div className="bg-white/5 p-3 rounded-xl">
                                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Últimos 30 días</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><DollarSign size={10}/> Gasto</p>
                                                                            <p className="text-xs font-bold text-white">{formatCurrency(insights30d.spend || '0')}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400 flex items-center gap-1"><MousePointerClick size={10}/> Clics (CTR)</p>
                                                                            <p className="text-xs font-bold text-white">
                                                                                {insights30d.inline_link_clicks || '0'} 
                                                                                <span className="text-blue-400 text-[10px] ml-1">({parseFloat(insights30d.inline_link_click_ctr || '0').toFixed(2)}%)</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* Métricas 7D */}
                                                                <div className="bg-white/5 p-3 rounded-xl">
                                                                    <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-2">Últimos 7 días</p>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400">Gasto</p>
                                                                            <p className="text-xs font-bold text-white">{formatCurrency(insights7d.spend || '0')}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[10px] text-gray-400">Clics (CTR)</p>
                                                                            <p className="text-xs font-bold text-white">
                                                                                {insights7d.inline_link_clicks || '0'}
                                                                                <span className="text-blue-400 text-[10px] ml-1">({parseFloat(insights7d.inline_link_click_ctr || '0').toFixed(2)}%)</span>
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : (
                                                <>
                                                    {/* Métricas 30D */}
                                                    <div className="bg-white/5 p-3 rounded-xl">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Últimos 30 días</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1"><DollarSign size={12}/> Gasto</p>
                                                                <p className="text-sm font-bold text-white">{formatCurrency(insights30d.spend || '0')}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400 flex items-center gap-1"><MousePointerClick size={12}/> Clics (CTR)</p>
                                                                <p className="text-sm font-bold text-white">
                                                                    {insights30d.inline_link_clicks || '0'} 
                                                                    <span className="text-blue-400 text-xs ml-1">({parseFloat(insights30d.inline_link_click_ctr || '0').toFixed(2)}%)</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Métricas 7D */}
                                                    <div className="bg-white/5 p-3 rounded-xl">
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Últimos 7 días</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div>
                                                                <p className="text-xs text-gray-400">Gasto</p>
                                                                <p className="text-sm font-bold text-white">{formatCurrency(insights7d.spend || '0')}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-xs text-gray-400">Clics (CTR)</p>
                                                                <p className="text-sm font-bold text-white">
                                                                    {insights7d.inline_link_clicks || '0'}
                                                                    <span className="text-blue-400 text-xs ml-1">({parseFloat(insights7d.inline_link_click_ctr || '0').toFixed(2)}%)</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Alertas Críticas (Ocupa 1 columna) */}
                <div className="lg:col-span-1 space-y-4">
                    <h3 className="text-red-500 font-bold flex items-center space-x-2 ml-1">
                        <AlertCircle size={20} />
                        <span>¡Atención! Sin anuncios</span>
                    </h3>
                    
                    {functionsWithoutAds.length === 0 ? (
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 text-center">
                            <p className="text-gray-500 font-medium text-sm">Todas las funciones próximas tienen campañas activas.</p>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3">
                            {functionsWithoutAds.map((alert) => {
                                const daysAway = getDaysAway(alert.fecha);
                                const isUrgent = daysAway <= 15;
                                
                                const bgClass = isUrgent ? 'bg-red-500/10 border-red-500/30' : 'bg-orange-500/10 border-orange-500/30';
                                const textClass = isUrgent ? 'text-red-400' : 'text-orange-400';
                                const badgeBg = isUrgent ? 'bg-red-400/10' : 'bg-orange-400/10';

                                return (
                                    <div key={alert.funcionId} className={`p-4 rounded-xl border flex flex-col justify-between ${bgClass}`}>
                                        <div>
                                            <p className="text-white font-bold">{alert.obraNombre}</p>
                                            <p className="text-gray-400 text-xs">{alert.ciudad} - {new Date(alert.fecha).toLocaleDateString('es-AR')}</p>
                                        </div>
                                        <div className="mt-3 flex justify-between items-center">
                                            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${textClass} ${badgeBg}`}>
                                                {alert.status === 'NO_CAMPAIGN' ? 'Sin Campaña de Obra' : 'Sin Anuncio en Ciudad'}
                                            </span>
                                            <span className={`text-xs font-semibold ${textClass}`}>
                                                en {daysAway} días
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MetaCampaignAlerts;
