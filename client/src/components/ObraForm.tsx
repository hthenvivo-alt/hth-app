import React, { useState, useEffect } from 'react';
import api from '../lib/api';
import { Loader2 } from 'lucide-react';

interface ObraFormProps {
    initialData?: any;
    onSuccess: () => void;
    onCancel: () => void;
}

interface ArtistaPayout {
    id?: string;
    nombre: string;
    porcentaje: number | '';
    base: 'Bruta' | 'Neta' | 'Utilidad';
}

const ObraForm: React.FC<ObraFormProps> = ({ initialData, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        nombre: '',
        artistaPrincipal: '',
        descripcion: '',
        estado: 'En Desarrollo',
        fechaEstreno: '',
    });
    const [artistaPayouts, setArtistaPayouts] = useState<ArtistaPayout[]>([]);
    const [selectedArtistas, setSelectedArtistas] = useState<string[]>([]);
    const [availableArtistas, setAvailableArtistas] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch all users to filter those with role 'Artista'
        api.get('/users').then(res => {
            setAvailableArtistas(res.data.filter((u: any) => u.rol === 'Artista'));
        }).catch(err => console.error('Error fetching users:', err));

        if (initialData) {
            setFormData({
                nombre: initialData.nombre || '',
                artistaPrincipal: initialData.artistaPrincipal || '',
                descripcion: initialData.descripcion || '',
                estado: initialData.estado || 'En Desarrollo',
                fechaEstreno: initialData.fechaEstreno ? new Date(initialData.fechaEstreno).toISOString().split('T')[0] : '',
            });
            if (initialData.artistaPayouts) {
                setArtistaPayouts(initialData.artistaPayouts.map((p: any) => ({
                    ...p,
                    porcentaje: Number(p.porcentaje)
                })));
            }
            if (initialData.artistas) {
                setSelectedArtistas(initialData.artistas.map((a: any) => a.id));
            }
        }
    }, [initialData]);

    const addArtista = () => {
        setArtistaPayouts([...artistaPayouts, { nombre: '', porcentaje: '', base: 'Utilidad' }]);
    };

    const removeArtista = (index: number) => {
        setArtistaPayouts(artistaPayouts.filter((_, i) => i !== index));
    };

    const updateArtista = (index: number, field: keyof ArtistaPayout, value: any) => {
        const newPayouts = [...artistaPayouts];
        newPayouts[index] = { ...newPayouts[index], [field]: value };
        setArtistaPayouts(newPayouts);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const payload = {
            ...formData,
            artistaPayouts: artistaPayouts.map(p => ({
                ...p,
                porcentaje: Number(p.porcentaje) || 0
            })),
            artistas: selectedArtistas
        };

        try {
            if (initialData?.id) {
                await api.put(`/obras/${initialData.id}`, payload);
            } else {
                await api.post('/obras', payload);
            }
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al guardar la obra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Nombre de la Obra</label>
                    <input
                        type="text"
                        required
                        value={formData.nombre}
                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: Esperando la Carroza"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Artista Principal (Referencia)</label>
                    <input
                        type="text"
                        required
                        value={formData.artistaPrincipal}
                        onChange={(e) => setFormData({ ...formData, artistaPrincipal: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Ej: Betiana Blum"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Estado</label>
                    <select
                        value={formData.estado}
                        onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                    >
                        <option value="En Desarrollo">En Desarrollo</option>
                        <option value="En Gira">En Gira</option>
                        <option value="Finalizada">Finalizada</option>
                    </select>
                </div>

                {/* Artist Portal Access Section */}
                <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-primary-500">Usuarios con Acceso al Portal (Artistas)</h3>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Selecciona los usuarios que podrán ver los reportes de esta obra:</p>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {availableArtistas.map(user => (
                            <label
                                key={user.id}
                                className={`flex items-center space-x-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedArtistas.includes(user.id)
                                        ? 'bg-primary-500/10 border-primary-500/30 text-primary-400'
                                        : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/10'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedArtistas.includes(user.id)}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setSelectedArtistas([...selectedArtistas, user.id]);
                                        } else {
                                            setSelectedArtistas(selectedArtistas.filter(id => id !== user.id));
                                        }
                                    }}
                                    className="hidden"
                                />
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedArtistas.includes(user.id) ? 'bg-primary-500 border-primary-500' : 'border-gray-600'
                                    }`}>
                                    {selectedArtistas.includes(user.id) && <svg size={12} xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
                                </div>
                                <span className="text-xs font-black truncate uppercase tracking-tight">{user.nombre} {user.apellido}</span>
                            </label>
                        ))}
                        {availableArtistas.length === 0 && (
                            <p className="col-span-full text-xs text-gray-500 italic p-2">No se encontraron usuarios con el rol "Artista".</p>
                        )}
                    </div>
                </div>

                {/* Artist Payouts Section */}
                <div className="md:col-span-2 p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary-500">Configuración de Artistas y Repartos</h3>
                        <button
                            type="button"
                            onClick={addArtista}
                            className="text-xs py-1 px-3 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 border border-primary-500/20 rounded-lg transition-all font-bold"
                        >
                            + Agregar Artista
                        </button>
                    </div>

                    {artistaPayouts.length === 0 ? (
                        <p className="text-xs text-gray-500 italic">No hay artistas configurados para el reparto automático.</p>
                    ) : (
                        <div className="space-y-3">
                            {artistaPayouts.map((p, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-3 items-end bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="col-span-5">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Nombre</label>
                                        <input
                                            type="text"
                                            value={p.nombre}
                                            onChange={(e) => updateArtista(idx, 'nombre', e.target.value)}
                                            className="w-full bg-transparent border-b border-white/10 text-sm focus:border-primary-500 outline-none transition-all pb-1"
                                            placeholder="Nombre del artista"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">%</label>
                                        <input
                                            type="number"
                                            value={p.porcentaje}
                                            onChange={(e) => updateArtista(idx, 'porcentaje', e.target.value)}
                                            className="w-full bg-transparent border-b border-white/10 text-sm focus:border-primary-500 outline-none transition-all pb-1 text-center"
                                            placeholder="0"
                                            required
                                        />
                                    </div>
                                    <div className="col-span-4">
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Sobre</label>
                                        <select
                                            value={p.base}
                                            onChange={(e) => updateArtista(idx, 'base', e.target.value as any)}
                                            className="w-full bg-transparent border-b border-white/10 text-sm focus:border-primary-500 outline-none transition-all pb-1 text-white"
                                        >
                                            <option value="Utilidad">Utilidad</option>
                                            <option value="Neta">Recaudación Neta</option>
                                            <option value="Bruta">Recaudación Bruta</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={() => removeArtista(idx)}
                                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Fecha de Estreno</label>
                    <input
                        type="date"
                        value={formData.fechaEstreno}
                        onChange={(e) => setFormData({ ...formData, fechaEstreno: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-white"
                    />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-400 mb-2">Descripción</label>
                    <textarea
                        rows={2}
                        value={formData.descripcion}
                        onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                        placeholder="Detalles sobre la obra..."
                    />
                </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/5">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 rounded-xl font-semibold transition-all"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 px-4 bg-primary-500 hover:bg-primary-600 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <span>Guardar Obra</span>}
                </button>
            </div>
        </form>
    );
};

export default ObraForm;
