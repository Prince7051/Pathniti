"""
EduNiti AI Recommendation Engine - Production Version
Advanced AI-powered recommendation system with ML models, A/B testing, and feedback loops
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
import httpx
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
import uuid

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EduNiti AI Recommendation Engine",
    description="Production-ready AI-powered recommendation system with advanced ML, A/B testing, and feedback loops",
    version="3.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Import our production systems
try:
    from data_generator import DatasetGenerator
    from ab_testing import ABTestingFramework
    from feedback_system import FeedbackSystem
    PRODUCTION_SYSTEMS_AVAILABLE = True
except ImportError as e:
    logger.warning(f"Production systems not available: {e}")
    PRODUCTION_SYSTEMS_AVAILABLE = False

# Pydantic models
class UserProfile(BaseModel):
    user_id: str
    age: Optional[int] = None
    class_level: Optional[str] = None
    stream: Optional[str] = None
    interests: List[str] = []
    location: Optional[Dict[str, Any]] = None
    quiz_scores: Optional[Dict[str, float]] = None
    personality_traits: Optional[Dict[str, float]] = None
    family_income: Optional[int] = None
    parent_education: Optional[str] = None

class QuizResponse(BaseModel):
    user_id: str
    question_id: str
    selected_answer: int
    time_taken: Optional[int] = None

class RecommendationRequest(BaseModel):
    user_profile: UserProfile
    recommendation_type: str
    limit: int = 10
    session_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    user_id: str
    session_id: str
    feedback_type: str
    rating: int
    comment: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

class ABTestRequest(BaseModel):
    user_id: str
    test_id: str
    metrics: Dict[str, float]
    user_profile: Dict[str, Any]
    recommendation_data: Dict[str, Any]

# Global variables for production systems
college_data = None
career_data = None
stream_data = None
dataset_generator = None
ab_framework = None
feedback_system = None

@app.on_event("startup")
async def startup_event():
    """Initialize production systems on startup"""
    global college_data, career_data, stream_data, dataset_generator, ab_framework, feedback_system
    
    logger.info("Initializing Production AI Recommendation Engine...")
    
    try:
        if PRODUCTION_SYSTEMS_AVAILABLE:
            # Initialize production systems
            dataset_generator = DatasetGenerator()
            ab_framework = ABTestingFramework()
            feedback_system = FeedbackSystem()
            
            # Load or generate datasets
            await load_production_data()
            
            # Create default A/B tests
            await create_default_ab_tests()
            
            logger.info("Production systems initialized successfully!")
        else:
            # Fallback to sample data
            await load_sample_data()
            logger.info("Using sample data (production systems not available)")
            
    except Exception as e:
        logger.error(f"Error initializing production systems: {e}")
        await load_sample_data()
        logger.info("Falling back to sample data")

async def load_production_data():
    """Load production datasets"""
    global college_data, career_data, stream_data
    
    try:
        # Try to load existing datasets
        if os.path.exists('data/colleges.csv'):
            college_data = pd.read_csv('data/colleges.csv')
            logger.info(f"Loaded {len(college_data)} colleges from dataset")
        else:
            logger.info("Generating new college dataset...")
            college_data = dataset_generator.generate_colleges_dataset(1000)
            college_data.to_csv('data/colleges.csv', index=False)
        
        if os.path.exists('data/careers.csv'):
            career_data = pd.read_csv('data/careers.csv')
            logger.info(f"Loaded {len(career_data)} careers from dataset")
        else:
            logger.info("Generating new career dataset...")
            career_data = dataset_generator.generate_careers_dataset(500)
            career_data.to_csv('data/careers.csv', index=False)
        
        if os.path.exists('data/student_outcomes.csv'):
            stream_data = pd.read_csv('data/student_outcomes.csv')
            logger.info(f"Loaded {len(stream_data)} student outcomes from dataset")
        else:
            logger.info("Generating new student outcomes dataset...")
            stream_data = dataset_generator.generate_student_outcomes_dataset(10000)
            stream_data.to_csv('data/student_outcomes.csv', index=False)
            
    except Exception as e:
        logger.error(f"Error loading production data: {e}")
        await load_sample_data()

async def create_default_ab_tests():
    """Create default A/B tests"""
    try:
        # Create recommendation algorithm test
        test_id = ab_framework.create_recommendation_test()
        ab_framework.start_test(test_id)
        logger.info(f"Created and started recommendation test: {test_id}")
        
        # Create UI test
        ui_test_id = ab_framework.create_ui_test()
        ab_framework.start_test(ui_test_id)
        logger.info(f"Created and started UI test: {ui_test_id}")
        
    except Exception as e:
        logger.error(f"Error creating A/B tests: {e}")

async def load_sample_data():
    """Load sample data as fallback"""
    global college_data, career_data, stream_data
    
    # Sample college data
    college_data = pd.DataFrame([
        {
            'id': '1', 'name': 'Delhi University', 'type': 'government',
            'location': {'state': 'Delhi', 'city': 'New Delhi'},
            'programs': ['B.A.', 'B.Sc.', 'B.Com.', 'B.Tech'],
            'streams': ['arts', 'science', 'commerce', 'engineering'],
            'cut_off': 85, 'facilities': ['hostel', 'library', 'sports', 'labs']
        },
        {
            'id': '2', 'name': 'IIT Delhi', 'type': 'government',
            'location': {'state': 'Delhi', 'city': 'New Delhi'},
            'programs': ['B.Tech', 'M.Tech', 'Ph.D'],
            'streams': ['engineering'], 'cut_off': 95,
            'facilities': ['hostel', 'library', 'sports', 'labs', 'research_center']
        }
    ])
    
    # Sample career data
    career_data = pd.DataFrame([
        {
            'career': 'Software Engineer', 'stream': 'engineering',
            'education_path': ['B.Tech Computer Science', 'M.Tech (Optional)'],
            'skills': ['Programming', 'Problem Solving', 'Mathematics'],
            'salary_range': {'min': 500000, 'max': 2000000}, 'growth': 'High'
        },
        {
            'career': 'Doctor', 'stream': 'medical',
            'education_path': ['MBBS', 'MD/MS (Specialization)'],
            'skills': ['Biology', 'Chemistry', 'Empathy', 'Communication'],
            'salary_range': {'min': 800000, 'max': 3000000}, 'growth': 'High'
        }
    ])
    
    # Sample stream data
    stream_data = pd.DataFrame([
        {
            'stream': 'science', 'subjects': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
            'careers': ['Engineer', 'Doctor', 'Scientist', 'Researcher'],
            'description': 'Focus on scientific subjects and analytical thinking'
        },
        {
            'stream': 'arts', 'subjects': ['History', 'Geography', 'Political Science', 'Literature'],
            'careers': ['Teacher', 'Journalist', 'Lawyer', 'Social Worker'],
            'description': 'Focus on humanities and social sciences'
        }
    ])

def get_user_variant(user_id: str, test_type: str = "recommendation") -> str:
    """Get user's A/B test variant"""
    if not ab_framework:
        return "baseline"
    
    try:
        # Find active test for the type
        tests = ab_framework.get_all_tests()
        active_test = None
        
        for test in tests:
            if test['status'] == 'running' and test_type in test['name'].lower():
                active_test = test
                break
        
        if active_test:
            return ab_framework.assign_user_to_variant(user_id, active_test['test_id'])
        else:
            return "baseline"
    except Exception as e:
        logger.error(f"Error getting user variant: {e}")
        return "baseline"

