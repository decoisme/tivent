import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * GET /api/payment/xendit/test-db
 * Test database connection and permissions
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    tests: {},
  };

  try {
    // Test 1: Check if payments table exists
    console.log('[test-db] Testing table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);

    if (tableError) {
      results.tests.tableExists = {
        status: 'FAIL',
        error: tableError.message,
        code: tableError.code,
      };
    } else {
      results.tests.tableExists = {
        status: 'PASS',
        message: 'Table exists and is accessible',
        rowCount: tableData?.length || 0,
      };
    }

    // Test 2: Try to insert a test record
    console.log('[test-db] Testing insert...');
    const testData = {
      external_id: `TEST-${Date.now()}`,
      invoice_id: 'test-invoice-123',
      event_id: 1,
      ticket_type_id: 0,
      ticket_quantity: 1,
      buyer_email: 'test@example.com',
      buyer_address: null,
      amount_idr: 50000,
      amount_eth: 0.01,
      status: 'PENDING',
      invoice_url: 'https://test.com',
      expiry_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('payments')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      results.tests.insert = {
        status: 'FAIL',
        error: insertError.message,
        code: insertError.code,
        hint: insertError.hint,
        details: insertError.details,
      };
    } else {
      results.tests.insert = {
        status: 'PASS',
        message: 'Insert successful',
        insertedId: insertData?.id,
      };

      // Clean up test record
      await supabase
        .from('payments')
        .delete()
        .eq('id', insertData.id);
    }

    // Test 3: Test select by external_id
    console.log('[test-db] Testing select...');
    const { data: selectData, error: selectError } = await supabase
      .from('payments')
      .select('*')
      .eq('external_id', 'NONEXISTENT')
      .single();

    if (selectError && selectError.code === 'PGRST116') {
      // Not found is expected
      results.tests.select = {
        status: 'PASS',
        message: 'Select query works (no results is expected)',
      };
    } else if (selectError) {
      results.tests.select = {
        status: 'FAIL',
        error: selectError.message,
        code: selectError.code,
      };
    } else {
      results.tests.select = {
        status: 'PASS',
        message: 'Select query works',
        found: !!selectData,
      };
    }

    // Summary
    const allPassed = Object.values(results.tests).every(
      (test: any) => test.status === 'PASS'
    );

    results.summary = {
      allPassed,
      message: allPassed
        ? '✅ All database tests passed!'
        : '❌ Some tests failed. Check details above.',
    };

    return NextResponse.json(results, {
      status: allPassed ? 200 : 500,
    });
  } catch (error: any) {
    console.error('[test-db] Fatal error:', error);
    return NextResponse.json(
      {
        error: 'Fatal error during testing',
        message: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
