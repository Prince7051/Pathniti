#!/usr/bin/env node

/**
 * Populate Assessment Questions Script
 * This script populates the quiz_questions table with comprehensive assessment questions
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateQuestions() {
  try {
    console.log('🚀 Starting quiz questions population...');

    // Read the SQL file
    const sqlPath = join(__dirname, 'populate-questions.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    let successCount = 0;
    let errorCount = 0;

    for (const statement of statements) {
      try {
        if (statement.toLowerCase().includes('insert into quiz_questions')) {
          // Execute the INSERT statement
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`❌ Error executing statement: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
            console.log('✅ Successfully executed INSERT statement');
          }
        }
      } catch (err) {
        console.error(`❌ Error processing statement: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Population Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 All quiz questions populated successfully!');
    } else {
      console.log('\n⚠️  Some errors occurred during population.');
    }

    // Verify the data was inserted
    const { data: questions, error: countError } = await supabase
      .from('quiz_questions')
      .select('id, question_type, category')
      .limit(5);

    if (countError) {
      console.error('❌ Error verifying data:', countError.message);
    } else {
      console.log(`\n🔍 Sample questions inserted: ${questions.length}`);
      questions.forEach((q, index) => {
        console.log(`   ${index + 1}. ${q.question_type} - ${q.category}`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error during population:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Insert questions directly via API
async function populateQuestionsDirectly() {
  try {
    console.log('🚀 Starting direct quiz questions population...');

    // Sample questions data
    const questions = [
      // Aptitude Questions
      {
        question_text: "If A is to the right of B, and C is to the left of B, then what is the arrangement?",
        question_type: "aptitude",
        category: "logical_reasoning",
        options: ["C-B-A", "A-B-C", "B-A-C", "C-A-B"],
        correct_answer: 0,
        time_limit: 60,
        scoring_weight: 1.0
      },
      {
        question_text: "Complete the sequence: 2, 6, 12, 20, ?",
        question_type: "aptitude",
        category: "logical_reasoning",
        options: ["30", "32", "28", "34"],
        correct_answer: 0,
        time_limit: 45,
        scoring_weight: 1.0
      },
      {
        question_text: "What is 15% of 240?",
        question_type: "aptitude",
        category: "quantitative_skills",
        options: ["36", "32", "40", "38"],
        correct_answer: 0,
        time_limit: 45,
        scoring_weight: 1.0
      },
      // RIASEC Interest Questions
      {
        question_text: "I enjoy working with tools and machinery",
        question_type: "riasec_interest",
        category: "realistic",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      },
      {
        question_text: "I like to analyze data and solve complex problems",
        question_type: "riasec_interest",
        category: "investigative",
        options: ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      },
      // Personality Questions
      {
        question_text: "I prefer to work alone rather than in groups",
        question_type: "personality",
        category: "introvert_extrovert",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      },
      {
        question_text: "I prefer to have a clear schedule and plan for my day",
        question_type: "personality",
        category: "structured_vs_flexible",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      },
      // Subject Performance Questions
      {
        question_text: "I find mathematical concepts easy to understand",
        question_type: "subject_performance",
        category: "math",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      },
      {
        question_text: "I enjoy reading and analyzing literature",
        question_type: "subject_performance",
        category: "english",
        options: ["Strongly Agree", "Agree", "Neutral", "Disagree", "Strongly Disagree"],
        correct_answer: null,
        time_limit: 30,
        scoring_weight: 1.0
      }
    ];

    console.log(`📝 Inserting ${questions.length} sample questions...`);

    const { data, error } = await supabase
      .from('quiz_questions')
      .insert(questions)
      .select();

    if (error) {
      console.error('❌ Error inserting questions:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully inserted ${data.length} questions!`);

    // Verify the data
    const { data: allQuestions, error: countError } = await supabase
      .from('quiz_questions')
      .select('id, question_type, category')
      .limit(10);

    if (countError) {
      console.error('❌ Error verifying data:', countError.message);
    } else {
      console.log(`\n🔍 Total questions in database: ${allQuestions.length}`);
      console.log('\n📋 Question types breakdown:');
      const typeCount = {};
      allQuestions.forEach(q => {
        typeCount[q.question_type] = (typeCount[q.question_type] || 0) + 1;
      });
      Object.entries(typeCount).forEach(([type, count]) => {
        console.log(`   ${type}: ${count} questions`);
      });
    }

  } catch (error) {
    console.error('❌ Fatal error during population:', error.message);
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('🎯 Quiz Questions Population Script');
  console.log('=====================================\n');

  try {
    // First try direct insertion
    await populateQuestionsDirectly();
  } catch (error) {
    console.error('❌ Direct insertion failed, trying SQL approach...');
    await populateQuestions();
  }
}

// Run the script
main().catch(console.error);