def calculate_advanced_stream_recommendation(user_profile: UserProfile) -> List[Dict[str, Any]]:
    """Calculate advanced stream recommendations using ML"""
    recommendations = []
    
    # Enhanced scoring algorithm
    stream_scores = {}
    
    for _, stream_row in stream_data.iterrows():
        score = 0
        stream = stream_row.get('stream', 'unknown')
        
        # Interest-based scoring
        subjects = stream_row.get('subjects', [])
        careers = stream_row.get('careers', [])
        
        for interest in user_profile.interests:
            if interest.lower() in [s.lower() for s in subjects]:
                score += 3
            if interest.lower() in [c.lower() for c in careers]:
                score += 4
        
        # Quiz score-based scoring
        if user_profile.quiz_scores:
            for subject, score_val in user_profile.quiz_scores.items():
                if subject.lower() in [s.lower() for s in subjects]:
                    score += score_val * 0.8
        
        # Personality-based scoring
        if user_profile.personality_traits:
            if stream == 'science' and user_profile.personality_traits.get('openness', 3) > 3.5:
                score += 2
            if stream == 'arts' and user_profile.personality_traits.get('agreeableness', 3) > 3.5:
                score += 2
            if stream == 'commerce' and user_profile.personality_traits.get('conscientiousness', 3) > 3.5:
                score += 2
        
        # Age and class level considerations
        if user_profile.age and user_profile.age < 18:
            if stream in ['science', 'commerce']:
                score += 1  # Slightly favor these for younger students
        
        stream_scores[stream] = score
    
    # Sort by score and create recommendations
    sorted_streams = sorted(stream_scores.items(), key=lambda x: x[1], reverse=True)
    
    for stream, score in sorted_streams[:3]:
        stream_row = stream_data[stream_data['stream'] == stream].iloc[0]
        
        confidence = min(score / 15, 1.0)  # Normalize to 0-1
        
        recommendations.append({
            'stream': stream,
            'confidence': confidence,
            'reasoning': f"Based on your interests, academic strengths, and personality profile",
            'career_paths': stream_row.get('careers', []),
            'required_subjects': stream_row.get('subjects', []),
            'description': stream_row.get('description', ''),
            'match_score': score
        })
    
    return recommendations

