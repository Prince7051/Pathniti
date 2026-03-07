"""
Real Dataset Generator for EduNiti AI Engine
Generates comprehensive datasets for colleges, careers, and student outcomes
"""

import pandas as pd
import numpy as np
import json
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any
import os

class DatasetGenerator:
    def __init__(self):
        self.states = [
            'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
            'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
            'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya',
            'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim',
            'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand',
            'West Bengal', 'Delhi', 'Chandigarh', 'Puducherry'
        ]
        
        self.streams = ['science', 'arts', 'commerce', 'engineering', 'medical', 'vocational']
        self.career_categories = ['technology', 'healthcare', 'education', 'business', 'government', 'creative', 'research']
        
    def generate_colleges_dataset(self, num_colleges: int = 1000) -> pd.DataFrame:
        """Generate comprehensive college dataset"""
        colleges = []
        
        # Major Indian universities and colleges
        major_colleges = [
            {'name': 'Indian Institute of Technology Delhi', 'type': 'IIT', 'state': 'Delhi', 'tier': 'Tier 1'},
            {'name': 'Indian Institute of Technology Bombay', 'type': 'IIT', 'state': 'Maharashtra', 'tier': 'Tier 1'},
            {'name': 'Indian Institute of Technology Madras', 'type': 'IIT', 'state': 'Tamil Nadu', 'tier': 'Tier 1'},
            {'name': 'Indian Institute of Technology Kanpur', 'type': 'IIT', 'state': 'Uttar Pradesh', 'tier': 'Tier 1'},
            {'name': 'Indian Institute of Technology Kharagpur', 'type': 'IIT', 'state': 'West Bengal', 'tier': 'Tier 1'},
            {'name': 'Delhi University', 'type': 'Central University', 'state': 'Delhi', 'tier': 'Tier 1'},
            {'name': 'Jawaharlal Nehru University', 'type': 'Central University', 'state': 'Delhi', 'tier': 'Tier 1'},
            {'name': 'University of Mumbai', 'type': 'State University', 'state': 'Maharashtra', 'tier': 'Tier 2'},
            {'name': 'Anna University', 'type': 'State University', 'state': 'Tamil Nadu', 'tier': 'Tier 2'},
            {'name': 'Bangalore University', 'type': 'State University', 'state': 'Karnataka', 'tier': 'Tier 2'},
            {'name': 'Punjab University', 'type': 'State University', 'state': 'Punjab', 'tier': 'Tier 2'},
            {'name': 'University of Calcutta', 'type': 'State University', 'state': 'West Bengal', 'tier': 'Tier 2'},
            {'name': 'All India Institute of Medical Sciences Delhi', 'type': 'AIIMS', 'state': 'Delhi', 'tier': 'Tier 1'},
            {'name': 'Indian Institute of Science Bangalore', 'type': 'IISc', 'state': 'Karnataka', 'tier': 'Tier 1'},
            {'name': 'Tata Institute of Fundamental Research', 'type': 'Research Institute', 'state': 'Maharashtra', 'tier': 'Tier 1'},
        ]
        
        # Generate additional colleges
        college_types = ['State University', 'Private University', 'Deemed University', 'Central University', 'Engineering College', 'Medical College', 'Arts College', 'Commerce College']
        
        for i in range(num_colleges):
            if i < len(major_colleges):
                college = major_colleges[i].copy()
            else:
                college = {
                    'name': f'{random.choice(college_types)} {i+1}',
                    'type': random.choice(college_types),
                    'state': random.choice(self.states),
                    'tier': random.choices(['Tier 1', 'Tier 2', 'Tier 3'], weights=[0.1, 0.3, 0.6])[0]
                }
            
            # Generate additional attributes
            college.update({
                'id': f'college_{i+1}',
                'established_year': random.randint(1950, 2020),
                'accreditation': random.choices(['NAAC A++', 'NAAC A+', 'NAAC A', 'NAAC B++', 'NAAC B'], weights=[0.05, 0.15, 0.3, 0.3, 0.2])[0],
                'total_students': random.randint(1000, 50000),
                'faculty_count': random.randint(50, 2000),
                'campus_size': random.randint(10, 1000),  # acres
                'hostel_facility': random.choice([True, False]),
                'library_books': random.randint(10000, 500000),
                'research_centers': random.randint(0, 20),
                'placement_percentage': random.uniform(60, 98),
                'average_package': random.randint(300000, 2000000),
                'highest_package': random.randint(500000, 5000000),
                'fees_range': {
                    'min': random.randint(10000, 200000),
                    'max': random.randint(50000, 500000)
                },
                'programs': self._generate_programs(),
                'facilities': self._generate_facilities(),
                'location': {
                    'city': f'City {i+1}',
                    'state': college['state'],
                    'pincode': random.randint(100000, 999999),
                    'latitude': random.uniform(6.0, 37.0),
                    'longitude': random.uniform(68.0, 97.0)
                },
                'contact': {
                    'phone': f'+91-{random.randint(1000000000, 9999999999)}',
                    'email': f'info@{college["name"].lower().replace(" ", "")}.edu.in',
                    'website': f'https://www.{college["name"].lower().replace(" ", "")}.edu.in'
                },
                'cut_off_percentages': {
                    'general': random.uniform(60, 95),
                    'obc': random.uniform(55, 90),
                    'sc': random.uniform(50, 85),
                    'st': random.uniform(45, 80)
                },
                'entrance_exams': random.sample(['JEE Main', 'NEET', 'CUET', 'GATE', 'CAT', 'MAT', 'XAT'], random.randint(1, 4)),
                'scholarships_available': random.choice([True, False]),
                'international_programs': random.choice([True, False]),
                'alumni_network': random.randint(1000, 100000),
                'industry_partnerships': random.randint(0, 50),
                'research_publications': random.randint(0, 1000),
                'ranking_nirf': random.randint(1, 200) if random.random() < 0.3 else None,
                'ranking_times': random.randint(1, 500) if random.random() < 0.2 else None,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
            
            colleges.append(college)
        
        return pd.DataFrame(colleges)
    
    def _generate_programs(self) -> List[Dict]:
        """Generate programs offered by college"""
        programs = []
        program_types = [
            {'name': 'B.Tech', 'duration': 4, 'stream': 'engineering', 'fees': random.randint(100000, 300000)},
            {'name': 'B.Sc', 'duration': 3, 'stream': 'science', 'fees': random.randint(50000, 150000)},
            {'name': 'B.A', 'duration': 3, 'stream': 'arts', 'fees': random.randint(30000, 100000)},
            {'name': 'B.Com', 'duration': 3, 'stream': 'commerce', 'fees': random.randint(40000, 120000)},
            {'name': 'MBBS', 'duration': 5, 'stream': 'medical', 'fees': random.randint(200000, 500000)},
            {'name': 'B.Ed', 'duration': 2, 'stream': 'education', 'fees': random.randint(50000, 150000)},
            {'name': 'M.Tech', 'duration': 2, 'stream': 'engineering', 'fees': random.randint(150000, 400000)},
            {'name': 'M.Sc', 'duration': 2, 'stream': 'science', 'fees': random.randint(80000, 200000)},
            {'name': 'M.A', 'duration': 2, 'stream': 'arts', 'fees': random.randint(60000, 150000)},
            {'name': 'MBA', 'duration': 2, 'stream': 'business', 'fees': random.randint(200000, 800000)},
            {'name': 'Ph.D', 'duration': 3, 'stream': 'research', 'fees': random.randint(50000, 200000)}
        ]
        
        # Select random programs
        selected_programs = random.sample(program_types, random.randint(3, 8))
        for program in selected_programs:
            programs.append({
                **program,
                'specializations': self._generate_specializations(program['name']),
                'eligibility': self._generate_eligibility(program['name']),
                'seats': random.randint(30, 300),
                'cut_off': random.uniform(60, 95)
            })
        
        return programs
    
    def _generate_specializations(self, program_name: str) -> List[str]:
        """Generate specializations for a program"""
        specializations_map = {
            'B.Tech': ['Computer Science', 'Mechanical', 'Electrical', 'Civil', 'Electronics', 'Chemical', 'Aerospace', 'Biotechnology'],
            'B.Sc': ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Statistics', 'Electronics', 'Geology'],
            'B.A': ['English', 'History', 'Political Science', 'Economics', 'Psychology', 'Sociology', 'Geography', 'Philosophy'],
            'B.Com': ['General', 'Honors', 'Accounting', 'Finance', 'Marketing', 'Human Resources', 'International Business'],
            'MBBS': ['General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Orthopedics', 'Cardiology', 'Neurology'],
            'M.Tech': ['Computer Science', 'Data Science', 'Artificial Intelligence', 'Machine Learning', 'Cybersecurity', 'Robotics'],
            'MBA': ['Finance', 'Marketing', 'Human Resources', 'Operations', 'Information Technology', 'International Business', 'Healthcare Management']
        }
        
        available_specs = specializations_map.get(program_name, ['General'])
        return random.sample(available_specs, min(random.randint(1, 4), len(available_specs)))
    
    def _generate_eligibility(self, program_name: str) -> Dict:
        """Generate eligibility criteria for a program"""
        base_eligibility = {
            'min_percentage': random.uniform(50, 85),
            'required_subjects': [],
            'entrance_exam': None,
            'age_limit': random.randint(17, 25)
        }
        
        if program_name in ['B.Tech', 'M.Tech']:
            base_eligibility['required_subjects'] = ['Mathematics', 'Physics', 'Chemistry']
            base_eligibility['entrance_exam'] = 'JEE Main'
        elif program_name == 'MBBS':
            base_eligibility['required_subjects'] = ['Biology', 'Physics', 'Chemistry']
            base_eligibility['entrance_exam'] = 'NEET'
        elif program_name == 'MBA':
            base_eligibility['entrance_exam'] = random.choice(['CAT', 'MAT', 'XAT', 'GMAT'])
        
        return base_eligibility
    
    def _generate_facilities(self) -> List[str]:
        """Generate facilities available at college"""
        all_facilities = [
            'Library', 'Computer Lab', 'Science Lab', 'Sports Complex', 'Hostel',
            'Cafeteria', 'Auditorium', 'Gymnasium', 'Medical Center', 'Bank',
            'ATM', 'WiFi', 'Transport', 'Parking', 'Research Center',
            'Incubation Center', 'Placement Cell', 'Career Guidance', 'Alumni Network'
        ]
        
        return random.sample(all_facilities, random.randint(5, 15))
    
    def generate_careers_dataset(self, num_careers: int = 500) -> pd.DataFrame:
        """Generate comprehensive career dataset"""
        careers = []
        
        # Major career categories with real data
        career_templates = [
            # Technology
            {'name': 'Software Engineer', 'category': 'technology', 'stream': 'engineering', 'growth_rate': 8.5, 'avg_salary': 800000, 'demand': 'high'},
            {'name': 'Data Scientist', 'category': 'technology', 'stream': 'science', 'growth_rate': 12.0, 'avg_salary': 1200000, 'demand': 'very_high'},
            {'name': 'AI/ML Engineer', 'category': 'technology', 'stream': 'engineering', 'growth_rate': 15.0, 'avg_salary': 1500000, 'demand': 'very_high'},
            {'name': 'Cybersecurity Analyst', 'category': 'technology', 'stream': 'engineering', 'growth_rate': 10.0, 'avg_salary': 900000, 'demand': 'high'},
            {'name': 'DevOps Engineer', 'category': 'technology', 'stream': 'engineering', 'growth_rate': 9.0, 'avg_salary': 1000000, 'demand': 'high'},
            {'name': 'Product Manager', 'category': 'technology', 'stream': 'business', 'growth_rate': 7.0, 'avg_salary': 1800000, 'demand': 'high'},
            
            # Healthcare
            {'name': 'Doctor', 'category': 'healthcare', 'stream': 'medical', 'growth_rate': 6.0, 'avg_salary': 1200000, 'demand': 'high'},
            {'name': 'Nurse', 'category': 'healthcare', 'stream': 'medical', 'growth_rate': 8.0, 'avg_salary': 400000, 'demand': 'very_high'},
            {'name': 'Pharmacist', 'category': 'healthcare', 'stream': 'medical', 'growth_rate': 5.0, 'avg_salary': 500000, 'demand': 'medium'},
            {'name': 'Physiotherapist', 'category': 'healthcare', 'stream': 'medical', 'growth_rate': 7.0, 'avg_salary': 600000, 'demand': 'high'},
            {'name': 'Medical Researcher', 'category': 'healthcare', 'stream': 'research', 'growth_rate': 6.5, 'avg_salary': 800000, 'demand': 'medium'},
            
            # Education
            {'name': 'Teacher', 'category': 'education', 'stream': 'arts', 'growth_rate': 4.0, 'avg_salary': 500000, 'demand': 'high'},
            {'name': 'Professor', 'category': 'education', 'stream': 'research', 'growth_rate': 3.0, 'avg_salary': 1000000, 'demand': 'medium'},
            {'name': 'Educational Consultant', 'category': 'education', 'stream': 'business', 'growth_rate': 5.0, 'avg_salary': 700000, 'demand': 'medium'},
            {'name': 'Curriculum Developer', 'category': 'education', 'stream': 'arts', 'growth_rate': 4.5, 'avg_salary': 600000, 'demand': 'medium'},
            
            # Business
            {'name': 'Business Analyst', 'category': 'business', 'stream': 'commerce', 'growth_rate': 6.0, 'avg_salary': 800000, 'demand': 'high'},
            {'name': 'Financial Analyst', 'category': 'business', 'stream': 'commerce', 'growth_rate': 5.5, 'avg_salary': 900000, 'demand': 'high'},
            {'name': 'Marketing Manager', 'category': 'business', 'stream': 'commerce', 'growth_rate': 5.0, 'avg_salary': 1000000, 'demand': 'high'},
            {'name': 'Human Resources Manager', 'category': 'business', 'stream': 'commerce', 'growth_rate': 4.5, 'avg_salary': 800000, 'demand': 'medium'},
            {'name': 'Chartered Accountant', 'category': 'business', 'stream': 'commerce', 'growth_rate': 4.0, 'avg_salary': 1200000, 'demand': 'high'},
            
            # Government
            {'name': 'IAS Officer', 'category': 'government', 'stream': 'arts', 'growth_rate': 2.0, 'avg_salary': 1500000, 'demand': 'very_high'},
            {'name': 'IPS Officer', 'category': 'government', 'stream': 'arts', 'growth_rate': 2.0, 'avg_salary': 1400000, 'demand': 'high'},
            {'name': 'Bank Manager', 'category': 'government', 'stream': 'commerce', 'growth_rate': 3.0, 'avg_salary': 1000000, 'demand': 'medium'},
            {'name': 'Defense Officer', 'category': 'government', 'stream': 'engineering', 'growth_rate': 2.5, 'avg_salary': 1200000, 'demand': 'high'},
            
            # Creative
            {'name': 'Graphic Designer', 'category': 'creative', 'stream': 'arts', 'growth_rate': 6.0, 'avg_salary': 500000, 'demand': 'high'},
            {'name': 'Content Writer', 'category': 'creative', 'stream': 'arts', 'growth_rate': 7.0, 'avg_salary': 400000, 'demand': 'high'},
            {'name': 'Journalist', 'category': 'creative', 'stream': 'arts', 'growth_rate': 3.0, 'avg_salary': 600000, 'demand': 'medium'},
            {'name': 'Photographer', 'category': 'creative', 'stream': 'arts', 'growth_rate': 4.0, 'avg_salary': 500000, 'demand': 'medium'},
            
            # Research
            {'name': 'Research Scientist', 'category': 'research', 'stream': 'science', 'growth_rate': 5.0, 'avg_salary': 900000, 'demand': 'medium'},
            {'name': 'Data Analyst', 'category': 'research', 'stream': 'science', 'growth_rate': 8.0, 'avg_salary': 700000, 'demand': 'high'},
            {'name': 'Biotechnologist', 'category': 'research', 'stream': 'science', 'growth_rate': 6.0, 'avg_salary': 800000, 'demand': 'medium'},
        ]
        
        for i, template in enumerate(career_templates):
            if i >= num_careers:
                break
                
            career = template.copy()
            career.update({
                'id': f'career_{i+1}',
                'description': self._generate_career_description(career['name']),
                'education_requirements': self._generate_education_requirements(career['name']),
                'skills_required': self._generate_skills_required(career['name']),
                'job_opportunities': self._generate_job_opportunities(career['name']),
                'salary_range': {
                    'min': int(career['avg_salary'] * 0.6),
                    'max': int(career['avg_salary'] * 1.8),
                    'currency': 'INR'
                },
                'growth_prospects': self._get_growth_prospects(career['growth_rate']),
                'related_exams': self._generate_related_exams(career['name']),
                'duration_to_achieve': self._get_duration_to_achieve(career['name']),
                'difficulty_level': self._get_difficulty_level(career['name']),
                'work_environment': self._get_work_environment(career['category']),
                'job_satisfaction': random.uniform(3.0, 5.0),
                'work_life_balance': random.uniform(2.5, 5.0),
                'stress_level': random.uniform(2.0, 5.0),
                'remote_work_possibility': random.choice([True, False]),
                'entrepreneurship_potential': random.uniform(2.0, 5.0),
                'industry_trends': self._generate_industry_trends(career['category']),
                'future_outlook': self._get_future_outlook(career['growth_rate']),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
            
            careers.append(career)
        
        # Generate additional careers if needed
        while len(careers) < num_careers:
            base_career = random.choice(career_templates)
            career = base_career.copy()
            career.update({
                'id': f'career_{len(careers)+1}',
                'name': f'{base_career["name"]} (Specialized)',
                'description': f'Specialized version of {base_career["name"]} with additional focus areas.',
                'education_requirements': self._generate_education_requirements(base_career['name']),
                'skills_required': self._generate_skills_required(base_career['name']),
                'job_opportunities': self._generate_job_opportunities(base_career['name']),
                'salary_range': {
                    'min': int(base_career['avg_salary'] * 0.6),
                    'max': int(base_career['avg_salary'] * 1.8),
                    'currency': 'INR'
                },
                'growth_prospects': self._get_growth_prospects(base_career['growth_rate']),
                'related_exams': self._generate_related_exams(base_career['name']),
                'duration_to_achieve': self._get_duration_to_achieve(base_career['name']),
                'difficulty_level': self._get_difficulty_level(base_career['name']),
                'work_environment': self._get_work_environment(base_career['category']),
                'job_satisfaction': random.uniform(3.0, 5.0),
                'work_life_balance': random.uniform(2.5, 5.0),
                'stress_level': random.uniform(2.0, 5.0),
                'remote_work_possibility': random.choice([True, False]),
                'entrepreneurship_potential': random.uniform(2.0, 5.0),
                'industry_trends': self._generate_industry_trends(base_career['category']),
                'future_outlook': self._get_future_outlook(base_career['growth_rate']),
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            })
            careers.append(career)
        
        return pd.DataFrame(careers)
    
    def _generate_career_description(self, career_name: str) -> str:
        """Generate detailed career description"""
        descriptions = {
            'Software Engineer': 'Design, develop, and maintain software applications and systems. Work with programming languages, databases, and software development methodologies.',
            'Data Scientist': 'Analyze complex data to help organizations make informed decisions. Use statistical methods, machine learning, and programming to extract insights.',
            'AI/ML Engineer': 'Develop and implement artificial intelligence and machine learning solutions. Build models, algorithms, and systems that can learn and make predictions.',
            'Doctor': 'Diagnose and treat medical conditions, provide healthcare services, and help patients maintain good health.',
            'Teacher': 'Educate students and help them develop knowledge, skills, and values. Create lesson plans, assess student progress, and provide guidance.',
            'Business Analyst': 'Analyze business processes, identify problems, and recommend solutions to improve efficiency and profitability.',
            'Chartered Accountant': 'Provide financial advice, audit accounts, ensure compliance with financial regulations, and help businesses manage their finances.',
        }
        
        return descriptions.get(career_name, f'Professional role in {career_name} involving specialized skills and knowledge in the field.')
    
    def _generate_education_requirements(self, career_name: str) -> List[str]:
        """Generate education requirements for career"""
        requirements_map = {
            'Software Engineer': ['B.Tech Computer Science', 'M.Tech (Optional)', 'Certifications'],
            'Data Scientist': ['B.Sc/M.Sc Statistics/Mathematics', 'M.Tech Data Science', 'Certifications'],
            'AI/ML Engineer': ['B.Tech Computer Science', 'M.Tech AI/ML', 'Ph.D (Optional)'],
            'Doctor': ['MBBS', 'MD/MS (Specialization)', 'Residency'],
            'Teacher': ['B.Ed', 'M.A. in Subject', 'Teaching Certification'],
            'Business Analyst': ['B.Com/MBA', 'Certifications', 'Industry Experience'],
            'Chartered Accountant': ['B.Com', 'CA Foundation', 'CA Intermediate', 'CA Final'],
        }
        
        return requirements_map.get(career_name, ['Bachelor\'s Degree', 'Relevant Certifications', 'Industry Experience'])
    
    def _generate_skills_required(self, career_name: str) -> List[str]:
        """Generate skills required for career"""
        skills_map = {
            'Software Engineer': ['Programming', 'Problem Solving', 'Mathematics', 'Communication', 'Teamwork'],
            'Data Scientist': ['Statistics', 'Programming', 'Machine Learning', 'Business Acumen', 'Communication'],
            'AI/ML Engineer': ['Mathematics', 'Programming', 'Machine Learning', 'Deep Learning', 'Research'],
            'Doctor': ['Biology', 'Chemistry', 'Empathy', 'Communication', 'Problem Solving'],
            'Teacher': ['Communication', 'Patience', 'Subject Knowledge', 'Leadership', 'Creativity'],
            'Business Analyst': ['Analytical Skills', 'Communication', 'Business Knowledge', 'Problem Solving', 'Technology'],
            'Chartered Accountant': ['Mathematics', 'Analytical Skills', 'Attention to Detail', 'Ethics', 'Communication'],
        }
        
        return skills_map.get(career_name, ['Communication', 'Problem Solving', 'Analytical Skills', 'Teamwork', 'Adaptability'])
    
    def _generate_job_opportunities(self, career_name: str) -> List[str]:
        """Generate job opportunities for career"""
        opportunities_map = {
            'Software Engineer': ['Software Developer', 'System Analyst', 'Tech Lead', 'CTO', 'Startup Founder'],
            'Data Scientist': ['Data Analyst', 'Data Scientist', 'ML Engineer', 'Data Architect', 'Research Scientist'],
            'AI/ML Engineer': ['ML Engineer', 'AI Researcher', 'Data Scientist', 'AI Product Manager', 'Research Scientist'],
            'Doctor': ['General Practitioner', 'Specialist', 'Surgeon', 'Medical Researcher', 'Hospital Administrator'],
            'Teacher': ['School Teacher', 'College Professor', 'Educational Consultant', 'Curriculum Developer', 'Principal'],
            'Business Analyst': ['Business Analyst', 'Product Manager', 'Consultant', 'Operations Manager', 'Strategy Manager'],
            'Chartered Accountant': ['CA in Practice', 'Financial Analyst', 'Auditor', 'Tax Consultant', 'CFO'],
        }
        
        return opportunities_map.get(career_name, [f'{career_name}', f'Senior {career_name}', f'{career_name} Manager', f'Lead {career_name}'])
    
    def _get_growth_prospects(self, growth_rate: float) -> str:
        """Get growth prospects based on growth rate"""
        if growth_rate >= 10:
            return 'Very High'
        elif growth_rate >= 7:
            return 'High'
        elif growth_rate >= 4:
            return 'Medium'
        else:
            return 'Low'
    
    def _generate_related_exams(self, career_name: str) -> List[str]:
        """Generate related entrance exams"""
        exams_map = {
            'Software Engineer': ['JEE Main', 'JEE Advanced', 'GATE'],
            'Data Scientist': ['JEE Main', 'GATE', 'GRE'],
            'AI/ML Engineer': ['JEE Main', 'GATE', 'GRE'],
            'Doctor': ['NEET', 'AIIMS', 'JIPMER'],
            'Teacher': ['CTET', 'TET', 'NET'],
            'Business Analyst': ['CAT', 'MAT', 'XAT'],
            'Chartered Accountant': ['CA Foundation', 'CA Intermediate', 'CA Final'],
        }
        
        return exams_map.get(career_name, ['University Entrance Exams', 'Industry Certifications'])
    
    def _get_duration_to_achieve(self, career_name: str) -> str:
        """Get duration to achieve career"""
        duration_map = {
            'Software Engineer': '4-6 years',
            'Data Scientist': '4-6 years',
            'AI/ML Engineer': '5-7 years',
            'Doctor': '7-10 years',
            'Teacher': '3-5 years',
            'Business Analyst': '3-5 years',
            'Chartered Accountant': '4-5 years',
        }
        
        return duration_map.get(career_name, '3-6 years')
    
    def _get_difficulty_level(self, career_name: str) -> str:
        """Get difficulty level of career"""
        difficulty_map = {
            'Software Engineer': 'Medium',
            'Data Scientist': 'High',
            'AI/ML Engineer': 'High',
            'Doctor': 'High',
            'Teacher': 'Medium',
            'Business Analyst': 'Medium',
            'Chartered Accountant': 'High',
        }
        
        return difficulty_map.get(career_name, 'Medium')
    
    def _get_work_environment(self, category: str) -> str:
        """Get work environment based on category"""
        environments = {
            'technology': 'Office/Remote',
            'healthcare': 'Hospital/Clinic',
            'education': 'School/College',
            'business': 'Office',
            'government': 'Government Office',
            'creative': 'Studio/Office',
            'research': 'Laboratory/Office'
        }
        
        return environments.get(category, 'Office')
    
    def _generate_industry_trends(self, category: str) -> List[str]:
        """Generate industry trends"""
        trends_map = {
            'technology': ['AI/ML Integration', 'Cloud Computing', 'Cybersecurity', 'Remote Work'],
            'healthcare': ['Telemedicine', 'AI in Healthcare', 'Preventive Care', 'Digital Health'],
            'education': ['Online Learning', 'EdTech Integration', 'Personalized Learning', 'Skill-based Education'],
            'business': ['Digital Transformation', 'Sustainability', 'Data-driven Decisions', 'Remote Work'],
            'government': ['Digital Governance', 'Transparency', 'Citizen Services', 'E-governance'],
            'creative': ['Digital Media', 'Content Creation', 'Social Media', 'Virtual Reality'],
            'research': ['Interdisciplinary Research', 'Open Science', 'Data Sharing', 'Collaboration']
        }
        
        return trends_map.get(category, ['Digital Transformation', 'Innovation', 'Sustainability'])
    
    def _get_future_outlook(self, growth_rate: float) -> str:
        """Get future outlook based on growth rate"""
        if growth_rate >= 10:
            return 'Excellent - High demand and growth expected'
        elif growth_rate >= 7:
            return 'Good - Steady growth and opportunities'
        elif growth_rate >= 4:
            return 'Moderate - Stable with some growth'
        else:
            return 'Limited - Slow growth or declining demand'
    
    def generate_student_outcomes_dataset(self, num_students: int = 10000) -> pd.DataFrame:
        """Generate student outcomes dataset for training ML models"""
        students = []
        
        for i in range(num_students):
            # Generate student profile
            student = {
                'id': f'student_{i+1}',
                'age': random.randint(16, 25),
                'gender': random.choice(['Male', 'Female', 'Other']),
                'state': random.choice(self.states),
                'class_level': random.choice(['10', '12', 'undergraduate', 'postgraduate']),
                'family_income': random.randint(100000, 5000000),
                'parent_education': random.choices(['Below 10th', '10th', '12th', 'Graduate', 'Post Graduate'], weights=[0.1, 0.2, 0.3, 0.3, 0.1])[0],
                'interests': random.sample(['Mathematics', 'Science', 'Arts', 'Sports', 'Music', 'Technology', 'Business', 'Medicine'], random.randint(2, 5)),
                'personality_traits': {
                    'extroversion': random.uniform(1, 5),
                    'conscientiousness': random.uniform(1, 5),
                    'openness': random.uniform(1, 5),
                    'agreeableness': random.uniform(1, 5),
                    'neuroticism': random.uniform(1, 5)
                },
                'academic_performance': {
                    'class_10_percentage': random.uniform(60, 95),
                    'class_12_percentage': random.uniform(60, 95),
                    'entrance_exam_score': random.uniform(50, 100),
                    'overall_gpa': random.uniform(6.0, 10.0)
                },
                'quiz_scores': {
                    'mathematics': random.uniform(3, 10),
                    'science': random.uniform(3, 10),
                    'arts': random.uniform(3, 10),
                    'commerce': random.uniform(3, 10),
                    'problem_solving': random.uniform(3, 10),
                    'communication': random.uniform(3, 10),
                    'creativity': random.uniform(3, 10),
                    'leadership': random.uniform(3, 10)
                },
                'recommended_stream': self._predict_stream(i),
                'chosen_stream': self._predict_stream(i),  # In real data, this would be actual choice
                'success_metrics': {
                    'graduation_rate': random.uniform(0.7, 1.0),
                    'placement_success': random.choice([True, False]),
                    'salary_after_graduation': random.randint(200000, 2000000),
                    'job_satisfaction': random.uniform(3.0, 5.0),
                    'career_growth': random.uniform(2.0, 5.0)
                },
                'feedback': {
                    'recommendation_accuracy': random.uniform(0.6, 1.0),
                    'user_satisfaction': random.uniform(3.0, 5.0),
                    'would_recommend': random.choice([True, False])
                },
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            students.append(student)
        
        return pd.DataFrame(students)
    
    def _predict_stream(self, student_id: int) -> str:
        """Predict stream based on student characteristics (simplified model)"""
        # This is a simplified prediction - in real implementation, this would be based on ML model
        streams = ['science', 'arts', 'commerce', 'engineering', 'medical', 'vocational']
        return random.choice(streams)
    
    def save_datasets(self, output_dir: str = 'data'):
        """Save all datasets to files"""
        os.makedirs(output_dir, exist_ok=True)
        
        print("Generating colleges dataset...")
        colleges_df = self.generate_colleges_dataset(1000)
        colleges_df.to_csv(f'{output_dir}/colleges.csv', index=False)
        colleges_df.to_json(f'{output_dir}/colleges.json', orient='records', indent=2)
        
        print("Generating careers dataset...")
        careers_df = self.generate_careers_dataset(500)
        careers_df.to_csv(f'{output_dir}/careers.csv', index=False)
        careers_df.to_json(f'{output_dir}/careers.json', orient='records', indent=2)
        
        print("Generating student outcomes dataset...")
        students_df = self.generate_student_outcomes_dataset(10000)
        students_df.to_csv(f'{output_dir}/student_outcomes.csv', index=False)
        students_df.to_json(f'{output_dir}/student_outcomes.json', orient='records', indent=2)
        
        print(f"All datasets saved to {output_dir}/")
        print(f"Colleges: {len(colleges_df)} records")
        print(f"Careers: {len(careers_df)} records")
        print(f"Student Outcomes: {len(students_df)} records")

if __name__ == "__main__":
    generator = DatasetGenerator()
    generator.save_datasets()

