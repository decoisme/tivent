/**
 * Test Production Endpoints
 * 
 * Quick script to check if all payment endpoints are live in production
 */

const PRODUCTION_URL = process.env.VERCEL_URL 
  ? `https://${process.env.VERCEL_URL}` 
  : 'https://tivent.vercel.app'; // ← GANTI DENGAN URL VERCEL ANDA!
const TEST_EXTERNAL_ID = 'TIVENT-TEST-123';

async function testEndpoint(url, description) {
  console.log(`\n🔍 Testing: ${description}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url);
    const status = response.status;
    
    if (status === 404) {
      console.log(`   ❌ FAILED: 404 Not Found`);
      return false;
    } else if (status === 400) {
      console.log(`   ✅ OK: Endpoint exists (400 = expected validation error)`);
      return true;
    } else if (status === 200) {
      console.log(`   ✅ OK: 200 Success`);
      return true;
    } else {
      console.log(`   ⚠️  Unexpected status: ${status}`);
      return true; // Endpoint exists, just different response
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 Testing Tivent Production Endpoints');
  console.log('='.repeat(60));
  
  const endpoints = [
    {
      url: `${PRODUCTION_URL}/api/payment/xendit/create-invoice`,
      description: 'Create Invoice (POST endpoint, will return 405 on GET)'
    },
    {
      url: `${PRODUCTION_URL}/api/payment/xendit/status?externalId=${TEST_EXTERNAL_ID}`,
      description: 'Payment Status (GET endpoint)'
    },
    {
      url: `${PRODUCTION_URL}/api/payment/xendit/webhook?externalId=${TEST_EXTERNAL_ID}`,
      description: 'Webhook (GET fallback endpoint)'
    },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const success = await testEndpoint(endpoint.url, endpoint.description);
    results.push({ ...endpoint, success });
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Results Summary:');
  console.log('='.repeat(60));
  
  const allSuccess = results.every(r => r.success);
  
  results.forEach(r => {
    console.log(`${r.success ? '✅' : '❌'} ${r.description}`);
  });
  
  console.log('='.repeat(60));
  
  if (allSuccess) {
    console.log('✅ All endpoints are live in production!');
    console.log('\n📝 Next steps:');
    console.log('1. Make sure Supabase database migration is complete');
    console.log('2. Test payment flow on production URL');
    console.log('3. Check console logs during payment');
  } else {
    console.log('❌ Some endpoints are not found (404)');
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check Vercel deployment status (should be "Ready")');
    console.log('2. Check Vercel build logs for errors');
    console.log('3. Clear Vercel cache (Deployments → ... → Redeploy)');
    console.log('4. Verify files exist in GitHub repo');
  }
  
  console.log('\n');
}

main().catch(console.error);
