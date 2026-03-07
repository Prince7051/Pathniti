"""
A/B Testing Framework for EduNiti AI Engine
Implements A/B testing for recommendation effectiveness
"""

import json
import random
import time
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from dataclasses import dataclass, asdict
import uuid

@dataclass
class ABTest:
    """A/B Test configuration"""
    test_id: str
    name: str
    description: str
    variants: List[Dict[str, Any]]
    traffic_split: List[float]  # Should sum to 1.0
    start_date: datetime
    end_date: datetime
    status: str  # 'draft', 'running', 'paused', 'completed'
    metrics: List[str]
    success_criteria: Dict[str, float]
    created_at: datetime
    updated_at: datetime

@dataclass
class TestResult:
    """Individual test result"""
    result_id: str
    test_id: str
    user_id: str
    variant: str
    timestamp: datetime
    metrics: Dict[str, float]
    user_profile: Dict[str, Any]
    recommendation_data: Dict[str, Any]

class ABTestingFramework:
    def __init__(self, data_dir: str = 'data'):
        self.data_dir = data_dir
        self.tests: Dict[str, ABTest] = {}
        self.results: List[TestResult] = []
        self.user_assignments: Dict[str, str] = {}  # user_id -> variant
        
        # Load existing data
        self._load_data()
    
    def _load_data(self):
        """Load existing tests and results"""
        try:
            # Load tests
            with open(f'{self.data_dir}/ab_tests.json', 'r') as f:
                tests_data = json.load(f)
                for test_data in tests_data:
                    test = ABTest(**test_data)
                    test.start_date = datetime.fromisoformat(test.start_date)
                    test.end_date = datetime.fromisoformat(test.end_date)
                    test.created_at = datetime.fromisoformat(test.created_at)
                    test.updated_at = datetime.fromisoformat(test.updated_at)
                    self.tests[test.test_id] = test
            
            # Load results
            with open(f'{self.data_dir}/ab_results.json', 'r') as f:
                results_data = json.load(f)
                for result_data in results_data:
                    result = TestResult(**result_data)
                    result.timestamp = datetime.fromisoformat(result.timestamp)
                    self.results.append(result)
            
            # Load user assignments
            with open(f'{self.data_dir}/user_assignments.json', 'r') as f:
                self.user_assignments = json.load(f)
                
        except FileNotFoundError:
            # Files don't exist yet, start fresh
            pass
    
    def _save_data(self):
        """Save tests and results to files"""
        import os
        os.makedirs(self.data_dir, exist_ok=True)
        
        # Save tests
        tests_data = []
        for test in self.tests.values():
            test_dict = asdict(test)
            test_dict['start_date'] = test.start_date.isoformat()
            test_dict['end_date'] = test.end_date.isoformat()
            test_dict['created_at'] = test.created_at.isoformat()
            test_dict['updated_at'] = test.updated_at.isoformat()
            tests_data.append(test_dict)
        
        with open(f'{self.data_dir}/ab_tests.json', 'w') as f:
            json.dump(tests_data, f, indent=2)
        
        # Save results
        results_data = []
        for result in self.results:
            result_dict = asdict(result)
            result_dict['timestamp'] = result.timestamp.isoformat()
            results_data.append(result_dict)
        
        with open(f'{self.data_dir}/ab_results.json', 'w') as f:
            json.dump(results_data, f, indent=2)
        
        # Save user assignments
        with open(f'{self.data_dir}/user_assignments.json', 'w') as f:
            json.dump(self.user_assignments, f, indent=2)
    
    def create_test(self, 
                   name: str,
                   description: str,
                   variants: List[Dict[str, Any]],
                   traffic_split: List[float],
                   duration_days: int,
                   metrics: List[str],
                   success_criteria: Dict[str, float]) -> str:
        """Create a new A/B test"""
        
        # Validate inputs
        if abs(sum(traffic_split) - 1.0) > 0.01:
            raise ValueError("Traffic split must sum to 1.0")
        
        if len(variants) != len(traffic_split):
            raise ValueError("Number of variants must match traffic split length")
        
        # Create test
        test_id = str(uuid.uuid4())
        now = datetime.now()
        
        test = ABTest(
            test_id=test_id,
            name=name,
            description=description,
            variants=variants,
            traffic_split=traffic_split,
            start_date=now,
            end_date=now + timedelta(days=duration_days),
            status='draft',
            metrics=metrics,
            success_criteria=success_criteria,
            created_at=now,
            updated_at=now
        )
        
        self.tests[test_id] = test
        self._save_data()
        
        return test_id
    
    def start_test(self, test_id: str):
        """Start an A/B test"""
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.tests[test_id]
        if test.status != 'draft':
            raise ValueError(f"Test {test_id} is not in draft status")
        
        test.status = 'running'
        test.start_date = datetime.now()
        test.updated_at = datetime.now()
        
        self._save_data()
        print(f"Test {test_id} started successfully!")
    
    def assign_user_to_variant(self, user_id: str, test_id: str) -> str:
        """Assign user to a test variant"""
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.tests[test_id]
        if test.status != 'running':
            raise ValueError(f"Test {test_id} is not running")
        
        # Check if user is already assigned
        assignment_key = f"{user_id}_{test_id}"
        if assignment_key in self.user_assignments:
            return self.user_assignments[assignment_key]
        
        # Assign user to variant based on traffic split
        rand = random.random()
        cumulative = 0
        variant_index = 0
        
        for i, split in enumerate(test.traffic_split):
            cumulative += split
            if rand <= cumulative:
                variant_index = i
                break
        
        variant = test.variants[variant_index]['name']
        self.user_assignments[assignment_key] = variant
        
        self._save_data()
        return variant
    
    def record_result(self, 
                     test_id: str,
                     user_id: str,
                     metrics: Dict[str, float],
                     user_profile: Dict[str, Any],
                     recommendation_data: Dict[str, Any]):
        """Record a test result"""
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        # Get user's assigned variant
        assignment_key = f"{user_id}_{test_id}"
        if assignment_key not in self.user_assignments:
            raise ValueError(f"User {user_id} not assigned to test {test_id}")
        
        variant = self.user_assignments[assignment_key]
        
        # Create result
        result = TestResult(
            result_id=str(uuid.uuid4()),
            test_id=test_id,
            user_id=user_id,
            variant=variant,
            timestamp=datetime.now(),
            metrics=metrics,
            user_profile=user_profile,
            recommendation_data=recommendation_data
        )
        
        self.results.append(result)
        self._save_data()
    
    def get_test_results(self, test_id: str) -> Dict[str, Any]:
        """Get aggregated results for a test"""
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.tests[test_id]
        test_results = [r for r in self.results if r.test_id == test_id]
        
        if not test_results:
            return {
                'test_id': test_id,
                'status': test.status,
                'total_users': 0,
                'variants': {}
            }
        
        # Group results by variant
        variant_results = {}
        for variant in test.variants:
            variant_name = variant['name']
            variant_data = [r for r in test_results if r.variant == variant_name]
            
            if variant_data:
                # Calculate metrics
                metrics_summary = {}
                for metric in test.metrics:
                    values = [r.metrics.get(metric, 0) for r in variant_data]
                    metrics_summary[metric] = {
                        'mean': np.mean(values),
                        'std': np.std(values),
                        'count': len(values),
                        'min': np.min(values),
                        'max': np.max(values)
                    }
                
                variant_results[variant_name] = {
                    'user_count': len(variant_data),
                    'metrics': metrics_summary
                }
            else:
                variant_results[variant_name] = {
                    'user_count': 0,
                    'metrics': {}
                }
        
        return {
            'test_id': test_id,
            'status': test.status,
            'total_users': len(test_results),
            'variants': variant_results,
            'success_criteria': test.success_criteria
        }
    
    def analyze_test(self, test_id: str) -> Dict[str, Any]:
        """Analyze test results and determine winner"""
        results = self.get_test_results(test_id)
        
        if results['total_users'] == 0:
            return {
                'test_id': test_id,
                'status': 'insufficient_data',
                'winner': None,
                'confidence': 0,
                'analysis': 'No data available for analysis'
            }
        
        test = self.tests[test_id]
        variants = list(results['variants'].keys())
        
        if len(variants) < 2:
            return {
                'test_id': test_id,
                'status': 'insufficient_variants',
                'winner': None,
                'confidence': 0,
                'analysis': 'Need at least 2 variants for comparison'
            }
        
        # Simple analysis - compare primary metric
        primary_metric = test.metrics[0] if test.metrics else 'click_through_rate'
        
        variant_scores = {}
        for variant_name, variant_data in results['variants'].items():
            if primary_metric in variant_data['metrics']:
                variant_scores[variant_name] = variant_data['metrics'][primary_metric]['mean']
            else:
                variant_scores[variant_name] = 0
        
        # Find winner
        winner = max(variant_scores, key=variant_scores.get)
        winner_score = variant_scores[winner]
        
        # Calculate confidence (simplified)
        total_users = results['total_users']
        confidence = min(0.95, 0.5 + (total_users / 1000) * 0.45)
        
        # Check if winner meets success criteria
        success_threshold = test.success_criteria.get(primary_metric, 0)
        meets_criteria = winner_score >= success_threshold
        
        return {
            'test_id': test_id,
            'status': 'completed' if meets_criteria else 'inconclusive',
            'winner': winner if meets_criteria else None,
            'confidence': confidence,
            'variant_scores': variant_scores,
            'analysis': f"Winner: {winner} with {primary_metric}: {winner_score:.4f}" if meets_criteria else f"No variant met success criteria. Best: {winner} with {primary_metric}: {winner_score:.4f}"
        }
    
    def create_recommendation_test(self) -> str:
        """Create a test for recommendation algorithms"""
        variants = [
            {
                'name': 'baseline',
                'description': 'Current recommendation algorithm',
                'algorithm': 'rule_based',
                'parameters': {}
            },
            {
                'name': 'ml_enhanced',
                'description': 'ML-enhanced recommendation algorithm',
                'algorithm': 'ml_based',
                'parameters': {
                    'use_ml': True,
                    'confidence_threshold': 0.7
                }
            },
            {
                'name': 'hybrid',
                'description': 'Hybrid approach combining rules and ML',
                'algorithm': 'hybrid',
                'parameters': {
                    'ml_weight': 0.6,
                    'rule_weight': 0.4
                }
            }
        ]
        
        traffic_split = [0.4, 0.3, 0.3]  # 40% baseline, 30% each for new variants
        
        metrics = [
            'click_through_rate',
            'conversion_rate',
            'user_satisfaction',
            'recommendation_accuracy',
            'time_spent'
        ]
        
        success_criteria = {
            'click_through_rate': 0.15,  # 15% CTR
            'user_satisfaction': 4.0,    # 4.0/5.0 satisfaction
            'recommendation_accuracy': 0.8  # 80% accuracy
        }
        
        return self.create_test(
            name="Recommendation Algorithm Test",
            description="Test different recommendation algorithms to improve user engagement",
            variants=variants,
            traffic_split=traffic_split,
            duration_days=30,
            metrics=metrics,
            success_criteria=success_criteria
        )
    
    def create_ui_test(self) -> str:
        """Create a test for UI variations"""
        variants = [
            {
                'name': 'current_ui',
                'description': 'Current user interface',
                'layout': 'standard',
                'features': ['basic_search', 'filters']
            },
            {
                'name': 'enhanced_ui',
                'description': 'Enhanced UI with better visualizations',
                'layout': 'enhanced',
                'features': ['advanced_search', 'filters', 'visualizations', 'recommendations']
            }
        ]
        
        traffic_split = [0.5, 0.5]
        
        metrics = [
            'page_views',
            'time_on_page',
            'bounce_rate',
            'user_engagement',
            'feature_usage'
        ]
        
        success_criteria = {
            'time_on_page': 120,  # 2 minutes
            'user_engagement': 0.7,  # 70% engagement
            'bounce_rate': 0.3  # 30% bounce rate (lower is better)
        }
        
        return self.create_test(
            name="UI Enhancement Test",
            description="Test enhanced UI to improve user engagement",
            variants=variants,
            traffic_split=traffic_split,
            duration_days=14,
            metrics=metrics,
            success_criteria=success_criteria
        )
    
    def get_all_tests(self) -> List[Dict[str, Any]]:
        """Get all tests with their status"""
        tests_list = []
        for test in self.tests.values():
            test_dict = asdict(test)
            test_dict['start_date'] = test.start_date.isoformat()
            test_dict['end_date'] = test.end_date.isoformat()
            test_dict['created_at'] = test.created_at.isoformat()
            test_dict['updated_at'] = test.updated_at.isoformat()
            tests_list.append(test_dict)
        
        return tests_list
    
    def stop_test(self, test_id: str):
        """Stop a running test"""
        if test_id not in self.tests:
            raise ValueError(f"Test {test_id} not found")
        
        test = self.tests[test_id]
        if test.status != 'running':
            raise ValueError(f"Test {test_id} is not running")
        
        test.status = 'completed'
        test.end_date = datetime.now()
        test.updated_at = datetime.now()
        
        self._save_data()
        print(f"Test {test_id} stopped successfully!")

