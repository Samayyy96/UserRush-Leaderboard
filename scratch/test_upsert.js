const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testUpsert() {
  const { data, error } = await supabase
    .from('projects')
    .upsert({ 
      roll_no: 'TEST_ID_123', 
      is_approved: true 
    }, { onConflict: 'roll_no' });

  if (error) {
    console.error('UPSERT ERROR:', JSON.stringify(error, null, 2));
  } else {
    console.log('UPSERT SUCCESS:', data);
  }
  process.exit();
}

testUpsert();
