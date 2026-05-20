import dotenv from 'dotenv';
dotenv.config();

const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

async function fetchFromMeta(endpoint: string, params: Record<string, any> = {}) {
    const url = new URL(`${BASE_URL}/${endpoint}`);
    url.searchParams.append('access_token', ACCESS_TOKEN!);
    for (const [key, value] of Object.entries(params)) url.searchParams.append(key, value);
    const response = await fetch(url.toString());
    return await response.json();
}

async function main() {
    const accounts = [process.env.META_AD_ACCOUNT_ARG, process.env.META_AD_ACCOUNT_USA];
    for (const adAccountId of accounts) {
        console.log('Account: ' + adAccountId);
        const data = await fetchFromMeta(`act_${adAccountId}/campaigns`, { fields: 'id,name', limit: '1000' });
        const campaigns = data.data || [];
        const quemado = campaigns.find((c: any) => c.name.includes('QUEMADO'));
        console.log('Has QUEMADO campaign? ' + !!quemado);
        if (quemado) {
             const adsetsData = await fetchFromMeta(`act_${adAccountId}/adsets`, { fields: 'id,name', limit: '1000' });
             console.log('Total adsets in account: ' + (adsetsData.data || []).length);
        }
    }
}
main();
