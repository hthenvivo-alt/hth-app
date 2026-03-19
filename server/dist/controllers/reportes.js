import prisma from '../lib/prisma.js';
export const getArtistReport = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
        const isProductor = req.user?.rol === 'Productor';
        const obras = await prisma.obra.findMany({
            where: (isAdmin || isProductor) ? {} : {
                OR: [
                    { artistas: { some: { id: userId } } },
                    { productorEjecutivoId: userId }
                ]
            },
            include: {
                funciones: {
                    where: { confirmada: true },
                    orderBy: {
                        fecha: 'asc'
                    }
                }
            }
        });
        res.json(obras);
    }
    catch (error) {
        console.error('Error fetching artist report:', error);
        res.status(500).json({ error: 'Error fetching artist report' });
    }
};
export const getObraSalesEvolution = async (req, res) => {
    try {
        const obraId = req.params.obraId;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
        const isProductor = req.user?.rol === 'Productor';
        // Check permission and fetch obra with functions and sales
        const obra = await prisma.obra.findFirst({
            where: {
                id: obraId,
                ...((isAdmin || isProductor) ? {} : {
                    OR: [
                        { artistas: { some: { id: userId } } },
                        { productorEjecutivoId: userId }
                    ]
                })
            },
            include: {
                funciones: {
                    where: { confirmada: true },
                    include: {
                        ventas: {
                            orderBy: {
                                fechaRegistro: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        fecha: 'asc'
                    }
                }
            }
        });
        if (!obra) {
            return res.status(404).json({ error: 'Obra not found or unauthorized' });
        }
        // Flatten data for the report
        const evolutionData = obra.funciones.flatMap((f) => f.ventas.map((v) => ({
            obraNombre: obra.nombre,
            funcionFecha: f.fecha,
            salaNombre: f.salaNombre,
            ciudad: f.ciudad,
            capacidadSala: f.capacidadSala,
            ventaFecha: v.fechaRegistro,
            entradasVendidas: v.entradasVendidas,
            tipoVenta: v.tipoVenta,
            canalVenta: v.canalVenta,
            // Calculate days before the show
            diasAntelacion: Math.floor((new Date(f.fecha).getTime() - new Date(v.fechaRegistro).getTime()) / (1000 * 60 * 60 * 24))
        })));
        res.json(evolutionData);
    }
    catch (error) {
        console.error('Error fetching obra sales evolution:', error);
        res.status(500).json({ error: 'Error fetching evolution data' });
    }
};
export const getMatrixReportData = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isAdmin = req.user?.rol === 'Administrador' || req.user?.rol === 'Admin';
        if (!isAdmin) {
            return res.status(403).json({ error: 'Access denied. Admins only.' });
        }
        const obras = await prisma.obra.findMany({
            where: {}, // Admins can see everything
            include: {
                funciones: {
                    where: { confirmada: true },
                    include: {
                        ventas: {
                            orderBy: {
                                fechaRegistro: 'asc'
                            }
                        }
                    },
                    orderBy: {
                        fecha: 'asc'
                    }
                }
            },
            orderBy: {
                nombre: 'asc'
            }
        });
        res.json(obras);
    }
    catch (error) {
        console.error('Error fetching matrix report data:', error);
        res.status(500).json({ error: 'Error fetching matrix data' });
    }
};