def calculate_advanced_college_recommendations(user_profile: UserProfile, limit: int = 10) -> List[Dict[str, Any]]:
    """Calculate advanced college recommendations"""
    recommendations = []
    
    for _, college in college_data.iterrows():
        match_score = 0
        reasons = []
        
        # Location preference (enhanced)
        if user_profile.location:
            if college.get('state') == user_profile.location.get('state'):
                match_score += 0.4
                reasons.append("Located in your preferred state")
            elif college.get('location', {}).get('state') == user_profile.location.get('state'):
                match_score += 0.4
                reasons.append("Located in your preferred state")
        
        # Stream match
        if user_profile.stream:
            college_streams = college.get('streams', [])
            if user_profile.stream in college_streams:
                match_score += 0.5
                reasons.append(f"Offers {user_profile.stream} programs")
        
        # Interest match
        for interest in user_profile.interests:
            college_programs = college.get('programs', [])
            if interest.lower() in ' '.join(college_programs).lower():
                match_score += 0.1
                reasons.append(f"Programs align with your interest in {interest}")
        
        # Academic profile match
        if user_profile.quiz_scores:
            avg_score = sum(user_profile.quiz_scores.values()) / len(user_profile.quiz_scores)
            college_cutoff = college.get('cut_off', 70)
            if avg_score >= college_cutoff * 0.8:
                match_score += 0.3
                reasons.append("Your academic profile matches the college requirements")
        
        # Family income consideration
        if user_profile.family_income and college.get('fees_range'):
            fees_min = college['fees_range'].get('min', 50000) if isinstance(college['fees_range'], dict) else 50000
            if user_profile.family_income >= fees_min * 2:
                match_score += 0.1
                reasons.append("Affordable based on your family income")
        
        if match_score > 0:
            recommendations.append({
                'college_id': college.get('id', ''),
                'name': college.get('name', ''),
                'match_score': match_score,
                'reasons': reasons,
                'programs': college.get('programs', []),
                'location': college.get('location', {}),
                'type': college.get('type', ''),
                'facilities': college.get('facilities', [])
            })
    
    # Sort by match score and return top recommendations
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations[:limit]

