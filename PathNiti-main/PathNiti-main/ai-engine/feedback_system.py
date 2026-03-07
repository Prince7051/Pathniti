"""
User Feedback System for EduNiti AI Engine
Implements continuous feedback loops for model improvement
"""

import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
import pandas as pd
import numpy as np

@dataclass
class Feedback:
    """User feedback data structure"""
    feedback_id: str
    user_id: str
    session_id: str
    feedback_type: str  # 'recommendation', 'quiz', 'college', 'career', 'general'
    rating: int  # 1-5 scale
    comment: Optional[str]
    context: Dict[str, Any]  # Additional context about the feedback
    timestamp: datetime
    processed: bool = False

@dataclass
class FeedbackAnalysis:
    """Analysis of feedback patterns"""
    analysis_id: str
    feedback_type: str
    total_feedback: int
    average_rating: float
    sentiment_score: float
    common_issues: List[str]
    improvement_suggestions: List[str]
    timestamp: datetime

class FeedbackSystem:
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.feedback_data: List[Feedback] = []
        self.analyses: List[FeedbackAnalysis] = []
        
        # Load existing data
        self._load_data()
    
    def _load_data(self):
        """Load existing feedback and analyses"""
        try:
            # Load feedback
            with open(f'{self.data_dir}/feedback.json', 'r') as f:
                feedback_data = json.load(f)
                for item in feedback_data:
                    feedback = Feedback(**item)
                    feedback.timestamp = datetime.fromisoformat(feedback.timestamp)
                    self.feedback_data.append(feedback)
            
            # Load analyses
            with open(f'{self.data_dir}/feedback_analyses.json', 'r') as f:
                analyses_data = json.load(f)
                for item in analyses_data:
                    analysis = FeedbackAnalysis(**item)
                    analysis.timestamp = datetime.fromisoformat(analysis.timestamp)
                    self.analyses.append(analysis)
                    
        except FileNotFoundError:
            # Files don't exist yet, start fresh
            pass
    
    def _convert_numpy_types(self, obj):
        """Convert numpy types to Python types for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self._convert_numpy_types(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self._convert_numpy_types(item) for item in obj]
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.floating):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        else:
            return obj
    
    def _save_data(self):
        """Save feedback and analyses to files"""
        import os
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Save feedback
        feedback_data = []
        for feedback in self.feedback_data:
            feedback_dict = asdict(feedback)
            feedback_dict['timestamp'] = feedback.timestamp.isoformat()
            # Convert numpy types to Python types for JSON serialization
            feedback_dict = self._convert_numpy_types(feedback_dict)
            feedback_data.append(feedback_dict)
        
        with open(f'{self.data_dir}/feedback.json', 'w') as f:
            json.dump(feedback_data, f, indent=2)
        
        # Save analyses
        analyses_data = []
        for analysis in self.analyses:
            analysis_dict = asdict(analysis)
            analysis_dict['timestamp'] = analysis.timestamp.isoformat()
            # Convert numpy types to Python types for JSON serialization
            analysis_dict = self._convert_numpy_types(analysis_dict)
            analyses_data.append(analysis_dict)
        
        with open(f'{self.data_dir}/feedback_analyses.json', 'w') as f:
            json.dump(analyses_data, f, indent=2)
    
    def submit_feedback(self, 
                       user_id: str,
                       session_id: str,
                       feedback_type: str,
                       rating: int,
                       comment: Optional[str] = None,
                       context: Optional[Dict[str, Any]] = None) -> str:
        """Submit user feedback"""
        
        # Validate rating
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")
        
        # Create feedback
        feedback = Feedback(
            feedback_id=str(uuid.uuid4()),
            user_id=user_id,
            session_id=session_id,
            feedback_type=feedback_type,
            rating=rating,
            comment=comment,
            context=context or {},
            timestamp=datetime.now()
        )
        
        self.feedback_data.append(feedback)
        self._save_data()
        
        return feedback.feedback_id
    
    def get_feedback_summary(self, 
                           feedback_type: Optional[str] = None,
                           days: int = 30) -> Dict[str, Any]:
        """Get feedback summary for analysis"""
        
        # Filter feedback by type and date
        cutoff_date = datetime.now() - timedelta(days=days)
        filtered_feedback = [
            f for f in self.feedback_data 
            if f.timestamp >= cutoff_date and 
            (feedback_type is None or f.feedback_type == feedback_type)
        ]
        
        if not filtered_feedback:
            return {
                'total_feedback': 0,
                'average_rating': 0,
                'rating_distribution': {},
                'feedback_types': {},
                'recent_trends': {}
            }
        
        # Calculate metrics
        ratings = [f.rating for f in filtered_feedback]
        average_rating = np.mean(ratings)
        
        # Rating distribution
        rating_distribution = {}
        for i in range(1, 6):
            rating_distribution[i] = sum(1 for r in ratings if r == i)
        
        # Feedback type distribution
        feedback_types = {}
        for f in filtered_feedback:
            feedback_types[f.feedback_type] = feedback_types.get(f.feedback_type, 0) + 1
        
        # Recent trends (last 7 days)
        recent_cutoff = datetime.now() - timedelta(days=7)
        recent_feedback = [f for f in filtered_feedback if f.timestamp >= recent_cutoff]
        recent_ratings = [f.rating for f in recent_feedback]
        recent_trends = {
            'recent_average': np.mean(recent_ratings) if recent_ratings else 0,
            'recent_count': len(recent_feedback),
            'trend_direction': 'improving' if np.mean(recent_ratings) > average_rating else 'declining'
        }
        
        return {
            'total_feedback': len(filtered_feedback),
            'average_rating': average_rating,
            'rating_distribution': rating_distribution,
            'feedback_types': feedback_types,
            'recent_trends': recent_trends,
            'date_range': {
                'start': cutoff_date.isoformat(),
                'end': datetime.now().isoformat()
            }
        }
    
    def analyze_feedback(self, feedback_type: str) -> FeedbackAnalysis:
        """Analyze feedback patterns and generate insights"""
        
        # Get feedback for the type
        type_feedback = [f for f in self.feedback_data if f.feedback_type == feedback_type]
        
        if not type_feedback:
            return FeedbackAnalysis(
                analysis_id=str(uuid.uuid4()),
                feedback_type=feedback_type,
                total_feedback=0,
                average_rating=0,
                sentiment_score=0,
                common_issues=[],
                improvement_suggestions=[],
                timestamp=datetime.now()
            )
        
        # Calculate metrics
        ratings = [f.rating for f in type_feedback]
        average_rating = np.mean(ratings)
        
        # Simple sentiment analysis based on ratings and comments
        sentiment_score = self._calculate_sentiment_score(type_feedback)
        
        # Identify common issues
        common_issues = self._identify_common_issues(type_feedback)
        
        # Generate improvement suggestions
        improvement_suggestions = self._generate_improvement_suggestions(
            feedback_type, average_rating, common_issues
        )
        
        # Create analysis
        analysis = FeedbackAnalysis(
            analysis_id=str(uuid.uuid4()),
            feedback_type=feedback_type,
            total_feedback=len(type_feedback),
            average_rating=average_rating,
            sentiment_score=sentiment_score,
            common_issues=common_issues,
            improvement_suggestions=improvement_suggestions,
            timestamp=datetime.now()
        )
        
        self.analyses.append(analysis)
        self._save_data()
        
        return analysis
    
    def _calculate_sentiment_score(self, feedback_list: List[Feedback]) -> float:
        """Calculate sentiment score from feedback"""
        if not feedback_list:
            return 0.0
        
        # Base sentiment from ratings (1-5 scale, normalized to -1 to 1)
        rating_sentiment = np.mean([(f.rating - 3) / 2 for f in feedback_list])
        
        # Comment sentiment (simplified keyword-based approach)
        positive_keywords = ['good', 'great', 'excellent', 'helpful', 'useful', 'accurate', 'love', 'amazing']
        negative_keywords = ['bad', 'terrible', 'useless', 'wrong', 'inaccurate', 'hate', 'awful', 'confusing']
        
        comment_sentiment = 0.0
        comment_count = 0
        
        for feedback in feedback_list:
            if feedback.comment:
                comment_lower = feedback.comment.lower()
                positive_count = sum(1 for word in positive_keywords if word in comment_lower)
                negative_count = sum(1 for word in negative_keywords if word in comment_lower)
                
                if positive_count + negative_count > 0:
                    comment_sentiment += (positive_count - negative_count) / (positive_count + negative_count)
                    comment_count += 1
        
        if comment_count > 0:
            comment_sentiment /= comment_count
        
        # Combine rating and comment sentiment
        return (rating_sentiment * 0.7 + comment_sentiment * 0.3)
    
    def _identify_common_issues(self, feedback_list: List[Feedback]) -> List[str]:
        """Identify common issues from feedback"""
        issues = []
        
        # Analyze low ratings
        low_rating_feedback = [f for f in feedback_list if f.rating <= 2]
        
        if len(low_rating_feedback) > len(feedback_list) * 0.2:  # More than 20% low ratings
            issues.append("High number of low ratings")
        
        # Analyze comments for common themes
        comment_themes = {}
        for feedback in feedback_list:
            if feedback.comment:
                comment_lower = feedback.comment.lower()
                
                # Check for common issue themes
                if 'slow' in comment_lower or 'loading' in comment_lower:
                    comment_themes['Performance Issues'] = comment_themes.get('Performance Issues', 0) + 1
                if 'confusing' in comment_lower or 'unclear' in comment_lower:
                    comment_themes['Usability Issues'] = comment_themes.get('Usability Issues', 0) + 1
                if 'wrong' in comment_lower or 'inaccurate' in comment_lower:
                    comment_themes['Accuracy Issues'] = comment_themes.get('Accuracy Issues', 0) + 1
                if 'missing' in comment_lower or 'not found' in comment_lower:
                    comment_themes['Missing Information'] = comment_themes.get('Missing Information', 0) + 1
        
        # Add themes that appear frequently
        for theme, count in comment_themes.items():
            if count >= len(feedback_list) * 0.1:  # Appears in at least 10% of feedback
                issues.append(theme)
        
        return issues
    
    def _generate_improvement_suggestions(self, 
                                        feedback_type: str, 
                                        average_rating: float, 
                                        common_issues: List[str]) -> List[str]:
        """Generate improvement suggestions based on analysis"""
        suggestions = []
        
        # Rating-based suggestions
        if average_rating < 3.0:
            suggestions.append("Overall user satisfaction is low - consider major improvements")
        elif average_rating < 4.0:
            suggestions.append("User satisfaction is moderate - focus on key pain points")
        
        # Issue-based suggestions
        if "Performance Issues" in common_issues:
            suggestions.append("Optimize system performance and reduce loading times")
        
        if "Usability Issues" in common_issues:
            suggestions.append("Improve user interface and user experience design")
        
        if "Accuracy Issues" in common_issues:
            suggestions.append("Enhance recommendation accuracy and data quality")
        
        if "Missing Information" in common_issues:
            suggestions.append("Expand content and information coverage")
        
        # Type-specific suggestions
        if feedback_type == 'recommendation':
            suggestions.extend([
                "Implement more personalized recommendation algorithms",
                "Add more diverse recommendation options",
                "Improve recommendation explanation and reasoning"
            ])
        elif feedback_type == 'quiz':
            suggestions.extend([
                "Optimize quiz questions for better user engagement",
                "Improve quiz result explanations",
                "Add more interactive elements to the quiz"
            ])
        elif feedback_type == 'college':
            suggestions.extend([
                "Enhance college search and filtering capabilities",
                "Add more detailed college information",
                "Improve college comparison features"
            ])
        elif feedback_type == 'career':
            suggestions.extend([
                "Expand career information and pathways",
                "Add more interactive career exploration tools",
                "Improve career guidance and counseling features"
            ])
        
        return suggestions[:5]  # Return top 5 suggestions
    
    def get_improvement_roadmap(self) -> Dict[str, Any]:
        """Get improvement roadmap based on all feedback analyses"""
        if not self.analyses:
            return {
                'priority_areas': [],
                'quick_wins': [],
                'long_term_goals': [],
                'overall_health': 'No data available'
            }
        
        # Calculate overall health
        overall_rating = np.mean([a.average_rating for a in self.analyses])
        overall_sentiment = np.mean([a.sentiment_score for a in self.analyses])
        
        if overall_rating >= 4.0 and overall_sentiment >= 0.5:
            health_status = 'Excellent'
        elif overall_rating >= 3.5 and overall_sentiment >= 0.2:
            health_status = 'Good'
        elif overall_rating >= 3.0 and overall_sentiment >= -0.2:
            health_status = 'Fair'
        else:
            health_status = 'Needs Improvement'
        
        # Identify priority areas (lowest rated feedback types)
        priority_areas = sorted(
            [(a.feedback_type, a.average_rating) for a in self.analyses],
            key=lambda x: x[1]
        )[:3]
        
        # Quick wins (common issues that can be addressed quickly)
        quick_wins = []
        for analysis in self.analyses:
            for issue in analysis.common_issues:
                if issue in ['Performance Issues', 'Usability Issues']:
                    quick_wins.append(f"Fix {issue.lower()} in {analysis.feedback_type}")
        
        # Long-term goals
        long_term_goals = [
            "Implement advanced ML models for better recommendations",
            "Develop comprehensive user personalization system",
            "Build advanced analytics and reporting dashboard",
            "Create mobile app for better accessibility"
        ]
        
        return {
            'priority_areas': [{'type': area[0], 'rating': area[1]} for area in priority_areas],
            'quick_wins': quick_wins[:5],
            'long_term_goals': long_term_goals,
            'overall_health': health_status,
            'overall_rating': overall_rating,
            'overall_sentiment': overall_sentiment
        }
    
    def export_feedback_data(self, format: str = 'json') -> str:
        """Export feedback data for external analysis"""
        if format == 'json':
            feedback_data = []
            for feedback in self.feedback_data:
                feedback_dict = asdict(feedback)
                feedback_dict['timestamp'] = feedback.timestamp.isoformat()
                # Convert numpy types to Python types for JSON serialization
                feedback_dict = self._convert_numpy_types(feedback_dict)
                feedback_data.append(feedback_dict)
            
            filename = f'{self.data_dir}/feedback_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
            with open(filename, 'w') as f:
                json.dump(feedback_data, f, indent=2)
            
            return filename
        
        elif format == 'csv':
            # Convert to DataFrame and export
            feedback_data = []
            for feedback in self.feedback_data:
                feedback_dict = asdict(feedback)
                feedback_dict['timestamp'] = feedback.timestamp.isoformat()
                feedback_data.append(feedback_dict)
            
            df = pd.DataFrame(feedback_data)
            filename = f'{self.data_dir}/feedback_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
            df.to_csv(filename, index=False)
            
            return filename
        
        else:
            raise ValueError("Format must be 'json' or 'csv'")

# Example usage and testing
if __name__ == "__main__":
    # Initialize feedback system
    feedback_system = FeedbackSystem()
    
    # Simulate some feedback
    feedback_types = ['recommendation', 'quiz', 'college', 'career', 'general']
    
    for i in range(50):
        feedback_type = np.random.choice(feedback_types)
        rating = np.random.choice([1, 2, 3, 4, 5], p=[0.1, 0.15, 0.2, 0.35, 0.2])
        
        comments = [
            "Great recommendations!",
            "Very helpful quiz",
            "Could be more accurate",
            "Loading is slow",
            "Missing some information",
            "Excellent user experience",
            "Confusing interface",
            "Love the new features"
        ]
        
        comment = np.random.choice(comments) if np.random.random() < 0.7 else None
        
        feedback_system.submit_feedback(
            user_id=f"user_{i}",
            session_id=f"session_{i}",
            feedback_type=feedback_type,
            rating=rating,
            comment=comment,
            context={'feature': f'feature_{i % 5}'}
        )
    
    # Analyze feedback
    for feedback_type in feedback_types:
        analysis = feedback_system.analyze_feedback(feedback_type)
        print(f"\n{feedback_type.upper()} Analysis:")
        print(f"  Total Feedback: {analysis.total_feedback}")
        print(f"  Average Rating: {analysis.average_rating:.2f}")
        print(f"  Sentiment Score: {analysis.sentiment_score:.2f}")
        print(f"  Common Issues: {analysis.common_issues}")
        print(f"  Suggestions: {analysis.improvement_suggestions[:2]}")
    
    # Get improvement roadmap
    roadmap = feedback_system.get_improvement_roadmap()
    print(f"\nIMPROVEMENT ROADMAP:")
    print(f"  Overall Health: {roadmap['overall_health']}")
    print(f"  Priority Areas: {roadmap['priority_areas']}")
    print(f"  Quick Wins: {roadmap['quick_wins'][:3]}")
    
    # Export data
    json_file = feedback_system.export_feedback_data('json')
    csv_file = feedback_system.export_feedback_data('csv')
    print(f"\nData exported to: {json_file}, {csv_file}")
    
    print("Feedback system demonstration completed!")
