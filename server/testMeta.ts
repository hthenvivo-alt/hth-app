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
    const adAccountId = process.env.META_AD_ACCOUNT_ARG;
    const data = await fetchFromMeta(`act_${adAccountId}/adsets`, { fields: 'id,name,status,effective_status,campaign_id', limit: '1000' });
    const adsets = data.data || [];
    console.log('Total adsets fetched: ' + adsets.length);
    const laplata = adsets.find((a: any) => a.name.includes('LA PLATA'));
    console.log('Found LA PLATA adset in account-level fetch? ' + !!laplata);
    if (laplata) console.log(laplata);
    console.log(data.paging ? 'Has paging' : 'No paging');
    
    if (data.paging) {
      console.log('Cursors:', data.paging.cursors);
    }
}
main();
