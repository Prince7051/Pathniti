-- Populate quiz_questions table with sample questions
-- This script adds diverse questions for all assessment types

-- Clear existing questions (optional - remove if you want to keep existing data)
-- DELETE FROM quiz_questions;

-- Aptitude Questions
INSERT INTO quiz_questions (question_text, question_type, category, options, correct_answer, time_limit, scoring_weight) VALUES
-- Logical Reasoning
('If A is to the right of B, and C is to the left of B, then what is the arrangement?', 'aptitude', 'logical_reasoning', ARRAY['C-B-A', 'A-B-C', 'B-A-C', 'C-A-B'], 0, 60, 1.0),
('Complete the sequence: 2, 6, 12, 20, ?', 'aptitude', 'logical_reasoning', ARRAY['30', '32', '28', '34'], 0, 45, 1.0),
('If all roses are flowers and some flowers are red, which statement is true?', 'aptitude', 'logical_reasoning', ARRAY['All roses are red', 'Some roses are red', 'No roses are red', 'Cannot be determined'], 3, 60, 1.0),
('What comes next in the pattern: A, C, F, J, ?', 'aptitude', 'logical_reasoning', ARRAY['M', 'N', 'O', 'P'], 2, 45, 1.0),
('If 5 machines can produce 5 widgets in 5 minutes, how many machines are needed to produce 100 widgets in 100 minutes?', 'aptitude', 'logical_reasoning', ARRAY['5', '10', '20', '100'], 0, 90, 1.0),

-- Quantitative Skills
('What is 15% of 240?', 'aptitude', 'quantitative_skills', ARRAY['36', '32', '40', '38'], 0, 45, 1.0),
('If a train travels 120 km in 2 hours, what is its average speed?', 'aptitude', 'quantitative_skills', ARRAY['60 km/h', '50 km/h', '70 km/h', '80 km/h'], 0, 60, 1.0),
('Solve: 3x + 7 = 22', 'aptitude', 'quantitative_skills', ARRAY['x = 5', 'x = 4', 'x = 6', 'x = 3'], 0, 45, 1.0),
('What is the area of a circle with radius 7 cm? (Use π = 22/7)', 'aptitude', 'quantitative_skills', ARRAY['154 cm²', '44 cm²', '88 cm²', '22 cm²'], 0, 60, 1.0),
('If 2x + 3y = 12 and x - y = 1, what is the value of x?', 'aptitude', 'quantitative_skills', ARRAY['3', '2', '4', '5'], 0, 90, 1.0),

-- Language/Verbal Skills
('Choose the word that is most similar to "OCEAN":', 'aptitude', 'language_verbal_skills', ARRAY['Lake', 'Sea', 'River', 'Pond'], 1, 30, 1.0),
('What is the opposite of "BENEVOLENT"?', 'aptitude', 'language_verbal_skills', ARRAY['Kind', 'Malevolent', 'Generous', 'Charitable'], 1, 30, 1.0),
('Complete the analogy: Book is to Library as Car is to:', 'aptitude', 'language_verbal_skills', ARRAY['Road', 'Garage', 'Driver', 'Engine'], 1, 45, 1.0),
('Which word does not belong: Apple, Orange, Banana, Carrot', 'aptitude', 'language_verbal_skills', ARRAY['Apple', 'Orange', 'Banana', 'Carrot'], 3, 30, 1.0),
('What is the meaning of "EPHEMERAL"?', 'aptitude', 'language_verbal_skills', ARRAY['Lasting forever', 'Very short-lived', 'Extremely large', 'Completely silent'], 1, 45, 1.0),

-- Spatial/Visual Skills
('Which shape comes next in the sequence: Circle, Square, Triangle, Circle, ?', 'aptitude', 'spatial_visual_skills', ARRAY['Square', 'Triangle', 'Circle', 'Rectangle'], 0, 45, 1.0),
('If you fold a square piece of paper in half twice and cut a small triangle from the corner, how many holes will you have when unfolded?', 'aptitude', 'spatial_visual_skills', ARRAY['1', '2', '4', '8'], 2, 60, 1.0),
('Which cube can be made from the given net?', 'aptitude', 'spatial_visual_skills', ARRAY['Cube A', 'Cube B', 'Cube C', 'None of the above'], 0, 90, 1.0),
('If you rotate the letter "N" 180 degrees, what do you get?', 'aptitude', 'spatial_visual_skills', ARRAY['N', 'Z', 'M', 'W'], 0, 30, 1.0),
('How many triangles are in the given figure?', 'aptitude', 'spatial_visual_skills', ARRAY['8', '10', '12', '14'], 1, 60, 1.0),

-- Memory/Attention
('Remember these numbers: 7, 3, 9, 1, 5. What was the second number?', 'aptitude', 'memory_attention', ARRAY['7', '3', '9', '1'], 1, 30, 1.0),
('Which of these words appeared in the previous list: Apple, Banana, Orange, Grape?', 'aptitude', 'memory_attention', ARRAY['Apple', 'Banana', 'Orange', 'Grape'], 0, 45, 1.0),
('What was the color of the third object in the sequence: Red, Blue, Green, Yellow?', 'aptitude', 'memory_attention', ARRAY['Red', 'Blue', 'Green', 'Yellow'], 2, 30, 1.0);

