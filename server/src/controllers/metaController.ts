import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { getCampaignsWithAdSets, getAdSetsForCampaign, getInsights, MetaCampaign } from '../services/metaAdsService.js';

export const getDashboardAlerts = async (req: AuthRequest, res: Response) => {
    try {
        const adAccounts = [
            process.env.META_AD_ACCOUNT_ARG,
            process.env.META_AD_ACCOUNT_USA
        ].filter(Boolean) as string[];

        // 1. Fetch upcoming functions (from today onwards up to 30 days)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

        const funciones = await prisma.funcion.findMany({
            where: { fecha: { gte: today, lte: thirtyDaysFromNow }, confirmada: true },
            include: { obra: true },
            orderBy: { fecha: 'asc' }
        });

        // 2. Fetch Meta Campaigns from all configured accounts
        let allCampaigns: MetaCampaign[] = [];
        for (const accountId of adAccounts) {
            const campaigns = await getCampaignsWithAdSets(accountId);
            allCampaigns = [...allCampaigns, ...campaigns];
        }

        // 3. Match and Build the Response
        const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9\s]/g, " ").toLowerCase().trim().replace(/\s+/g, ' ');

        const results = await Promise.all(funciones.map(async (funcion) => {
            let matchedCampaign = null;
            let matchedAdSet = null;

            // Auto-match Logic
            if (funcion.obra.metaCampaignId) {
                matchedCampaign = allCampaigns.find(c => c.id === funcion.obra.metaCampaignId) || null;
                if (matchedCampaign) {
                    matchedCampaign.adsets = await getAdSetsForCampaign(matchedCampaign.id);
                    if (funcion.metaAdSetId) {
                        matchedAdSet = matchedCampaign.adsets.find(a => a.id === funcion.metaAdSetId) || null;
                    } else {
                        const cityName = normalize(funcion.ciudad);
                        matchedAdSet = matchedCampaign.adsets.find(a => normalize(a.name).includes(cityName)) || null;
                    }
                }
            } else {
                // Find ALL campaigns that match the obra name
                const obraName = normalize(funcion.obra.nombre);
                const possibleCampaigns = allCampaigns.filter(c => {
                    const cName = normalize(c.name);
                    // Match if one includes the other, or if their first words match (to catch cases like "Raviolis" vs "Raviolis Piyama Party")
                    if (cName.includes(obraName) || obraName.includes(cName)) return true;
                    const firstWordC = cName.split(' ')[0];
                    const firstWordO = obraName.split(' ')[0];
                    return firstWordC.length > 3 && firstWordC === firstWordO;
                });

                if (possibleCampaigns.length > 0) {
                    const cityName = normalize(funcion.ciudad);
                    
                    // Look for the specific Ad Set in ALL possible campaigns
                    for (const camp of possibleCampaigns) {
                        camp.adsets = await getAdSetsForCampaign(camp.id);
                        const foundAdSet = camp.adsets.find(a => normalize(a.name).includes(cityName));
                        if (foundAdSet) {
                            matchedCampaign = camp;
                            matchedAdSet = foundAdSet;
                            break;
                        }
                    }

                    // If we didn't find the Ad Set in any of them, just pick the first active one, or the first one as fallback
                    if (!matchedCampaign) {
                        matchedCampaign = possibleCampaigns.find(c => c.status === 'ACTIVE' || c.effective_status === 'ACTIVE') || possibleCampaigns[0];
                    }
                }
            }

            // Fetch Insights if matched
            let insights30d = null;
            let insights7d = null;

            if (matchedAdSet) {
                insights30d = await getInsights(matchedAdSet.id, 'adset', 'last_30d');
                insights7d = await getInsights(matchedAdSet.id, 'adset', 'last_7d');
            } else if (matchedCampaign) {
                // Fallback to campaign insights if no specific ad set matched
                insights30d = await getInsights(matchedCampaign.id, 'campaign', 'last_30d');
                insights7d = await getInsights(matchedCampaign.id, 'campaign', 'last_7d');
            }

            return {
                funcionId: funcion.id,
                obraNombre: funcion.obra.nombre,
                ciudad: funcion.ciudad,
                fecha: funcion.fecha,
                status: matchedCampaign ? (matchedAdSet ? 'OK' : 'NO_ADSET') : 'NO_CAMPAIGN',
                campaign: matchedCampaign ? { id: matchedCampaign.id, name: matchedCampaign.name, status: matchedCampaign.status } : null,
                adSet: matchedAdSet ? { id: matchedAdSet.id, name: matchedAdSet.name, status: matchedAdSet.status } : null,
                insights: {
                    last_30d: insights30d,
                    last_7d: insights7d
                }
            };
        }));

        res.json(results);
    } catch (error: any) {
        console.error('Error fetching Meta dashboard alerts:', error);
        res.status(500).json({ error: 'Error connecting to Meta API', details: error.message });
    }
};

export const linkFuncionToMeta = async (req: AuthRequest, res: Response) => {
    try {
        const { funcionId, obraId, metaCampaignId, metaAdSetId } = req.body;

        if (obraId && metaCampaignId) {
            await prisma.obra.update({
                where: { id: obraId },
                data: { metaCampaignId }
            });
        }

        if (funcionId && metaAdSetId) {
            await prisma.funcion.update({
                where: { id: funcionId },
                data: { metaAdSetId }
            });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error linking to Meta:', error);
        res.status(500).json({ error: 'Error saving Meta links' });
    }
};
