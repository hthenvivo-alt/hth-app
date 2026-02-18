import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Receipt,
    Plus,
    Trash2,
    Loader2,
    Tag,
    Calendar,
    Upload,
    FileText,
    Download
} from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

interface Props {
    obraId?: string;
    funcionId?: string;
}

const GastosList: React.FC<Props> = ({ obraId, funcionId }) => {
    const queryClient = useQueryClient();
    const [desc, setDesc] = useState('');
    const [monto, setMonto] = useState('');
    const [tipo, setTipo] = useState('Publicidad');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [uploadingId, setUploadingId] = useState<string | null>(null);

    const queryKey = obraId ? ['gastos', 'obra', obraId] : ['gastos', 'funcion', funcionId];
    const endpoint = obraId ? `/gastos/obra/${obraId}` : `/gastos/funcion/${funcionId}`;

    const { data: gastos, isLoading } = useQuery({
        queryKey,
        queryFn: async () => {
            const res = await api.get(endpoint);
            return res.data;
        }
    });

    const addMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/gastos', { ...data, obraId, funcionId });
        },
        onSuccess: () => {
            setDesc('');
            setMonto('');
            queryClient.invalidateQueries({ queryKey: ['gastos'] });
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/gastos/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['gastos'] });
            queryClient.invalidateQueries({ queryKey });
        }
    });

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (desc && monto) {
            addMutation.mutate({
                descripcion: desc,
                monto: parseFloat(monto),
                tipoGasto: tipo,
                fechaGasto: fecha
            });
        }
    };

    const handleUploadVoucher = async (e: React.ChangeEvent<HTMLInputElement>, gastoId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingId(gastoId);
        const formData = new FormData();
        formData.append('voucher', file);

        try {
            await api.post(`/gastos/${gastoId}/upload-voucher`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            queryClient.invalidateQueries({ queryKey });
            alert('Comprobante subido correctamente');
        } catch (error) {
            console.error('Error uploading voucher:', error);
            alert('Error al subir el comprobante');
        } finally {
            setUploadingId(null);
            e.target.value = '';
        }
    };

    const handleDownloadAllSelected = async () => {
        if (!funcionId) return;
        try {
            const response = await api.get(`/gastos/funcion/${funcionId}/download-vouchers`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Comprobantes_Gastos_${funcionId}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error: any) {
            console.error('Error downloading ZIP:', error);
            if (error.response?.status === 404) {
                alert('No hay comprobantes para descargar.');
            } else {
                alert('Error al descargar los comprobantes.');
            }
        }
    };

    return (
        <div className="bg-[#121212] border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                    <Receipt className="text-red-500" size={20} />
                    Registro de Gastos
                </h3>
                {funcionId && (
                    <button
                        onClick={handleDownloadAllSelected}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-400 transition-all border border-white/5"
                    >
                        <Download size={12} />
                        Bajar ZIP Comprobantes
                    </button>
                )}
            </div>

            <form onSubmit={handleAdd} className="space-y-4 mb-8 bg-white/[0.02] p-4 rounded-xl border border-white/5">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Descripción</label>
                    <input
                        type="text"
                        value={desc}
                        onChange={(e) => setDesc(e.target.value)}
                        placeholder="Ej: Publicidad Instagram"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 ring-red-500"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Monto ($)</label>
                        <input
                            type="number"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            placeholder="Ej: 50000"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 ring-red-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fecha</label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm outline-none"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Categoría</label>
                    <select
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm appearance-none outline-none"
                    >
                        <option value="Publicidad">Publicidad</option>
                        <option value="Aéreo">Traslado</option>
                        <option value="Hotel">Alojamiento</option>
                        <option value="Caché">Caché</option>
                        <option value="Sala">Alquiler Sala</option>
                        <option value="Otros">Otros</option>
                    </select>
                </div>
                <button
                    disabled={addMutation.isPending || !desc || !monto}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                    {addMutation.isPending ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                    Cargar Gasto
                </button>
            </form>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="flex justify-center p-4"><Loader2 className="animate-spin text-red-500" /></div>
                ) : gastos?.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <Tag className="text-red-500" size={16} />
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{g.descripcion}</p>
                                <p className="text-[10px] text-gray-500 flex items-center gap-2">
                                    <span>{g.tipoGasto}</span>
                                    <span className="flex items-center gap-1"><Calendar size={10} /> {formatDate(g.fechaGasto)}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-red-400 mr-2">-${parseFloat(g.monto).toLocaleString('es-AR')}</span>

                            {/* Voucher Actions */}
                            <div className="flex items-center">
                                {g.comprobanteDocumento ? (
                                    <button
                                        onClick={() => window.open(`${api.defaults.baseURL?.replace('/api', '')}${g.comprobanteDocumento.linkDrive}`, '_blank')}
                                        className="p-2 text-green-500/50 hover:text-green-500 transition-colors"
                                        title="Ver comprobante"
                                    >
                                        <FileText size={16} />
                                    </button>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => handleUploadVoucher(e, g.id)}
                                            disabled={uploadingId === g.id}
                                        />
                                        <button className={`p-2 text-gray-700 hover:text-primary-500 transition-colors ${uploadingId === g.id ? 'animate-pulse' : ''}`}>
                                            {uploadingId === g.id ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                        </button>
                                    </div>
                                )}

                                <button
                                    onClick={() => deleteMutation.mutate(g.id)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-700 hover:text-red-500 transition-all ml-1"
                                    title="Eliminar gasto"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GastosList;
