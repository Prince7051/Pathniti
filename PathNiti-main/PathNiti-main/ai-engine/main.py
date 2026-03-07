"""
EduNiti AI Recommendation Engine
FastAPI backend for personalized career and education recommendations
"""

from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import numpy as np
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# from sklearn.cluster import KMeans
import httpx
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="EduNiti AI Recommendation Engine",
    description="AI-powered career and education recommendations for Indian students",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://eduniti.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Pydantic models
class UserProfile(BaseModel):
    user_id: str
    age: Optional[int] = None
    class_level: Optional[str] = None  # '10', '12', 'undergraduate', 'postgraduate'
    stream: Optional[str] = None  # 'arts', 'science', 'commerce', 'vocational', 'engineering', 'medical'
    interests: List[str] = []
    location: Optional[Dict[str, Any]] = None
    quiz_scores: Optional[Dict[str, float]] = None

class QuizResponse(BaseModel):
    user_id: str
    question_id: str
    selected_answer: int
    time_taken: Optional[int] = None

class RecommendationRequest(BaseModel):
    user_profile: UserProfile
    recommendation_type: str  # 'stream', 'college', 'career', 'scholarship'
    limit: int = 10

class RecommendationResponse(BaseModel):
    recommendations: List[Dict[str, Any]]
    confidence_score: float
    reasoning: str

class StreamRecommendation(BaseModel):
    stream: str
    confidence: float
    reasoning: str
    career_paths: List[str]
    required_subjects: List[str]

class CollegeRecommendation(BaseModel):
    college_id: str
    name: str
    match_score: float
    reasons: List[str]
    programs: List[str]

class CareerPathway(BaseModel):
    career: str
    education_path: List[str]
    skills_required: List[str]
    job_opportunities: List[str]
    salary_range: Dict[str, Any]
    growth_prospects: str

# Global variables for ML models
# vectorizer = None
college_data = None
career_data = None
stream_data = None

@app.on_event("startup")
async def startup_event():
    """Initialize ML models and load data on startup"""
    global college_data, career_data, stream_data
    
    logger.info("Initializing AI Recommendation Engine...")
    
    # Load sample data (in production, this would come from Supabase)
    await load_sample_data()
    
    logger.info("AI Recommendation Engine initialized successfully!")

async def load_sample_data():
    """Load sample data for recommendations"""
    global college_data, career_data, stream_data
    
    # Sample college data
    college_data = pd.DataFrame([
        {
            'id': '1',
            'name': 'Delhi University',
            'type': 'government',
            'location': {'state': 'Delhi', 'city': 'New Delhi'},
            'programs': ['B.A.', 'B.Sc.', 'B.Com.', 'B.Tech'],
            'streams': ['arts', 'science', 'commerce', 'engineering'],
            'cut_off': 85,
            'facilities': ['hostel', 'library', 'sports', 'labs']
        },
        {
            'id': '2',
            'name': 'IIT Delhi',
            'type': 'government',
            'location': {'state': 'Delhi', 'city': 'New Delhi'},
            'programs': ['B.Tech', 'M.Tech', 'Ph.D'],
            'streams': ['engineering'],
            'cut_off': 95,
            'facilities': ['hostel', 'library', 'sports', 'labs', 'research_center']
        },
        {
            'id': '3',
            'name': 'JNU',
            'type': 'government',
            'location': {'state': 'Delhi', 'city': 'New Delhi'},
            'programs': ['B.A.', 'M.A.', 'Ph.D'],
            'streams': ['arts'],
            'cut_off': 80,
            'facilities': ['hostel', 'library', 'sports']
        }
    ])
    
    # Sample career data
    career_data = pd.DataFrame([
        {
            'career': 'Software Engineer',
            'stream': 'engineering',
            'education_path': ['B.Tech Computer Science', 'M.Tech (Optional)'],
            'skills': ['Programming', 'Problem Solving', 'Mathematics'],
            'salary_range': {'min': 500000, 'max': 2000000},
            'growth': 'High'
        },
        {
            'career': 'Doctor',
            'stream': 'medical',
            'education_path': ['MBBS', 'MD/MS (Specialization)'],
            'skills': ['Biology', 'Chemistry', 'Empathy', 'Communication'],
            'salary_range': {'min': 800000, 'max': 3000000},
            'growth': 'High'
        },
        {
            'career': 'Teacher',
            'stream': 'arts',
            'education_path': ['B.Ed', 'M.A. in Subject'],
            'skills': ['Communication', 'Patience', 'Subject Knowledge'],
            'salary_range': {'min': 300000, 'max': 800000},
            'growth': 'Medium'
        }
    ])
    
    # Sample stream data
    stream_data = pd.DataFrame([
        {
            'stream': 'science',
            'subjects': ['Physics', 'Chemistry', 'Mathematics', 'Biology'],
            'careers': ['Engineer', 'Doctor', 'Scientist', 'Researcher'],
            'description': 'Focus on scientific subjects and analytical thinking'
        },
        {
            'stream': 'arts',
            'subjects': ['History', 'Geography', 'Political Science', 'Literature'],
            'careers': ['Teacher', 'Journalist', 'Lawyer', 'Social Worker'],
            'description': 'Focus on humanities and social sciences'
        },
        {
            'stream': 'commerce',
            'subjects': ['Accountancy', 'Business Studies', 'Economics', 'Mathematics'],
            'careers': ['CA', 'MBA', 'Banking', 'Finance'],
            'description': 'Focus on business and financial subjects'
        }
    ])

