import prisma from '../lib/prisma.js';
export const getVentasByFuncion = async (req, res) => {
    const { funcionId } = req.params;
    try {
        const ventas = await prisma.venta.findMany({
            where: { funcionId: funcionId },
            orderBy: { fechaRegistro: 'desc' }
        });
        res.json(ventas);
    }
    catch (error) {
        res.status(500).json({ error: 'Error fetching ventas' });
    }
};
export const createVenta = async (req, res) => {
    const { funcionId, entradasVendidas, facturacionBruta, tipoVenta, canalVenta } = req.body;
    console.log('Incoming Venta data:', req.body);
    try {
        const venta = await prisma.venta.create({
            data: {
                funcionId,
                entradasVendidas: parseInt(entradasVendidas),
                facturacionBruta: facturacionBruta || null,
                tipoVenta,
                canalVenta,
                fechaRegistro: new Date()
            }
        });
        console.log('Venta created:', venta.id);
        // Always update the 'vendidas' and 'ultimaFacturacionBruta' in Funcion with the new values
        await prisma.funcion.update({
            where: { id: funcionId },
            data: {
                vendidas: parseInt(entradasVendidas),
                ultimaFacturacionBruta: facturacionBruta ? parseFloat(facturacionBruta) : null,
                ultimaActualizacionVentas: new Date()
            }
        });
        console.log('Funcion total updated for:', funcionId);
        res.status(201).json(venta);
    }
    catch (error) {
        console.error('CRITICAL ERROR in createVenta:', error);
        res.status(500).json({ error: 'Error recording venta', details: error instanceof Error ? error.message : String(error) });
    }
};
export const deleteVenta = async (req, res) => {
    const { id } = req.params;
    try {
        const venta = await prisma.venta.findUnique({ where: { id: id } });
        if (!venta)
            return res.status(404).json({ error: 'Venta not found' });
        if (venta.tipoVenta === 'Venta Final') {
            await prisma.funcion.update({
                where: { id: venta.funcionId },
                data: {
                    vendidas: {
                        decrement: venta.entradasVendidas
                    }
                }
            });
        }
        await prisma.venta.delete({ where: { id: id } });
        res.status(204).send();
    }
    catch (error) {
        res.status(500).json({ error: 'Error deleting venta' });
    }
};