-- RIASEC Interest Questions
INSERT INTO quiz_questions (question_text, question_type, category, options, time_limit, scoring_weight) VALUES
-- Realistic
('I enjoy working with tools and machinery', 'riasec_interest', 'realistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to build and fix things with my hands', 'riasec_interest', 'realistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I prefer outdoor activities over indoor ones', 'riasec_interest', 'realistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy working with plants and animals', 'riasec_interest', 'realistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to work with concrete, practical problems', 'riasec_interest', 'realistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),

-- Investigative
('I like to analyze data and solve complex problems', 'riasec_interest', 'investigative', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy conducting experiments and research', 'riasec_interest', 'investigative', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to work independently on challenging projects', 'riasec_interest', 'investigative', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy learning about scientific theories and concepts', 'riasec_interest', 'investigative', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to observe and study natural phenomena', 'riasec_interest', 'investigative', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),

-- Artistic
('I enjoy creative activities like drawing, writing, or music', 'riasec_interest', 'artistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to express myself through art or performance', 'riasec_interest', 'artistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy working in unstructured, creative environments', 'riasec_interest', 'artistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to create original works of art or literature', 'riasec_interest', 'artistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy interpreting and analyzing artistic works', 'riasec_interest', 'artistic', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),

-- Social
('I enjoy helping and working with people', 'riasec_interest', 'social', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to teach or mentor others', 'riasec_interest', 'social', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy working in teams and collaborating with others', 'riasec_interest', 'social', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to provide care and support to people in need', 'riasec_interest', 'social', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy organizing community events and activities', 'riasec_interest', 'social', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),

-- Enterprising
('I enjoy leading and managing people', 'riasec_interest', 'enterprising', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to start new projects and take initiative', 'riasec_interest', 'enterprising', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy selling products or ideas to others', 'riasec_interest', 'enterprising', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to take risks for potentially high rewards', 'riasec_interest', 'enterprising', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy working in competitive environments', 'riasec_interest', 'enterprising', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),

-- Conventional
('I enjoy organizing and maintaining detailed records', 'riasec_interest', 'conventional', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to work with numbers and data in structured ways', 'riasec_interest', 'conventional', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I prefer following established procedures and guidelines', 'riasec_interest', 'conventional', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I enjoy working in stable, predictable environments', 'riasec_interest', 'conventional', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0),
('I like to ensure accuracy and attention to detail', 'riasec_interest', 'conventional', ARRAY['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'], 30, 1.0);

-- Personality Questions
INSERT INTO quiz_questions (question_text, question_type, category, options, time_limit, scoring_weight) VALUES
-- Introvert vs Extrovert
('I prefer to work alone rather than in groups', 'personality', 'introvert_extrovert', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I feel energized after spending time with large groups of people', 'personality', 'introvert_extrovert', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy being the center of attention', 'personality', 'introvert_extrovert', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I need quiet time to recharge after social interactions', 'personality', 'introvert_extrovert', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I make friends easily and enjoy meeting new people', 'personality', 'introvert_extrovert', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- Structured vs Flexible
('I prefer to have a clear schedule and plan for my day', 'personality', 'structured_vs_flexible', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy spontaneous activities and last-minute changes', 'personality', 'structured_vs_flexible', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I like to have detailed instructions before starting a task', 'personality', 'structured_vs_flexible', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I prefer to improvise and adapt as I go', 'personality', 'structured_vs_flexible', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I feel comfortable with uncertainty and ambiguity', 'personality', 'structured_vs_flexible', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- Leadership vs Supportive
('I naturally take charge in group situations', 'personality', 'leadership_vs_supportive', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I prefer to support others rather than lead them', 'personality', 'leadership_vs_supportive', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy making decisions that affect others', 'personality', 'leadership_vs_supportive', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I like to help others achieve their goals', 'personality', 'leadership_vs_supportive', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I feel comfortable giving directions and instructions', 'personality', 'leadership_vs_supportive', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- Risk-taking vs Risk-averse
('I am willing to take risks for potentially high rewards', 'personality', 'risk_taking_vs_risk_averse', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I prefer safe, predictable outcomes over uncertain ones', 'personality', 'risk_taking_vs_risk_averse', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy trying new things even if they might fail', 'personality', 'risk_taking_vs_risk_averse', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I carefully consider all possible outcomes before making decisions', 'personality', 'risk_taking_vs_risk_averse', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I like to push boundaries and challenge the status quo', 'personality', 'risk_taking_vs_risk_averse', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0);

-- Subject Performance Questions
INSERT INTO quiz_questions (question_text, question_type, category, options, time_limit, scoring_weight) VALUES
-- Math
('I find mathematical concepts easy to understand', 'subject_performance', 'math', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy solving mathematical problems', 'subject_performance', 'math', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I can quickly perform mental calculations', 'subject_performance', 'math', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I struggle with abstract mathematical concepts', 'subject_performance', 'math', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I prefer subjects that involve numbers and calculations', 'subject_performance', 'math', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- English
('I enjoy reading and analyzing literature', 'subject_performance', 'english', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I find it easy to express my thoughts in writing', 'subject_performance', 'english', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I have a strong vocabulary and enjoy learning new words', 'subject_performance', 'english', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I struggle with grammar and sentence structure', 'subject_performance', 'english', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy creative writing and storytelling', 'subject_performance', 'english', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- Science
('I enjoy conducting experiments and scientific investigations', 'subject_performance', 'science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I find scientific theories and concepts fascinating', 'subject_performance', 'science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I can easily understand cause-and-effect relationships', 'subject_performance', 'science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I struggle with memorizing scientific facts and formulas', 'subject_performance', 'science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy learning about how things work in nature', 'subject_performance', 'science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),

-- Social Science
('I enjoy learning about history and historical events', 'subject_performance', 'social_science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I find geography and world cultures interesting', 'subject_performance', 'social_science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy analyzing social issues and current events', 'subject_performance', 'social_science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I struggle with remembering dates and historical facts', 'subject_performance', 'social_science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0),
('I enjoy understanding how societies and governments work', 'subject_performance', 'social_science', ARRAY['Strongly Agree', 'Agree', 'Neutral', 'Disagree', 'Strongly Disagree'], 30, 1.0);