# Example usage and testing
if __name__ == "__main__":
    # Initialize A/B testing framework
    ab_framework = ABTestingFramework()
    
    # Create recommendation algorithm test
    test_id = ab_framework.create_recommendation_test()
    print(f"Created recommendation test: {test_id}")
    
    # Start the test
    ab_framework.start_test(test_id)
    
    # Simulate some test results
    for i in range(100):
        user_id = f"user_{i}"
        variant = ab_framework.assign_user_to_variant(user_id, test_id)
        
        # Simulate metrics based on variant
        if variant == 'baseline':
            metrics = {
                'click_through_rate': random.uniform(0.1, 0.2),
                'conversion_rate': random.uniform(0.05, 0.15),
                'user_satisfaction': random.uniform(3.5, 4.5),
                'recommendation_accuracy': random.uniform(0.6, 0.8),
                'time_spent': random.uniform(60, 180)
            }
        elif variant == 'ml_enhanced':
            metrics = {
                'click_through_rate': random.uniform(0.15, 0.25),
                'conversion_rate': random.uniform(0.08, 0.18),
                'user_satisfaction': random.uniform(4.0, 4.8),
                'recommendation_accuracy': random.uniform(0.7, 0.9),
                'time_spent': random.uniform(90, 200)
            }
        else:  # hybrid
            metrics = {
                'click_through_rate': random.uniform(0.12, 0.22),
                'conversion_rate': random.uniform(0.06, 0.16),
                'user_satisfaction': random.uniform(3.8, 4.6),
                'recommendation_accuracy': random.uniform(0.65, 0.85),
                'time_spent': random.uniform(75, 190)
            }
        
        ab_framework.record_result(
            test_id=test_id,
            user_id=user_id,
            metrics=metrics,
            user_profile={'age': random.randint(16, 25), 'interests': ['technology']},
            recommendation_data={'recommendations': ['Software Engineer', 'Data Scientist']}
        )
    
    # Analyze the test
    analysis = ab_framework.analyze_test(test_id)
    print(f"Test Analysis: {analysis}")
    
    # Get test results
    results = ab_framework.get_test_results(test_id)
    print(f"Test Results: {json.dumps(results, indent=2)}")
    
    print("A/B Testing framework demonstration completed!")