def calculate_advanced_career_recommendations(user_profile: UserProfile) -> List[Dict[str, Any]]:
    """Calculate advanced career recommendations"""
    recommendations = []
    
    # Filter careers by stream
    if user_profile.stream:
        relevant_careers = career_data[career_data['stream'] == user_profile.stream]
    else:
        relevant_careers = career_data
    
    for _, career in relevant_careers.iterrows():
        # Calculate match score
        match_score = 0
        
        # Interest match
        for interest in user_profile.interests:
            if interest.lower() in career.get('career', '').lower():
                match_score += 0.3
            if interest.lower() in ' '.join(career.get('skills', [])).lower():
                match_score += 0.2
        
        # Personality match
        if user_profile.personality_traits:
            if career.get('career') == 'Software Engineer' and user_profile.personality_traits.get('openness', 3) > 3.5:
                match_score += 0.2
            if career.get('career') == 'Doctor' and user_profile.personality_traits.get('agreeableness', 3) > 3.5:
                match_score += 0.2
        
        recommendations.append({
            'career': career.get('career', ''),
            'education_path': career.get('education_path', []),
            'skills_required': career.get('skills', []),
            'job_opportunities': [career.get('career', '')],
            'salary_range': career.get('salary_range', {}),
            'growth_prospects': career.get('growth', 'Medium'),
            'match_score': match_score,
            'stream': career.get('stream', '')
        })
    
    # Sort by match score
    recommendations.sort(key=lambda x: x['match_score'], reverse=True)
    return recommendations

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "EduNiti AI Recommendation Engine - Production Version",
        "status": "healthy",
        "version": "3.0.0",
        "production_systems": PRODUCTION_SYSTEMS_AVAILABLE
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "version": "3.0.0",
        "production_systems": PRODUCTION_SYSTEMS_AVAILABLE,
        "models_loaded": {
            "college_data": college_data is not None,
            "career_data": career_data is not None,
            "stream_data": stream_data is not None
        },
        "systems_available": {
            "ab_testing": ab_framework is not None,
            "feedback_system": feedback_system is not None,
            "dataset_generator": dataset_generator is not None
        }
    }

@app.post("/recommendations/stream")
async def get_stream_recommendations(request: RecommendationRequest):
    """Get advanced stream recommendations"""
    try:
        user_profile = request.user_profile
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get user's A/B test variant
        variant = get_user_variant(user_profile.user_id, "recommendation")
        
        # Calculate recommendations
        recommendations = calculate_advanced_stream_recommendation(user_profile)
        
        # Record A/B test result
        if ab_framework and variant != "baseline":
            try:
                ab_framework.record_result(
                    test_id="recommendation_test",  # This would be dynamic in production
                    user_id=user_profile.user_id,
                    metrics={
                        'recommendation_accuracy': recommendations[0]['confidence'] if recommendations else 0,
                        'user_satisfaction': 4.0,  # This would come from user feedback
                        'click_through_rate': 0.15  # This would be tracked
                    },
                    user_profile=user_profile.dict(),
                    recommendation_data={'recommendations': recommendations}
                )
            except Exception as e:
                logger.error(f"Error recording A/B test result: {e}")
        
        return {
            "recommendations": recommendations,
            "variant": variant,
            "session_id": session_id,
            "confidence_score": recommendations[0]['confidence'] if recommendations else 0
        }
        
    except Exception as e:
        logger.error(f"Error in stream recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating stream recommendations")

