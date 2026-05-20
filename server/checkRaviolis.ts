import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
    for (const act of [process.env.META_AD_ACCOUNT_ARG, process.env.META_AD_ACCOUNT_USA]) {
        if (!act) continue;
        const res = await fetch(`https://graph.facebook.com/v19.0/act_${act}/campaigns?access_token=${ACCESS_TOKEN}&fields=name&limit=1000`);
        const data = await res.json();
        const campaigns = data.data || [];
        const raviolis = campaigns.filter((c: any) => c.name.toLowerCase().includes('ravio'));
        console.log(`Account ${act} Raviolis campaigns:`, raviolis);
    }
}
main();
