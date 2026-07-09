const url = 'https://ykzdknkvpbnpxxychzmj.supabase.co/rest/v1';
const key = 'sb_publishable_r3JiEgvQRBxo0qNExXbkPw_cpKBKFZp';

async function fixTenants() {
  try {
    // 1. Get buro-panama tenant ID
    const tRes = await fetch(`${url}/tenants?slug=eq.buro-panama`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const tenants = await tRes.json();
    if (!tenants || tenants.length === 0) {
      console.log('No tenant found for buro-panama');
      return;
    }
    const tenantId = tenants[0].id;
    console.log(`Buro Panama Tenant ID: ${tenantId}`);

    // 2. Update profiles where tenant_id is null
    const pRes = await fetch(`${url}/profiles?tenant_id=is.null`, {
      method: 'PATCH',
      headers: { 
        'apikey': key, 
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ tenant_id: tenantId })
    });
    
    const updated = await pRes.json();
    console.log(`Updated ${updated.length} profiles to tenant ${tenantId}`);

  } catch (err) {
    console.error(err);
  }
}

fixTenants();