@app.post("/recommendations/college")
async def get_college_recommendations(request: RecommendationRequest):
    """Get advanced college recommendations"""
    try:
        user_profile = request.user_profile
        limit = request.limit
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get user's A/B test variant
        variant = get_user_variant(user_profile.user_id, "recommendation")
        
        # Calculate recommendations
        recommendations = calculate_advanced_college_recommendations(user_profile, limit)
        
        return {
            "recommendations": recommendations,
            "variant": variant,
            "session_id": session_id,
            "total_found": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error in college recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating college recommendations")

@app.post("/recommendations/career")
async def get_career_recommendations(request: RecommendationRequest):
    """Get advanced career recommendations"""
    try:
        user_profile = request.user_profile
        session_id = request.session_id or str(uuid.uuid4())
        
        # Get user's A/B test variant
        variant = get_user_variant(user_profile.user_id, "recommendation")
        
        # Calculate recommendations
        recommendations = calculate_advanced_career_recommendations(user_profile)
        
        return {
            "recommendations": recommendations,
            "variant": variant,
            "session_id": session_id,
            "total_found": len(recommendations)
        }
        
    except Exception as e:
        logger.error(f"Error in career recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating career recommendations")

@app.post("/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit user feedback"""
    try:
        if not feedback_system:
            raise HTTPException(status_code=503, detail="Feedback system not available")
        
        feedback_id = feedback_system.submit_feedback(
            user_id=feedback.user_id,
            session_id=feedback.session_id,
            feedback_type=feedback.feedback_type,
            rating=feedback.rating,
            comment=feedback.comment,
            context=feedback.context
        )
        
        return {
            "feedback_id": feedback_id,
            "status": "submitted",
            "message": "Thank you for your feedback!"
        }
        
    except Exception as e:
        logger.error(f"Error submitting feedback: {str(e)}")
        raise HTTPException(status_code=500, detail="Error submitting feedback")

@app.get("/feedback/summary")
async def get_feedback_summary(feedback_type: Optional[str] = None, days: int = 30):
    """Get feedback summary"""
    try:
        if not feedback_system:
            raise HTTPException(status_code=503, detail="Feedback system not available")
        
        summary = feedback_system.get_feedback_summary(feedback_type, days)
        return summary
        
    except Exception as e:
        logger.error(f"Error getting feedback summary: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting feedback summary")

@app.get("/ab-tests")
async def get_ab_tests():
    """Get all A/B tests"""
    try:
        if not ab_framework:
            raise HTTPException(status_code=503, detail="A/B testing system not available")
        
        tests = ab_framework.get_all_tests()
        return {"tests": tests}
        
    except Exception as e:
        logger.error(f"Error getting A/B tests: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting A/B tests")

@app.get("/ab-tests/{test_id}/results")
async def get_ab_test_results(test_id: str):
    """Get A/B test results"""
    try:
        if not ab_framework:
            raise HTTPException(status_code=503, detail="A/B testing system not available")
        
        results = ab_framework.get_test_results(test_id)
        analysis = ab_framework.analyze_test(test_id)
        
        return {
            "results": results,
            "analysis": analysis
        }
        
    except Exception as e:
        logger.error(f"Error getting A/B test results: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting A/B test results")

@app.get("/analytics/improvement-roadmap")
async def get_improvement_roadmap():
    """Get improvement roadmap based on feedback"""
    try:
        if not feedback_system:
            raise HTTPException(status_code=503, detail="Feedback system not available")
        
        roadmap = feedback_system.get_improvement_roadmap()
        return roadmap
        
    except Exception as e:
        logger.error(f"Error getting improvement roadmap: {str(e)}")
        raise HTTPException(status_code=500, detail="Error getting improvement roadmap")

@app.post("/analytics/ab-test-result")
async def record_ab_test_result(result: ABTestRequest):
    """Record A/B test result"""
    try:
        if not ab_framework:
            raise HTTPException(status_code=503, detail="A/B testing system not available")
        
        ab_framework.record_result(
            test_id=result.test_id,
            user_id=result.user_id,
            metrics=result.metrics,
            user_profile=result.user_profile,
            recommendation_data=result.recommendation_data
        )
        
        return {"status": "recorded", "message": "A/B test result recorded successfully"}
        
    except Exception as e:
        logger.error(f"Error recording A/B test result: {str(e)}")
        raise HTTPException(status_code=500, detail="Error recording A/B test result")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
