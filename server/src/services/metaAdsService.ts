import dotenv from 'dotenv';
dotenv.config();

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export interface MetaInsights {
    spend: string;
    clicks: string;
    inline_link_clicks: string;
    inline_link_click_ctr: string;
    impressions: string;
}

export interface MetaAdSet {
    id: string;
    name: string;
    status: string;
    effective_status?: string;
    insights?: MetaInsights;
}

export interface MetaCampaign {
    id: string;
    name: string;
    status: string;
    effective_status?: string;
    adsets: MetaAdSet[];
    insights?: MetaInsights;
}

const cache = new Map<string, { data: any, timestamp: number, promise?: Promise<any> }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function fetchFromMeta(endpoint: string, params: Record<string, any> = {}) {
    if (!ACCESS_TOKEN) throw new Error('Meta Access Token is missing.');
    
    const cacheKey = `${endpoint}?${new URLSearchParams(params).toString()}`;
    const now = Date.now();
    const cached = cache.get(cacheKey);
    
    if (cached && (now - cached.timestamp < CACHE_TTL)) {
        if (cached.promise) return await cached.promise;
        return cached.data;
    }

    if (cached && cached.promise) {
        return await cached.promise;
    }

    const fetchPromise = (async () => {
        const url = new URL(`${BASE_URL}/${endpoint}`);
        url.searchParams.append('access_token', ACCESS_TOKEN);
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.append(key, value);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Meta API Error on ${endpoint}:`, errorText);
            throw new Error(`Meta API error: ${response.statusText}`);
        }
        
        return await response.json();
    })();

    cache.set(cacheKey, { data: null, timestamp: now, promise: fetchPromise });

    try {
        const data = await fetchPromise;
        cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    } catch (error) {
        cache.delete(cacheKey);
        throw error;
    }
}

export const getCampaignsWithAdSets = async (adAccountId: string): Promise<MetaCampaign[]> => {
    // Fetch active campaigns (1 request per account)
    const campaignsData = await fetchFromMeta(`act_${adAccountId}/campaigns`, {
        fields: 'id,name,status,effective_status',
        limit: '1000'
    });

    const campaigns: MetaCampaign[] = campaignsData.data || [];
    for (const campaign of campaigns) {
        campaign.adsets = []; // Initialize empty, fetch later only if needed
    }

    return campaigns;
};

export const getAdSetsForCampaign = async (campaignId: string): Promise<MetaAdSet[]> => {
    try {
        const adsetsData = await fetchFromMeta(`${campaignId}/adsets`, {
            fields: 'id,name,status,effective_status',
            limit: '1000'
        });
        return adsetsData.data || [];
    } catch (error) {
        console.error(`Error fetching adsets for campaign ${campaignId}:`, error);
        return [];
    }
};

export const getInsights = async (objectId: string, level: 'campaign' | 'adset', datePreset: 'last_30d' | 'last_7d'): Promise<MetaInsights | null> => {
    try {
        const insightsData = await fetchFromMeta(`${objectId}/insights`, {
            fields: 'spend,clicks,inline_link_clicks,inline_link_click_ctr,impressions',
            date_preset: datePreset,
            level: level
        });

        if (insightsData.data && insightsData.data.length > 0) {
            return insightsData.data[0] as MetaInsights;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching insights for ${level} ${objectId}:`, error);
        return null;
    }
};
