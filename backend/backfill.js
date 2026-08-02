import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backfill() {
  console.log('Starting backfill...');
  
  // Get all approved industries
  const { data: setups, error: setupError } = await supabase
    .from('setups')
    .select('*, users(email)');
    
  if (setupError) {
    console.error('Error fetching setups:', setupError);
    return;
  }
  
  console.log(`Found ${setups.length} setups to process.`);
  
  for (const setup of setups) {
    const email = setup.users?.email;
    const industryName = setup.plantname || 'Unnamed Industry';
    
    if (!email) {
      console.log(`Skipping setup ${setup._id} because it has no email`);
      continue;
    }
    
    // Check if it already exists
    const { data: existing } = await supabase
      .from('industry_management')
      .select('email_id')
      .eq('email_id', email)
      .single();
      
    if (existing) {
      console.log(`Skipping ${email}, already exists in industry_management.`);
      continue;
    }
    
    // Insert dummy record
    const { error: insertError } = await supabase
      .from('industry_management')
      .insert({
        industry_name: industryName,
        email_id: email,
        password: 'Reset123!'
      });
      
    if (insertError) {
      console.error(`Failed to insert ${email}:`, insertError.message);
    } else {
      console.log(`Successfully backfilled ${email}`);
    }
  }
  
  console.log('Backfill complete!');
}

backfill();
