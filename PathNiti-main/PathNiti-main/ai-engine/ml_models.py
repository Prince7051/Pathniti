"""
Advanced ML Models for EduNiti AI Engine
Implements production-ready machine learning models for recommendations
"""

import pandas as pd
import numpy as np
import joblib
import json
from typing import Dict, List, Any, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.model_selection import train_test_split, cross_val_score, GridSearchCV
from sklearn.preprocessing import StandardScaler, LabelEncoder, OneHotEncoder
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_squared_error, r2_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
import warnings
warnings.filterwarnings('ignore')

class AdvancedMLModels:
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.models = {}
        self.scalers = {}
        self.encoders = {}
        self.vectorizers = {}
        self.feature_importance = {}
        self.model_metrics = {}
        
        # Load datasets
        self.colleges_df = pd.read_csv(f'{data_dir}/colleges.csv')
        self.careers_df = pd.read_csv(f'{data_dir}/careers.csv')
        self.students_df = pd.read_csv(f'{data_dir}/student_outcomes.csv')
        
        # Prepare data
        self._prepare_data()
        
    def _prepare_data(self):
        """Prepare and preprocess data for ML models"""
        print("Preparing data for ML models...")
        
        # Prepare student data for stream prediction
        self._prepare_student_data()
        
        # Prepare college data for recommendation
        self._prepare_college_data()
        
        # Prepare career data for recommendation
        self._prepare_career_data()
        
        print("Data preparation completed!")
    
    def _prepare_student_data(self):
        """Prepare student data for stream prediction model"""
        # Convert categorical variables
        self.students_df['gender_encoded'] = LabelEncoder().fit_transform(self.students_df['gender'])
        self.students_df['state_encoded'] = LabelEncoder().fit_transform(self.students_df['state'])
        self.students_df['class_level_encoded'] = LabelEncoder().fit_transform(self.students_df['class_level'])
        self.students_df['parent_education_encoded'] = LabelEncoder().fit_transform(self.students_df['parent_education'])
        
        # Extract features from nested dictionaries
        personality_cols = ['extroversion', 'conscientiousness', 'openness', 'agreeableness', 'neuroticism']
        academic_cols = ['class_10_percentage', 'class_12_percentage', 'entrance_exam_score', 'overall_gpa']
        quiz_cols = ['mathematics', 'science', 'arts', 'commerce', 'problem_solving', 'communication', 'creativity', 'leadership']
        
        # Create feature matrix
        self.student_features = []
        self.student_targets = []
        
        for _, row in self.students_df.iterrows():
            # Basic features
            features = [
                row['age'],
                row['gender_encoded'],
                row['state_encoded'],
                row['class_level_encoded'],
                row['family_income'],
                row['parent_education_encoded']
            ]
            
            # Personality features
            personality = eval(row['personality_traits']) if isinstance(row['personality_traits'], str) else row['personality_traits']
            features.extend([personality[col] for col in personality_cols])
            
            # Academic features
            academic = eval(row['academic_performance']) if isinstance(row['academic_performance'], str) else row['academic_performance']
            features.extend([academic[col] for col in academic_cols])
            
            # Quiz features
            quiz = eval(row['quiz_scores']) if isinstance(row['quiz_scores'], str) else row['quiz_scores']
            features.extend([quiz[col] for col in quiz_cols])
            
            # Interest features (simplified)
            interests = eval(row['interests']) if isinstance(row['interests'], str) else row['interests']
            interest_features = [1 if interest in interests else 0 for interest in ['Mathematics', 'Science', 'Arts', 'Sports', 'Music', 'Technology', 'Business', 'Medicine']]
            features.extend(interest_features)
            
            self.student_features.append(features)
            self.student_targets.append(row['recommended_stream'])
        
        self.student_features = np.array(self.student_features)
        self.student_targets = np.array(self.student_targets)
        
        # Encode target variable
        self.stream_encoder = LabelEncoder()
        self.student_targets_encoded = self.stream_encoder.fit_transform(self.student_targets)
        
        print(f"Student features shape: {self.student_features.shape}")
        print(f"Student targets shape: {self.student_targets_encoded.shape}")
    
    def _prepare_college_data(self):
        """Prepare college data for recommendation"""
        # Convert categorical variables
        self.colleges_df['type_encoded'] = LabelEncoder().fit_transform(self.colleges_df['type'])
        self.colleges_df['state_encoded'] = LabelEncoder().fit_transform(self.colleges_df['state'])
        self.colleges_df['tier_encoded'] = LabelEncoder().fit_transform(self.colleges_df['tier'])
        self.colleges_df['accreditation_encoded'] = LabelEncoder().fit_transform(self.colleges_df['accreditation'])
        
        # Create college feature matrix
        self.college_features = []
        self.college_ids = []
        
        for _, row in self.colleges_df.iterrows():
            features = [
                row['established_year'],
                row['type_encoded'],
                row['state_encoded'],
                row['tier_encoded'],
                row['accreditation_encoded'],
                row['total_students'],
                row['faculty_count'],
                row['campus_size'],
                row['hostel_facility'],
                row['library_books'],
                row['research_centers'],
                row['placement_percentage'],
                row['average_package'],
                row['highest_package'],
                row['fees_range_min'],
                row['fees_range_max'],
                row['alumni_network'],
                row['industry_partnerships'],
                row['research_publications'],
                row['ranking_nirf'] if pd.notna(row['ranking_nirf']) else 0,
                row['ranking_times'] if pd.notna(row['ranking_times']) else 0
            ]
            
            self.college_features.append(features)
            self.college_ids.append(row['id'])
        
        self.college_features = np.array(self.college_features)
        self.college_ids = np.array(self.college_ids)
        
        print(f"College features shape: {self.college_features.shape}")
    
    def _prepare_career_data(self):
        """Prepare career data for recommendation"""
        # Convert categorical variables
        self.careers_df['category_encoded'] = LabelEncoder().fit_transform(self.careers_df['category'])
        self.careers_df['stream_encoded'] = LabelEncoder().fit_transform(self.careers_df['stream'])
        self.careers_df['demand_encoded'] = LabelEncoder().fit_transform(self.careers_df['demand'])
        
        # Create career feature matrix
        self.career_features = []
        self.career_ids = []
        
        for _, row in self.careers_df.iterrows():
            features = [
                row['category_encoded'],
                row['stream_encoded'],
                row['demand_encoded'],
                row['growth_rate'],
                row['avg_salary'],
                row['duration_to_achieve_years'] if 'duration_to_achieve_years' in row else 4,
                row['difficulty_level_encoded'] if 'difficulty_level_encoded' in row else 2,
                row['job_satisfaction'],
                row['work_life_balance'],
                row['stress_level'],
                row['entrepreneurship_potential']
            ]
            
            self.career_features.append(features)
            self.career_ids.append(row['id'])
        
        self.career_features = np.array(self.career_features)
        self.career_ids = np.array(self.career_ids)
        
        print(f"Career features shape: {self.career_features.shape}")
    
    def train_stream_prediction_model(self):
        """Train model to predict suitable stream for students"""
        print("Training stream prediction model...")
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            self.student_features, self.student_targets_encoded, 
            test_size=0.2, random_state=42, stratify=self.student_targets_encoded
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Random Forest model
        rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        rf_model.fit(X_train_scaled, y_train)
        
        # Train Neural Network model
        nn_model = MLPClassifier(
            hidden_layer_sizes=(100, 50),
            activation='relu',
            solver='adam',
            alpha=0.001,
            learning_rate='adaptive',
            max_iter=500,
            random_state=42
        )
        
        nn_model.fit(X_train_scaled, y_train)
        
        # Evaluate models
        rf_pred = rf_model.predict(X_test_scaled)
        nn_pred = nn_model.predict(X_test_scaled)
        
        rf_accuracy = accuracy_score(y_test, rf_pred)
        nn_accuracy = accuracy_score(y_test, nn_pred)
        
        print(f"Random Forest Accuracy: {rf_accuracy:.4f}")
        print(f"Neural Network Accuracy: {nn_accuracy:.4f}")
        
        # Choose best model
        if rf_accuracy >= nn_accuracy:
            best_model = rf_model
            best_accuracy = rf_accuracy
        else:
            best_model = nn_model
            best_accuracy = nn_accuracy
        
        # Store models and metrics
        self.models['stream_prediction'] = best_model
        self.scalers['stream_prediction'] = scaler
        self.model_metrics['stream_prediction'] = {
            'accuracy': best_accuracy,
            'precision': precision_score(y_test, best_model.predict(X_test_scaled), average='weighted'),
            'recall': recall_score(y_test, best_model.predict(X_test_scaled), average='weighted'),
            'f1_score': f1_score(y_test, best_model.predict(X_test_scaled), average='weighted')
        }
        
        # Feature importance
        if hasattr(best_model, 'feature_importances_'):
            self.feature_importance['stream_prediction'] = best_model.feature_importances_
        
        print(f"Stream prediction model trained with accuracy: {best_accuracy:.4f}")
    
    def train_college_recommendation_model(self):
        """Train model for college recommendations"""
        print("Training college recommendation model...")
        
        # Create similarity matrix based on features
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Normalize college features
        scaler = StandardScaler()
        college_features_scaled = scaler.fit_transform(self.college_features)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(college_features_scaled)
        
        # Store for recommendations
        self.models['college_similarity'] = similarity_matrix
        self.scalers['college_features'] = scaler
        
        print("College recommendation model trained!")
    
    def train_career_recommendation_model(self):
        """Train model for career recommendations"""
        print("Training career recommendation model...")
        
        # Create similarity matrix based on features
        from sklearn.metrics.pairwise import cosine_similarity
        
        # Normalize career features
        scaler = StandardScaler()
        career_features_scaled = scaler.fit_transform(self.career_features)
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(career_features_scaled)
        
        # Store for recommendations
        self.models['career_similarity'] = similarity_matrix
        self.scalers['career_features'] = scaler
        
        print("Career recommendation model trained!")
    
    def train_success_prediction_model(self):
        """Train model to predict student success"""
        print("Training success prediction model...")
        
        # Prepare success data
        success_features = []
        success_targets = []
        
        for _, row in self.students_df.iterrows():
            # Features: student characteristics
            features = [
                row['age'],
                row['gender_encoded'],
                row['family_income'],
                row['parent_education_encoded']
            ]
            
            # Add personality traits
            personality = eval(row['personality_traits']) if isinstance(row['personality_traits'], str) else row['personality_traits']
            features.extend([personality[col] for col in ['extroversion', 'conscientiousness', 'openness', 'agreeableness', 'neuroticism']])
            
            # Add academic performance
            academic = eval(row['academic_performance']) if isinstance(row['academic_performance'], str) else row['academic_performance']
            features.extend([academic[col] for col in ['class_10_percentage', 'class_12_percentage', 'entrance_exam_score', 'overall_gpa']])
            
            success_features.append(features)
            
            # Target: success metrics
            success = eval(row['success_metrics']) if isinstance(row['success_metrics'], str) else row['success_metrics']
            success_score = (success['graduation_rate'] + (1 if success['placement_success'] else 0) + 
                           success['job_satisfaction']/5 + success['career_growth']/5) / 4
            success_targets.append(success_score)
        
        success_features = np.array(success_features)
        success_targets = np.array(success_targets)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            success_features, success_targets, test_size=0.2, random_state=42
        )
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = RandomForestRegressor(
            n_estimators=100,
            max_depth=10,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42
        )
        
        model.fit(X_train_scaled, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Success prediction model - MSE: {mse:.4f}, R²: {r2:.4f}")
        
        # Store model
        self.models['success_prediction'] = model
        self.scalers['success_prediction'] = scaler
        self.model_metrics['success_prediction'] = {
            'mse': mse,
            'r2_score': r2
        }
        
        print("Success prediction model trained!")
    
    def train_all_models(self):
        """Train all ML models"""
        print("Training all ML models...")
        
        self.train_stream_prediction_model()
        self.train_college_recommendation_model()
        self.train_career_recommendation_model()
        self.train_success_prediction_model()
        
        print("All models trained successfully!")
    
    def predict_stream(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Predict suitable stream for user"""
        if 'stream_prediction' not in self.models:
            raise ValueError("Stream prediction model not trained")
        
        # Prepare features
        features = self._prepare_user_features(user_profile)
        
        # Scale features
        features_scaled = self.scalers['stream_prediction'].transform([features])
        
        # Predict
        prediction = self.models['stream_prediction'].predict(features_scaled)[0]
        probability = self.models['stream_prediction'].predict_proba(features_scaled)[0]
        
        # Decode prediction
        predicted_stream = self.stream_encoder.inverse_transform([prediction])[0]
        
        # Get confidence
        confidence = max(probability)
        
        return {
            'predicted_stream': predicted_stream,
            'confidence': confidence,
            'all_probabilities': {
                stream: prob for stream, prob in zip(self.stream_encoder.classes_, probability)
            }
        }
    
    def recommend_colleges(self, user_profile: Dict[str, Any], num_recommendations: int = 10) -> List[Dict[str, Any]]:
        """Recommend colleges based on user profile"""
        if 'college_similarity' not in self.models:
            raise ValueError("College recommendation model not trained")
        
        # Find similar colleges based on user preferences
        # This is a simplified approach - in production, you'd use more sophisticated methods
        
        # Filter colleges by user preferences
        filtered_colleges = self.colleges_df.copy()
        
        # Apply filters based on user profile
        if 'location' in user_profile and user_profile['location']:
            state = user_profile['location'].get('state')
            if state:
                filtered_colleges = filtered_colleges[filtered_colleges['state'] == state]
        
        if 'stream' in user_profile and user_profile['stream']:
            # Filter by programs that match the stream
            # This would require more complex logic in production
            pass
        
        # Score colleges based on various factors
        college_scores = []
        for _, college in filtered_colleges.iterrows():
            score = 0
            
            # Rating score
            score += college.get('ranking_nirf', 200) / 200 * 0.3
            
            # Placement score
            score += college.get('placement_percentage', 70) / 100 * 0.3
            
            # Package score
            score += min(college.get('average_package', 500000) / 1000000, 1) * 0.2
            
            # Infrastructure score
            score += min(college.get('campus_size', 50) / 100, 1) * 0.1
            
            # Faculty score
            score += min(college.get('faculty_count', 100) / 500, 1) * 0.1
            
            college_scores.append({
                'college_id': college['id'],
                'name': college['name'],
                'score': score,
                'college_data': college.to_dict()
            })
        
        # Sort by score and return top recommendations
        college_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return college_scores[:num_recommendations]
    
    def recommend_careers(self, user_profile: Dict[str, Any], num_recommendations: int = 10) -> List[Dict[str, Any]]:
        """Recommend careers based on user profile"""
        if 'career_similarity' not in self.models:
            raise ValueError("Career recommendation model not trained")
        
        # Filter careers by user preferences
        filtered_careers = self.careers_df.copy()
        
        if 'stream' in user_profile and user_profile['stream']:
            filtered_careers = filtered_careers[filtered_careers['stream'] == user_profile['stream']]
        
        # Score careers based on various factors
        career_scores = []
        for _, career in filtered_careers.iterrows():
            score = 0
            
            # Growth rate score
            score += career.get('growth_rate', 5) / 15 * 0.3
            
            # Salary score
            score += min(career.get('avg_salary', 500000) / 2000000, 1) * 0.3
            
            # Job satisfaction score
            score += career.get('job_satisfaction', 3) / 5 * 0.2
            
            # Work-life balance score
            score += career.get('work_life_balance', 3) / 5 * 0.1
            
            # Entrepreneurship potential
            score += career.get('entrepreneurship_potential', 3) / 5 * 0.1
            
            career_scores.append({
                'career_id': career['id'],
                'name': career['name'],
                'score': score,
                'career_data': career.to_dict()
            })
        
        # Sort by score and return top recommendations
        career_scores.sort(key=lambda x: x['score'], reverse=True)
        
        return career_scores[:num_recommendations]
    
    def predict_success(self, user_profile: Dict[str, Any]) -> Dict[str, Any]:
        """Predict user's success probability"""
        if 'success_prediction' not in self.models:
            raise ValueError("Success prediction model not trained")
        
        # Prepare features
        features = self._prepare_user_features(user_profile)
        
        # Scale features
        features_scaled = self.scalers['success_prediction'].transform([features])
        
        # Predict
        success_score = self.models['success_prediction'].predict(features_scaled)[0]
        
        return {
            'success_score': success_score,
            'success_level': self._get_success_level(success_score),
            'recommendations': self._get_success_recommendations(success_score)
        }
    
    def _prepare_user_features(self, user_profile: Dict[str, Any]) -> List[float]:
        """Prepare user features for ML models"""
        features = []
        
        # Basic features
        features.append(user_profile.get('age', 20))
        features.append(0 if user_profile.get('gender') == 'Male' else 1)  # Simplified gender encoding
        features.append(0)  # State encoding (simplified)
        features.append(0)  # Class level encoding (simplified)
        features.append(user_profile.get('family_income', 500000))
        features.append(0)  # Parent education encoding (simplified)
        
        # Personality traits (default values)
        features.extend([3.0, 3.0, 3.0, 3.0, 3.0])  # Default personality scores
        
        # Academic performance (default values)
        features.extend([75.0, 75.0, 75.0, 7.5])  # Default academic scores
        
        # Quiz scores
        quiz_scores = user_profile.get('quiz_scores', {})
        quiz_cols = ['mathematics', 'science', 'arts', 'commerce', 'problem_solving', 'communication', 'creativity', 'leadership']
        for col in quiz_cols:
            features.append(quiz_scores.get(col, 5.0))
        
        # Interest features
        interests = user_profile.get('interests', [])
        interest_list = ['Mathematics', 'Science', 'Arts', 'Sports', 'Music', 'Technology', 'Business', 'Medicine']
        for interest in interest_list:
            features.append(1 if interest in interests else 0)
        
        return features
    
    def _get_success_level(self, success_score: float) -> str:
        """Get success level based on score"""
        if success_score >= 0.8:
            return 'Very High'
        elif success_score >= 0.6:
            return 'High'
        elif success_score >= 0.4:
            return 'Medium'
        else:
            return 'Low'
    
    def _get_success_recommendations(self, success_score: float) -> List[str]:
        """Get recommendations based on success score"""
        if success_score >= 0.8:
            return [
                'Excellent potential! Focus on advanced skills and leadership development.',
                'Consider pursuing higher education and research opportunities.',
                'Explore entrepreneurship and innovation opportunities.'
            ]
        elif success_score >= 0.6:
            return [
                'Good potential! Focus on skill development and networking.',
                'Consider internships and practical experience.',
                'Work on communication and soft skills.'
            ]
        elif success_score >= 0.4:
            return [
                'Moderate potential. Focus on foundational skills and education.',
                'Consider vocational training and skill development programs.',
                'Work on improving academic performance and soft skills.'
            ]
        else:
            return [
                'Focus on basic education and skill development.',
                'Consider alternative career paths and vocational training.',
                'Work on improving fundamental skills and confidence.'
            ]
    
    def save_models(self, output_dir: str = 'models'):
        """Save trained models and metadata"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        # Save models
        for model_name, model in self.models.items():
            joblib.dump(model, f'{output_dir}/{model_name}.joblib')
        
        # Save scalers
        for scaler_name, scaler in self.scalers.items():
            joblib.dump(scaler, f'{output_dir}/{scaler_name}_scaler.joblib')
        
        # Save encoders
        for encoder_name, encoder in self.encoders.items():
            joblib.dump(encoder, f'{output_dir}/{encoder_name}_encoder.joblib')
        
        # Save metadata
        metadata = {
            'model_metrics': self.model_metrics,
            'feature_importance': self.feature_importance,
            'stream_classes': self.stream_encoder.classes_.tolist() if hasattr(self, 'stream_encoder') else []
        }
        
        with open(f'{output_dir}/metadata.json', 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print(f"Models saved to {output_dir}/")
    
    def load_models(self, model_dir: str = 'models'):
        """Load trained models and metadata"""
        import os
        
        if not os.path.exists(model_dir):
            raise ValueError(f"Model directory {model_dir} does not exist")
        
        # Load models
        for model_file in os.listdir(model_dir):
            if model_file.endswith('.joblib') and not model_file.endswith('_scaler.joblib') and not model_file.endswith('_encoder.joblib'):
                model_name = model_file.replace('.joblib', '')
                self.models[model_name] = joblib.load(f'{model_dir}/{model_file}')
        
        # Load scalers
        for scaler_file in os.listdir(model_dir):
            if scaler_file.endswith('_scaler.joblib'):
                scaler_name = scaler_file.replace('_scaler.joblib', '')
                self.scalers[scaler_name] = joblib.load(f'{model_dir}/{scaler_file}')
        
        # Load encoders
        for encoder_file in os.listdir(model_dir):
            if encoder_file.endswith('_encoder.joblib'):
                encoder_name = encoder_file.replace('_encoder.joblib', '')
                self.encoders[encoder_name] = joblib.load(f'{model_dir}/{encoder_file}')
        
        # Load metadata
        if os.path.exists(f'{model_dir}/metadata.json'):
            with open(f'{model_dir}/metadata.json', 'r') as f:
                metadata = json.load(f)
                self.model_metrics = metadata.get('model_metrics', {})
                self.feature_importance = metadata.get('feature_importance', {})
                
                # Recreate stream encoder
                if 'stream_classes' in metadata:
                    self.stream_encoder = LabelEncoder()
                    self.stream_encoder.classes_ = np.array(metadata['stream_classes'])
        
        print(f"Models loaded from {model_dir}/")

if __name__ == "__main__":
    # Initialize and train models
    ml_models = AdvancedMLModels()
    ml_models.train_all_models()
    ml_models.save_models()
    
    print("ML models training completed!")

