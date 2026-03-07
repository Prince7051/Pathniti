#!/usr/bin/env node

/**
 * Script to populate college profiles with sample content
 * This will add about sections, courses, and notices to existing colleges
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample content for different colleges
const collegeContent = {
  'all-india-institute-of-medical-sciences-delhi': {
    about: `All India Institute of Medical Sciences (AIIMS) Delhi is India's premier medical institution, established in 1956. It is an autonomous public medical college and hospital located in New Delhi, India. AIIMS Delhi is consistently ranked as the top medical college in India and is recognized globally for its excellence in medical education, research, and patient care.

The institute offers undergraduate, postgraduate, and doctoral programs in various medical and allied health sciences. With state-of-the-art facilities, world-class faculty, and a commitment to excellence, AIIMS Delhi has produced some of the finest medical professionals who have made significant contributions to healthcare both in India and abroad.

AIIMS Delhi is not just a medical college but a comprehensive healthcare ecosystem that includes specialized centers for various medical disciplines, cutting-edge research facilities, and a commitment to serving the community through quality healthcare services.`,
    courses: [
      {
        name: 'MBBS (Bachelor of Medicine and Bachelor of Surgery)',
        description: '5.5-year undergraduate medical program including 1 year of compulsory rotating internship',
        duration: '5.5 years',
        seats: 100,
        is_active: true
      },
      {
        name: 'B.Sc. Nursing',
        description: '4-year undergraduate nursing program with clinical training',
        duration: '4 years',
        seats: 60,
        is_active: true
      },
      {
        name: 'B.Sc. Medical Technology',
        description: '3-year program in various medical technology specializations',
        duration: '3 years',
        seats: 30,
        is_active: true
      }
    ],
    notices: [
      {
        title: 'MBBS 2024 Admission Notice',
        content: 'Applications for MBBS 2024-25 session are now open. Last date for submission is March 31, 2024.',
        type: 'admission',
        is_active: true,
        published_at: new Date().toISOString()
      },
      {
        title: 'AIIMS Delhi Research Symposium 2024',
        content: 'Annual research symposium will be held on April 15-16, 2024. Abstract submission deadline is March 20, 2024.',
        type: 'event',
        is_active: true,
        published_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        title: 'Library Services Update',
        content: 'Digital library services have been enhanced with new e-resources and 24/7 online access.',
        type: 'general',
        is_active: true,
        published_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  },
  'university-of-delhi': {
    about: `The University of Delhi, established in 1922, is one of India's premier universities and is known for its high standards in teaching and research. The university has grown into one of the largest universities in India with 16 faculties, 86 academic departments, 77 colleges, and 5 other institutes spread across the city.

Delhi University offers a wide range of undergraduate, postgraduate, and doctoral programs across various disciplines including Arts, Science, Commerce, Engineering, Law, Medicine, and Management. The university is known for its vibrant campus life, excellent faculty, and strong alumni network.

The university has been consistently ranked among the top universities in India and has produced numerous distinguished alumni who have excelled in various fields including politics, business, arts, and academia.`,
    courses: [
      {
        name: 'B.A. (Hons) English',
        description: '3-year undergraduate program in English Literature with focus on critical analysis and creative writing',
        duration: '3 years',
        seats: 120,
        is_active: true
      },
      {
        name: 'B.Sc. (Hons) Physics',
        description: '3-year undergraduate program in Physics with laboratory work and research projects',
        duration: '3 years',
        seats: 80,
        is_active: true
      },
      {
        name: 'B.Com. (Hons)',
        description: '3-year undergraduate program in Commerce with specialization in accounting and finance',
        duration: '3 years',
        seats: 100,
        is_active: true
      }
    ],
    notices: [
      {
        title: 'DU Admission 2024 Registration Open',
        content: 'Online registration for undergraduate programs 2024-25 is now open. Apply before May 31, 2024.',
        type: 'admission',
        is_active: true,
        published_at: new Date().toISOString()
      },
      {
        title: 'Cultural Festival 2024',
        content: 'Annual cultural festival "Antardhvani" will be held from March 20-25, 2024. Registration for events is open.',
        type: 'event',
        is_active: true,
        published_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ]
  }
};

async function populateCollegeContent() {
  try {
    console.log('Starting to populate college content...');

    // Get all colleges
    const { data: colleges, error: fetchError } = await supabase
      .from('colleges')
      .select('id, slug, name')
      .eq('is_active', true);

    if (fetchError) {
      console.error('Error fetching colleges:', fetchError);
      return;
    }

    console.log(`Found ${colleges.length} colleges`);

    for (const college of colleges) {
      const content = collegeContent[college.slug];
      
      if (!content) {
        console.log(`No content defined for ${college.name} (${college.slug})`);
        continue;
      }

      console.log(`Updating content for ${college.name}...`);

      // Update college with about content
      if (content.about) {
        const { error: updateError } = await supabase
          .from('colleges')
          .update({ 
            about: content.about,
            updated_at: new Date().toISOString()
          })
          .eq('id', college.id);

        if (updateError) {
          console.error(`Error updating about for ${college.name}:`, updateError);
        } else {
          console.log(`✓ Updated about section for ${college.name}`);
        }
      }

      // Add courses
      if (content.courses && content.courses.length > 0) {
        const coursesData = content.courses.map(course => ({
          college_id: college.id,
          name: course.name,
          description: course.description,
          duration: course.duration,
          seats: course.seats,
          is_active: course.is_active,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // First, delete existing courses for this college
        await supabase
          .from('college_courses')
          .delete()
          .eq('college_id', college.id);

        // Then insert new courses
        const { error: coursesError } = await supabase
          .from('college_courses')
          .insert(coursesData);

        if (coursesError) {
          console.error(`Error adding courses for ${college.name}:`, coursesError);
        } else {
          console.log(`✓ Added ${content.courses.length} courses for ${college.name}`);
        }
      }

      // Add notices
      if (content.notices && content.notices.length > 0) {
        const noticesData = content.notices.map(notice => ({
          college_id: college.id,
          title: notice.title,
          content: notice.content,
          type: notice.type,
          is_active: notice.is_active,
          published_at: notice.published_at,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        // First, delete existing notices for this college
        await supabase
          .from('college_notices')
          .delete()
          .eq('college_id', college.id);

        // Then insert new notices
        const { error: noticesError } = await supabase
          .from('college_notices')
          .insert(noticesData);

        if (noticesError) {
          console.error(`Error adding notices for ${college.name}:`, noticesError);
        } else {
          console.log(`✓ Added ${content.notices.length} notices for ${college.name}`);
        }
      }
    }

    console.log('✅ College content population completed successfully!');
  } catch (error) {
    console.error('Error populating college content:', error);
  }
}

// Run the script
populateCollegeContent();
