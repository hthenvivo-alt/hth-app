
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import {
    Download,
    RefreshCw,
    RotateCcw,
    HardDrive,
    CheckCircle2,
    AlertTriangle,
    Loader2
} from 'lucide-react';

interface BackupFile {
    filename: string;
    created_at: string;
    size: number;
}

const BackupManager: React.FC = () => {
    const queryClient = useQueryClient();
    const [restoring, setRestoring] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const { data: backups, isLoading } = useQuery({
        queryKey: ['backups'],
        queryFn: async () => {
            const res = await api.get('/backup');
            return res.data;
        }
    });

    const createBackupMutation = useMutation({
        mutationFn: async () => {
            await api.post('/backup');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['backups'] });
            alert('Backup creado correctamente');
        },
        onError: () => {
            alert('Error al crear el backup');
        }
    });

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.json')) {
            alert('Solo se permiten archivos JSON');
            return;
        }

        const formData = new FormData();
        formData.append('backup', file);

        setUploading(true);
        try {
            await api.post('/backup/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Backup subido correctamente');
            queryClient.invalidateQueries({ queryKey: ['backups'] });
        } catch (error) {
            console.error('Error uploading backup:', error);
            alert('Error al subir el backup');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const restoreBackupMutation = useMutation({
        mutationFn: async (filename: string) => {
            setRestoring(filename);
            await api.post(`/backup/restore/${filename}`);
        },
        onSuccess: () => {
            alert('Base de datos restaurada correctamente. La página se recargará.');
            window.location.reload();
        },
        onError: () => {
            alert('Error al restaurar el backup');
            setRestoring(null);
        }
    });

    const handleRestore = (filename: string) => {
        if (window.confirm('¿Estás seguro de que quieres restaurar este backup? SE PERDERÁN TODOS LOS DATOS ACTUALES y serán reemplazados por los de la copia.')) {
            restoreBackupMutation.mutate(filename);
        }
    };

    const handleDownload = async (filename: string) => {
        try {
            const response = await api.get(`/backup/download/${filename}`, {
                responseType: 'blob',
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error downloading backup:', error);
            alert('Error al descargar el backup');
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            <div className="p-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-white mb-1">Copias Disponibles</h3>
                        <p className="text-xs text-gray-500">
                            Backups automáticos diarios y manuales.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleUpload}
                            accept=".json"
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-white/10 disabled:opacity-50"
                        >
                            {uploading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                            Subir Backup
                        </button>
                        <button
                            onClick={() => createBackupMutation.mutate()}
                            disabled={createBackupMutation.isPending}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all disabled:opacity-50"
                        >
                            {createBackupMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <HardDrive size={16} />}
                            Crear Backup Ahora
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-8">
                        <Loader2 className="animate-spin text-primary-500" size={32} />
                    </div>
                ) : (
                    <div className="space-y-3">
                        {backups?.length === 0 ? (
                            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">
                                <p className="text-gray-500 text-sm">No hay backups disponibles.</p>
                            </div>
                        ) : (
                            backups?.map((backup: BackupFile) => (
                                <div key={backup.filename} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white/5 rounded-lg text-primary-500">
                                            <CheckCircle2 size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-200">{backup.filename}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                                <span>{new Date(backup.created_at).toLocaleString('es-AR')}</span>
                                                <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                                                <span>{formatSize(backup.size)}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleDownload(backup.filename)}
                                            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                            title="Descargar"
                                        >
                                            <Download size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleRestore(backup.filename)}
                                            disabled={restoring !== null}
                                            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg text-xs font-bold uppercase tracking-widest border border-red-500/20 transition-all"
                                        >
                                            {restoring === backup.filename ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                                            Restaurar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                <div className="mt-6 p-4 bg-yellow-500/5 border border-yellow-500/10 rounded-xl flex items-start gap-3">
                    <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-yellow-500/80 leading-relaxed font-medium">
                        <strong className="block text-yellow-500 mb-1">Importante:</strong>
                        Al restaurar un backup, toda la información actual será reemplazada por la versión guardada. Las imágenes y comprobantes se mantienen en el servidor, pero los enlaces en la base de datos dependerán del backup restaurado.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BackupManager;
