import React, { useState } from 'react';
import {
    FileText, Search, Plus, ExternalLink,
    FolderPlus, Loader2, Folder,
    FileChartPie, FileCode, FileImage, File,
    Link, Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import Modal from '../components/Modal';

interface Obra {
    id: string;
    nombre: string;
    driveFolderId: string | null;
}

interface Documento {
    id: string;
    nombreDocumento: string;
    tipoDocumento: string;
    linkDrive: string;
    created_at: string;
    subidoPor: { nombre: string; apellido: string };
    obra?: { nombre: string };
    driveFileId?: string;
}

interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    webViewLink: string;
    webContentLink?: string;
    size?: string;
}

const CATEGORIES = [
    'Contrato',
    'Rider',
    'Flyer',
    'Guion',
    'Material de Prensa',
    'Foto',
    'Video',
    'Comprobante'
];

const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="text-red-400" size={24} />;
    if (mimeType.includes('image')) return <FileImage className="text-blue-400" size={24} />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileChartPie className="text-green-400" size={24} />;
    if (mimeType.includes('presentation')) return <FileCode className="text-orange-400" size={24} />;
    return <File className="text-gray-400" size={24} />;
};

const Documentos: React.FC = () => {
    const [selectedObraId, setSelectedObraId] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({ tipo: 'Contrato', nombre: '' });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const queryClient = useQueryClient();

    const { data: obras } = useQuery<Obra[]>({
        queryKey: ['obras'],
        queryFn: async () => {
            const res = await api.get('/obras');
            return res.data;
        }
    });

    const { data: docData, isLoading } = useQuery<{ dbDocs: Documento[], driveFiles: DriveFile[], driveFolderId: string | null }>({
        queryKey: ['documentos', selectedObraId],
        queryFn: async () => {
            if (!selectedObraId) return { dbDocs: [], driveFiles: [], driveFolderId: null };
            const res = await api.get(`/documentos/obra/${selectedObraId}`);
            return res.data;
        },
        enabled: !!selectedObraId
    });

    const { data: globalSearchResults, isLoading: isGlobalSearching } = useQuery<Documento[]>({
        queryKey: ['documentos-global', searchTerm],
        queryFn: async () => {
            if (selectedObraId || searchTerm.length < 2) return [];
            const res = await api.get(`/documentos/search?q=${searchTerm}`);
            return res.data;
        },
        enabled: !selectedObraId && searchTerm.length >= 2
    });

    const initFolderMutation = useMutation({
        mutationFn: async () => {
            await api.post(`/documentos/init-folder/${selectedObraId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documentos', selectedObraId] });
            queryClient.invalidateQueries({ queryKey: ['obras'] });
        }
    });

    const uploadMutation = useMutation({
        mutationFn: async (formData: FormData) => {
            await api.post(`/documentos/upload/${selectedObraId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            setIsUploadModalOpen(false);
            setSelectedFile(null);
            setUploadData({ tipo: 'Contrato', nombre: '' });
            queryClient.invalidateQueries({ queryKey: ['documentos', selectedObraId] });
        }
    });

    const handleUpload = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('tipoDocumento', uploadData.tipo);
        formData.append('nombreDocumento', uploadData.nombre || selectedFile.name);

        uploadMutation.mutate(formData);
    };

    const filteredLiveFiles = docData?.driveFiles.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        f.mimeType !== 'application/vnd.google-apps.folder'
    ) || [];

    const selectedObra = obras?.find(o => o.id === selectedObraId);

    const handleCopyLink = (e: React.MouseEvent, link: string, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        navigator.clipboard.writeText(link);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Link copying handled by handleCopyLink

    return (
        <div className="p-8">
            <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
                    <p className="text-gray-500">Gestión de contratos, riders, flyers y materiales por obra.</p>
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={selectedObraId}
                        onChange={(e) => setSelectedObraId(e.target.value)}
                        className="px-4 py-2.5 bg-[#121212] border border-white/5 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 min-w-[250px]"
                    >
                        <option value="">Todas las Obras (Búsqueda Global)</option>
                        {obras?.map(o => (
                            <option key={o.id} value={o.id}>{o.nombre}</option>
                        ))}
                    </select>

                    {selectedObraId && (
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            disabled={!selectedObra?.driveFolderId}
                            className="flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary-500/20"
                        >
                            <Plus size={20} />
                            <span>Cargar Documento</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="space-y-8">
                {/* Search BAR */}
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                        type="text"
                        placeholder={selectedObraId ? `Buscar en archivos de "${selectedObra?.nombre}"...` : "Buscar documentos en todas las obras..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-[#121212] border border-white/5 rounded-2xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all text-lg shadow-xl"
                    />
                    {(isLoading || isGlobalSearching) && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="text-primary-500 animate-spin" size={20} />
                        </div>
                    )}
                </div>

                {!selectedObraId ? (
                    searchTerm.length < 2 ? (
                        <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center text-gray-500 text-center">
                            <Search size={64} className="mb-6 opacity-20" />
                            <p className="text-xl font-medium mb-2 text-white/50">Búsqueda Global de Documentos</p>
                            <p className="max-w-md mx-auto text-sm text-gray-600 uppercase tracking-widest">
                                Escribe el nombre de un documento para buscar en todas las obras
                            </p>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-lg font-semibold flex items-center gap-2 mb-6">
                                <FileText size={18} className="text-primary-500" />
                                Resultados de búsqueda global
                            </h2>

                            {globalSearchResults?.length === 0 ? (
                                <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 text-center text-gray-500">
                                    No se encontraron documentos que coincidan con &quot;{searchTerm}&quot;
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {globalSearchResults?.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="group relative bg-[#121212] border border-white/5 p-4 rounded-xl hover:border-primary-500/50 transition-all flex items-start gap-4"
                                        >
                                            <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary-500/10 transition-colors">
                                                <FileText size={24} className="text-primary-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">{doc.nombreDocumento}</p>
                                                <p className="text-[10px] text-primary-500 uppercase font-bold tracking-wider mb-1">{doc.obra?.nombre}</p>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{doc.tipoDocumento}</p>
                                            </div>

                                            <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <a
                                                    href={doc.linkDrive}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    title="Abrir"
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button
                                                    onClick={(e) => handleCopyLink(e, doc.linkDrive, doc.id)}
                                                    title="Copiar Enlace"
                                                    className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                >
                                                    {copiedId === doc.id ? <Check size={16} className="text-green-500" /> : <Link size={16} />}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                ) : !selectedObra?.driveFolderId ? (
                    <div className="bg-[#121212] border border-white/5 rounded-2xl p-20 flex flex-col items-center justify-center text-gray-500 text-center">
                        <FolderPlus size={64} className="mb-6 text-primary-500/50" />
                        <p className="text-xl font-medium mb-4 text-white">Esta obra aún no tiene una carpeta de Drive</p>
                        <button
                            onClick={() => initFolderMutation.mutate()}
                            disabled={initFolderMutation.isPending}
                            className="flex items-center space-x-2 bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold transition-all border border-white/10"
                        >
                            {initFolderMutation.isPending ? <Loader2 size={20} className="animate-spin" /> : <FolderPlus size={20} />}
                            <span>Inicializar Carpeta en Drive</span>
                        </button>
                        <p className="mt-4 text-sm max-w-sm">Esto creará una carpeta dedicada para &quot;{selectedObra?.nombre}&quot; dentro del directorio &quot;HTH APP&quot; de Google Drive.</p>
                    </div>
                ) : (
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Folder size={18} className="text-primary-500" />
                                Archivos de &quot;{selectedObra?.nombre}&quot; en Drive
                            </h2>
                            {filteredLiveFiles.length > 0 && (
                                <a
                                    href={`https://drive.google.com/drive/folders/${selectedObra?.driveFolderId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-primary-500 hover:underline flex items-center gap-1"
                                >
                                    Ver carpeta completa <ExternalLink size={12} />
                                </a>
                            )}
                        </div>

                        {filteredLiveFiles.length === 0 ? (
                            <div className="bg-white/[0.02] border border-dashed border-white/10 rounded-2xl p-10 text-center text-gray-500">
                                {searchTerm ? `No se encontraron archivos que coincidan con &quot;${searchTerm}&quot;` : "No hay archivos en la carpeta de Drive"}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredLiveFiles.map(file => (
                                    <div
                                        key={file.id}
                                        className="group relative bg-[#121212] border border-white/5 p-4 rounded-xl hover:border-primary-500/50 transition-all flex items-start gap-4"
                                    >
                                        <div className="p-3 bg-white/5 rounded-lg group-hover:bg-primary-500/10 transition-colors">
                                            {getFileIcon(file.mimeType)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-200 truncate group-hover:text-white transition-colors">{file.name}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{file.mimeType.split('/')[1] || 'Archivo'}</p>
                                        </div>

                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a
                                                href={file.webViewLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title="Abrir"
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            <button
                                                onClick={(e) => handleCopyLink(e, file.webViewLink, file.id)}
                                                title="Copiar Enlace"
                                                className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                                            >
                                                {copiedId === file.id ? <Check size={16} className="text-green-500" /> : <Link size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Upload Modal */}
            <Modal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                title="Cargar Nuevo Documento"
            >
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Nombre del Documento</label>
                        <input
                            type="text"
                            value={uploadData.nombre}
                            onChange={(e) => setUploadData({ ...uploadData, nombre: e.target.value })}
                            placeholder="Ej: Rider Luces 2024"
                            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Categoría</label>
                        <select
                            value={uploadData.tipo}
                            onChange={(e) => setUploadData({ ...uploadData, tipo: e.target.value })}
                            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1.5">Archivo</label>
                        <input
                            type="file"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="w-full px-4 py-2.5 bg-[#0A0A0A] border border-white/10 rounded-xl text-white focus:outline-none file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary-500/20 file:text-primary-400 hover:file:bg-primary-500/30"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setIsUploadModalOpen(false)}
                            className="flex-1 px-4 py-2.5 border border-white/10 rounded-xl text-white hover:bg-white/5 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={!selectedFile || uploadMutation.isPending}
                            className="flex-1 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                        >
                            {uploadMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                            Subir a Drive
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default Documentos;
