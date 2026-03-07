#!/usr/bin/env node

/**
 * Script to clean up duplicate timeline data and populate with fresh, diverse events
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

// Fresh, diverse timeline events data
const timelineEvents = [
  // 2024 Events (overdue)
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
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'National Merit Scholarship Application',
    description: 'Apply for National Merit Scholarship Scheme',
    deadline_date: '2024-03-15',
    deadline_type: 'application',
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Post Matric Scholarship Deadline',
    description: 'Last date for SC/ST Post Matric Scholarship applications',
    deadline_date: '2024-04-30',
    deadline_type: 'application',
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Class 12 Board Results',
    description: 'CBSE Class 12 board examination results declaration',
    deadline_date: '2024-05-13',
    deadline_type: 'result',
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Delhi University Admissions',
    description: 'Delhi University undergraduate admissions begin',
    deadline_date: '2024-05-15',
    deadline_type: 'counseling',
    stream: 'science',
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

  // 2025 Events (upcoming)
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
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Class 12 Board Results 2025',
    description: 'CBSE Class 12 board examination results declaration',
    deadline_date: '2025-05-13',
    deadline_type: 'result',
    stream: 'science',
    class_level: '12',
    is_active: true
  },
  {
    title: 'Delhi University Admissions 2025',
    description: 'Delhi University undergraduate admissions begin',
    deadline_date: '2025-05-15',
    deadline_type: 'counseling',
    stream: 'science',
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

  // Current/Recent Events (ongoing/upcoming)
  {
    title: 'Current Month Application',
    description: 'Sample application deadline for current month',
    deadline_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    deadline_type: 'application',
    stream: 'science',
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
    stream: 'science',
    class_level: '12',
    is_active: true
  },

  // Additional diverse events
  {
    title: 'BITSAT 2025 Registration',
    description: 'Birla Institute of Technology and Science admission test registration',
    deadline_date: '2025-03-15',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'VITEEE 2025 Application',
    description: 'VIT Engineering Entrance Examination application deadline',
    deadline_date: '2025-04-30',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'SRMJEE 2025 Registration',
    description: 'SRM Joint Engineering Entrance examination registration',
    deadline_date: '2025-05-15',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'COMEDK UGET 2025',
    description: 'Consortium of Medical, Engineering and Dental Colleges of Karnataka',
    deadline_date: '2025-06-01',
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'WBJEE 2025 Application',
    description: 'West Bengal Joint Entrance Examination application',
    deadline_date: '2025-02-28',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'MHT CET 2025 Registration',
    description: 'Maharashtra Common Entrance Test registration',
    deadline_date: '2025-03-31',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'KCET 2025 Application',
    description: 'Karnataka Common Entrance Test application deadline',
    deadline_date: '2025-04-15',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'TS EAMCET 2025',
    description: 'Telangana State Engineering, Agriculture and Medical Common Entrance Test',
    deadline_date: '2025-05-10',
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'AP EAMCET 2025',
    description: 'Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test',
    deadline_date: '2025-05-20',
    deadline_type: 'exam',
    stream: 'engineering',
    class_level: '12',
    is_active: true
  },
  {
    title: 'GATE 2025 Registration',
    description: 'Graduate Aptitude Test in Engineering registration',
    deadline_date: '2025-09-15',
    deadline_type: 'application',
    stream: 'engineering',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'CAT 2025 Registration',
    description: 'Common Admission Test for MBA programs',
    deadline_date: '2025-09-30',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'XAT 2025 Application',
    description: 'Xavier Aptitude Test for management programs',
    deadline_date: '2025-11-30',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'SNAP 2025 Registration',
    description: 'Symbiosis National Aptitude Test registration',
    deadline_date: '2025-12-10',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'NMAT 2025 Application',
    description: 'NMIMS Management Aptitude Test application',
    deadline_date: '2025-10-15',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'IIFT 2025 Registration',
    description: 'Indian Institute of Foreign Trade entrance exam registration',
    deadline_date: '2025-09-20',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'MAT 2025 Application',
    description: 'Management Aptitude Test application',
    deadline_date: '2025-08-31',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'CMAT 2025 Registration',
    description: 'Common Management Admission Test registration',
    deadline_date: '2025-03-31',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  },
  {
    title: 'ATMA 2025 Application',
    description: 'AIMS Test for Management Admissions application',
    deadline_date: '2025-06-15',
    deadline_type: 'application',
    stream: 'science',
    class_level: 'postgraduate',
    is_active: true
  }
];

async function cleanupAndPopulateTimelineData() {
  try {
    console.log('🧹 Starting timeline data cleanup and population...');
    
    // First, delete all existing timeline data
    console.log('🗑️  Clearing existing timeline data...');
    const { error: deleteError } = await supabase
      .from('admission_deadlines')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (deleteError) {
      console.error('❌ Error clearing existing data:', deleteError);
      return;
    }
    
    console.log('✅ Existing data cleared successfully');
    
    // Insert the fresh timeline events
    console.log(`📝 Inserting ${timelineEvents.length} fresh timeline events...`);
    
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
      
      console.log(`${index + 1}. ${event.title} (${event.deadline_date}) - ${status}`);
    });
    
    console.log('\n🎉 Timeline data cleanup and population complete!');
    console.log('💡 You can now visit the timeline page to see the fresh, diverse data.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup and population script
cleanupAndPopulateTimelineData();
