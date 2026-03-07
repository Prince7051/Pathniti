#!/usr/bin/env node

/**
 * Script to check current timeline data in the database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTimelineData() {
  try {
    console.log('🔍 Checking current timeline data...');
    
    const { data, error } = await supabase
      .from('admission_deadlines')
      .select('*')
      .eq('is_active', true)
      .order('deadline_date');
    
    if (error) {
      console.error('❌ Error fetching timeline data:', error);
      return;
    }
    
    console.log(`📊 Found ${data.length} timeline events:`);
    console.log('');
    
    data.forEach((event, index) => {
      const today = new Date();
      const eventDate = new Date(event.deadline_date);
      const daysDiff = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
      
      let status = '';
      if (daysDiff < 0) {
        status = '🔴 OVERDUE';
      } else if (daysDiff === 0) {
        status = '🟡 TODAY';
      } else if (daysDiff <= 7) {
        status = '🟠 UPCOMING (within week)';
      } else {
        status = '🟢 FUTURE';
      }
      
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   📅 Date: ${event.deadline_date} (${daysDiff} days from now)`);
      console.log(`   🏷️  Type: ${event.deadline_type}`);
      console.log(`   📚 Stream: ${event.stream || 'N/A'}`);
      console.log(`   📊 Status: ${status}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check script
checkTimelineData();