def calculate_stream_recommendation(user_profile: UserProfile) -> List[StreamRecommendation]:
    """Calculate stream recommendations based on user profile"""
    recommendations = []
    
    # Simple scoring algorithm based on interests and quiz scores
    stream_scores = {}
    
    for _, stream_row in stream_data.iterrows():
        score = 0
        stream = stream_row['stream']
        
        # Score based on interests
        for interest in user_profile.interests:
            if interest.lower() in stream_row['subjects']:
                score += 2
            if interest.lower() in stream_row['careers']:
                score += 3
        
        # Score based on quiz results
        if user_profile.quiz_scores:
            for subject, score_val in user_profile.quiz_scores.items():
                if subject.lower() in [s.lower() for s in stream_row['subjects']]:
                    score += score_val * 0.5
        
        stream_scores[stream] = score
    
    # Sort by score and create recommendations
    sorted_streams = sorted(stream_scores.items(), key=lambda x: x[1], reverse=True)
    
    for stream, score in sorted_streams[:3]:
        stream_row = stream_data[stream_data['stream'] == stream].iloc[0]
        
        recommendations.append(StreamRecommendation(
            stream=stream,
            confidence=min(score / 10, 1.0),  # Normalize to 0-1
            reasoning=f"Based on your interests in {', '.join(user_profile.interests[:3])} and academic strengths",
            career_paths=stream_row['careers'],
            required_subjects=stream_row['subjects']
        ))
    
    return recommendations

def calculate_college_recommendations(user_profile: UserProfile, limit: int = 10) -> List[CollegeRecommendation]:
    """Calculate college recommendations based on user profile"""
    recommendations = []
    
    for _, college in college_data.iterrows():
        match_score = 0
        reasons = []
        
        # Location preference
        if user_profile.location and college['location']['state'] == user_profile.location.get('state'):
            match_score += 0.3
            reasons.append("Located in your preferred state")
        
        # Stream match
        if user_profile.stream and user_profile.stream in college['streams']:
            match_score += 0.4
            reasons.append(f"Offers {user_profile.stream} programs")
        
        # Interest match
        for interest in user_profile.interests:
            if interest.lower() in ' '.join(college['programs']).lower():
                match_score += 0.1
                reasons.append(f"Programs align with your interest in {interest}")
        
        # Cut-off consideration
        if user_profile.quiz_scores:
            avg_score = sum(user_profile.quiz_scores.values()) / len(user_profile.quiz_scores)
            if avg_score >= college['cut_off'] * 0.8:  # 80% of cut-off
                match_score += 0.2
                reasons.append("Your academic profile matches the college requirements")
        
        if match_score > 0:
            recommendations.append(CollegeRecommendation(
                college_id=college['id'],
                name=college['name'],
                match_score=match_score,
                reasons=reasons,
                programs=college['programs']
            ))
    
    # Sort by match score and return top recommendations
    recommendations.sort(key=lambda x: x.match_score, reverse=True)
    return recommendations[:limit]

def calculate_career_recommendations(user_profile: UserProfile) -> List[CareerPathway]:
    """Calculate career recommendations based on user profile"""
    recommendations = []
    
    # Filter careers by stream
    if user_profile.stream:
        relevant_careers = career_data[career_data['stream'] == user_profile.stream]
    else:
        relevant_careers = career_data
    
    for _, career in relevant_careers.iterrows():
        recommendations.append(CareerPathway(
            career=career['career'],
            education_path=career['education_path'],
            skills_required=career['skills'],
            job_opportunities=[career['career']],  # Simplified
            salary_range=career['salary_range'],
            growth_prospects=career['growth']
        ))
    
    return recommendations

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "EduNiti AI Recommendation Engine is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models_loaded": {
            "college_data": college_data is not None,
            "career_data": career_data is not None,
            "stream_data": stream_data is not None
        }
    }

@app.post("/recommendations/stream", response_model=List[StreamRecommendation])
async def get_stream_recommendations(user_profile: UserProfile):
    """Get stream recommendations for a user"""
    try:
        recommendations = calculate_stream_recommendation(user_profile)
        return recommendations
    except Exception as e:
        logger.error(f"Error in stream recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating stream recommendations")

@app.post("/recommendations/college", response_model=List[CollegeRecommendation])
async def get_college_recommendations(user_profile: UserProfile, limit: int = 10):
    """Get college recommendations for a user"""
    try:
        recommendations = calculate_college_recommendations(user_profile, limit)
        return recommendations
    except Exception as e:
        logger.error(f"Error in college recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating college recommendations")

@app.post("/recommendations/career", response_model=List[CareerPathway])
async def get_career_recommendations(user_profile: UserProfile):
    """Get career recommendations for a user"""
    try:
        recommendations = calculate_career_recommendations(user_profile)
        return recommendations
    except Exception as e:
        logger.error(f"Error in career recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating career recommendations")

@app.post("/recommendations/quiz", response_model=Dict[str, Any])
async def process_quiz_results(quiz_responses: List[QuizResponse]):
    """Process quiz responses and return analysis"""
    try:
        # Simple scoring algorithm
        scores = {}
        total_time = 0
        
        for response in quiz_responses:
            # This is a simplified scoring - in production, you'd have more sophisticated logic
            scores[response.question_id] = response.selected_answer
            total_time += response.time_taken or 0
        
        # Calculate overall performance
        avg_score = sum(scores.values()) / len(scores) if scores else 0
        
        return {
            "scores": scores,
            "average_score": avg_score,
            "total_time": total_time,
            "performance_level": "High" if avg_score > 3 else "Medium" if avg_score > 2 else "Low",
            "recommendations": ["Focus on areas with lower scores", "Consider additional practice"]
        }
    except Exception as e:
        logger.error(f"Error processing quiz results: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing quiz results")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
