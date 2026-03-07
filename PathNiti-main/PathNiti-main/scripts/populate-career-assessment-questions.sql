-- Populate additional questions for Career Assessment System
-- These questions are specifically designed for the 30-question career assessment

-- Science Aptitude Questions (mapped to quantitative_skills and logical_reasoning)
INSERT INTO public.quiz_questions (question_text, question_type, category, subcategory, options, correct_answer, time_limit, scoring_weight, difficulty_level, is_active) VALUES
-- Math/Science Questions
('What is the chemical symbol for Gold?', 'aptitude', 'quantitative_skills', 'chemistry_basics', '["Au", "Ag", "Go", "Gd"]', 0, 30, 1.0, 1, true),
('Which gas makes up most of Earth''s atmosphere?', 'aptitude', 'quantitative_skills', 'environmental_science', '["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"]', 1, 30, 1.0, 1, true),
('What is the speed of light in vacuum?', 'aptitude', 'quantitative_skills', 'physics_basics', '["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10¹⁰ m/s", "3 × 10⁴ m/s"]', 0, 45, 1.5, 2, true),
('Which organelle is known as the powerhouse of the cell?', 'aptitude', 'quantitative_skills', 'biology_basics', '["Nucleus", "Mitochondria", "Ribosome", "Chloroplast"]', 1, 30, 1.0, 1, true),
('What is the pH of pure water?', 'aptitude', 'quantitative_skills', 'chemistry_basics', '["6", "7", "8", "9"]', 1, 30, 1.0, 1, true),
('Which force keeps planets in orbit around the sun?', 'aptitude', 'quantitative_skills', 'physics_basics', '["Magnetic force", "Gravitational force", "Electric force", "Nuclear force"]', 1, 30, 1.0, 1, true),
('What is the process by which plants make their food?', 'aptitude', 'quantitative_skills', 'biology_basics', '["Respiration", "Photosynthesis", "Digestion", "Fermentation"]', 1, 30, 1.0, 1, true),
('Which element has the atomic number 1?', 'aptitude', 'quantitative_skills', 'chemistry_basics', '["Helium", "Hydrogen", "Lithium", "Carbon"]', 1, 30, 1.0, 1, true),

-- Math Aptitude Questions
('What is 15% of 200?', 'aptitude', 'quantitative_skills', 'percentage', '["25", "30", "35", "40"]', 1, 45, 1.0, 1, true),
('If x + 5 = 12, what is the value of x?', 'aptitude', 'quantitative_skills', 'algebra', '["6", "7", "8", "9"]', 1, 45, 1.0, 1, true),
('What is the area of a circle with radius 7 cm? (π = 22/7)', 'aptitude', 'quantitative_skills', 'geometry', '["154 cm²", "44 cm²", "88 cm²", "22 cm²"]', 0, 60, 1.5, 2, true),
('What is the next number in the sequence: 2, 4, 8, 16, ?', 'aptitude', 'quantitative_skills', 'number_sequences', '["24", "32", "20", "28"]', 1, 45, 1.0, 1, true),
('If a train travels 120 km in 2 hours, what is its speed?', 'aptitude', 'quantitative_skills', 'word_problems', '["50 km/h", "60 km/h", "70 km/h", "80 km/h"]', 1, 60, 1.0, 1, true),
('What is the value of 3² + 4²?', 'aptitude', 'quantitative_skills', 'arithmetic', '["25", "49", "7", "12"]', 0, 30, 1.0, 1, true),
('If the ratio of boys to girls in a class is 3:2 and there are 30 students, how many boys are there?', 'aptitude', 'quantitative_skills', 'ratio_proportion', '["12", "15", "18", "20"]', 2, 60, 1.5, 2, true),
('What is the square root of 144?', 'aptitude', 'quantitative_skills', 'arithmetic', '["11", "12", "13", "14"]', 1, 30, 1.0, 1, true),

-- Logical Reasoning Questions
('If all roses are flowers and some flowers are red, which statement is definitely true?', 'aptitude', 'logical_reasoning', 'logical_deduction', '["All roses are red", "Some roses are red", "All red things are roses", "Some red things are flowers"]', 3, 60, 1.5, 2, true),
('Complete the pattern: A, C, E, G, ?', 'aptitude', 'logical_reasoning', 'pattern_recognition', '["H", "I", "J", "K"]', 1, 45, 1.0, 1, true),
('If Monday is the 1st, what day of the week is the 15th?', 'aptitude', 'logical_reasoning', 'calendar_reasoning', '["Monday", "Tuesday", "Wednesday", "Thursday"]', 0, 60, 1.0, 1, true),
('Which word does not belong: Apple, Orange, Banana, Carrot?', 'aptitude', 'logical_reasoning', 'classification', '["Apple", "Orange", "Banana", "Carrot"]', 3, 30, 1.0, 1, true),
('If PENCIL is coded as 123456, how is PEN coded?', 'aptitude', 'logical_reasoning', 'coding_decoding', '["123", "124", "125", "126"]', 0, 60, 1.5, 2, true),
('What comes next: 1, 1, 2, 3, 5, 8, ?', 'aptitude', 'logical_reasoning', 'number_sequences', '["11", "12", "13", "14"]', 2, 60, 1.5, 2, true),
('If you''re facing north and turn 90 degrees clockwise, which direction are you facing?', 'aptitude', 'logical_reasoning', 'direction_sense', '["North", "South", "East", "West"]', 2, 30, 1.0, 1, true),

-- General Knowledge Questions (mapped to language_verbal_skills and memory_attention)
('Who is known as the ''Father of the Nation'' in India?', 'aptitude', 'language_verbal_skills', 'indian_history', '["Jawaharlal Nehru", "Mahatma Gandhi", "Subhash Chandra Bose", "Bhagat Singh"]', 1, 30, 1.0, 1, true),
('What is the capital of Australia?', 'aptitude', 'language_verbal_skills', 'world_geography', '["Sydney", "Melbourne", "Canberra", "Perth"]', 2, 30, 1.0, 1, true),
('Which is the largest planet in our solar system?', 'aptitude', 'language_verbal_skills', 'astronomy', '["Earth", "Saturn", "Jupiter", "Neptune"]', 2, 30, 1.0, 1, true),
('Who wrote the book ''Wings of Fire''?', 'aptitude', 'language_verbal_skills', 'literature', '["A.P.J. Abdul Kalam", "R.K. Narayan", "Ruskin Bond", "Chetan Bhagat"]', 0, 45, 1.0, 1, true),
('What is the currency of Japan?', 'aptitude', 'language_verbal_skills', 'world_economics', '["Won", "Yuan", "Yen", "Dong"]', 2, 30, 1.0, 1, true),
('Which sport is associated with Wimbledon?', 'aptitude', 'language_verbal_skills', 'sports', '["Football", "Tennis", "Cricket", "Badminton"]', 1, 30, 1.0, 1, true),
('What is the full form of NASA?', 'aptitude', 'language_verbal_skills', 'science_technology', '["National Aeronautics and Space Administration", "National Aerospace and Space Agency", "National Aeronautics and Space Agency", "National Aerospace and Space Administration"]', 0, 45, 1.0, 1, true);

-- Update the count
SELECT COUNT(*) as total_questions FROM public.quiz_questions WHERE question_type = 'aptitude' AND is_active = true;
