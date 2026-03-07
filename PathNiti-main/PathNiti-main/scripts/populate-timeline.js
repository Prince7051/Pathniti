#!/usr/bin/env node

/**
 * Script to populate admission_deadlines table with sample data
 * This script uses the Supabase client to insert timeline events
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sample timeline events data
const timelineEvents = [
  // 2024 Events (should show as overdue)
  {
    title: 'NEET 2024 Application Deadline',
    description: 'Last date to submit NEET 2024 application forms',
    deadline_date: '2024-01-15',
    deadline_type: 'application',
    stream: 'medical',
    class_level: '12',
    is_active: true
  },
  {
    title: 'CUET 2024 Registration',
    description: 'Common University Entrance Test registration opens',
    deadline_date: '2024-02-01',
    deadline_type: 'exam',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'National Merit Scholarship Application',
    description: 'Apply for National Merit Scholarship Scheme',
    deadline_date: '2024-03-15',
    deadline_type: 'application',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Post Matric Scholarship Deadline',
    description: 'Last date for SC/ST Post Matric Scholarship applications',
    deadline_date: '2024-04-30',
    deadline_type: 'application',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Class 12 Board Results',
    description: 'CBSE Class 12 board examination results declaration',
    deadline_date: '2024-05-13',
    deadline_type: 'result',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Delhi University Admissions',
    description: 'Delhi University undergraduate admissions begin',
    deadline_date: '2024-05-15',
    deadline_type: 'counseling',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'AIIMS MBBS Entrance Exam',
    description: 'All India Institute of Medical Sciences entrance exam',
    deadline_date: '2024-05-26',
    deadline_type: 'exam',
    stream: 'medical',
    class_level: '12',
    is_active: true
  },
  {
    title: 'IIT JEE Advanced 2024',
    description: 'JEE Advanced examination for IIT admissions',
    deadline_date: '2024-06-02',
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'NIT Admissions Counseling',
    description: 'National Institute of Technology counseling begins',
    deadline_date: '2024-07-01',
    deadline_type: 'counseling',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },

  // 2025 Events (should show as upcoming)
  {
    title: 'JEE Main 2025 Registration',
    description: 'Registration for JEE Main 2025 examination begins',
    deadline_date: '2025-12-15',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'NEET 2025 Application Deadline',
    description: 'Last date to submit NEET 2025 application forms',
    deadline_date: '2025-01-15',
    deadline_type: 'application',
    stream: 'medical',
    class_level: '12',
    is_active: true
  },
  {
    title: 'CUET 2025 Registration',
    description: 'Common University Entrance Test registration opens',
    deadline_date: '2025-02-01',
    deadline_type: 'exam',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Class 12 Board Results 2025',
    description: 'CBSE Class 12 board examination results declaration',
    deadline_date: '2025-05-13',
    deadline_type: 'result',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Delhi University Admissions 2025',
    description: 'Delhi University undergraduate admissions begin',
    deadline_date: '2025-05-15',
    deadline_type: 'counseling',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'AIIMS MBBS Entrance Exam 2025',
    description: 'All India Institute of Medical Sciences entrance exam',
    deadline_date: '2025-05-26',
    deadline_type: 'exam',
    stream: 'medical',
    class_level: '12',
    is_active: true
  },
  {
    title: 'IIT JEE Advanced 2025',
    description: 'JEE Advanced examination for IIT admissions',
    deadline_date: '2025-06-02',
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'NIT Admissions Counseling 2025',
    description: 'National Institute of Technology counseling begins',
    deadline_date: '2025-07-01',
    deadline_type: 'counseling',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },

  // Current/Recent Events (should show as ongoing or upcoming)
  {
    title: 'Current Month Application',
    description: 'Sample application deadline for current month',
    deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    deadline_type: 'application',
    stream: 'general',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Next Week Exam',
    description: 'Sample exam happening next week',
    deadline_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Today Event',
    description: 'Sample event happening today',
    deadline_date: new Date().toISOString().split('T')[0], // Today
    deadline_type: 'result',
    stream: 'general',
    class_level: '12',
    is_active: true
  }
];

async function populateTimelineData() {
  try {
    console.log('🚀 Starting timeline data population...');
    
    // First, let's check if there are existing records
    const { data: existingData, error: fetchError } = await supabase
      .from('admission_deadlines')
      .select('id')
      .limit(1);
    
    if (fetchError) {
      console.error('❌ Error checking existing data:', fetchError);
      return;
    }
    
    if (existingData && existingData.length > 0) {
      console.log('⚠️  Found existing timeline data. Skipping population to avoid duplicates.');
      console.log('💡 If you want to add new data, please clear the existing data first or modify this script.');
      return;
    }
    
    // Insert the timeline events
    console.log(`📝 Inserting ${timelineEvents.length} timeline events...`);
    
    const { data, error } = await supabase
      .from('admission_deadlines')
      .insert(timelineEvents)
      .select();
    
    if (error) {
      console.error('❌ Error inserting timeline data:', error);
      return;
    }
    
    console.log('✅ Successfully populated timeline data!');
    console.log(`📊 Inserted ${data.length} events`);
    
    // Show a summary of what was inserted
    console.log('\n📋 Summary of inserted events:');
    data.forEach((event, index) => {
      const status = new Date(event.deadline_date) < new Date() ? 'OVERDUE' : 'UPCOMING';
      console.log(`${index + 1}. ${event.title} (${event.deadline_date}) - ${status}`);
    });
    
    console.log('\n🎉 Timeline data population complete!');
    console.log('💡 You can now visit the timeline page to see the populated data.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the population script
populateTimelineData();
