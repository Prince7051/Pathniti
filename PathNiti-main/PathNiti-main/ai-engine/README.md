# EduNiti AI Recommendation Engine

AI-powered backend service for personalized career and education recommendations.

## Features

- **Stream Recommendations**: AI-powered suggestions for academic streams based on interests and aptitude
- **College Matching**: Location and profile-based college recommendations
- **Career Pathways**: Detailed career progression recommendations
- **Quiz Analysis**: Intelligent analysis of aptitude test results
- **Real-time Processing**: Fast API responses with confidence scoring

## Tech Stack

- **FastAPI**: Modern Python web framework
- **Scikit-learn**: Machine learning algorithms
- **Pandas**: Data manipulation and analysis
- **NumPy**: Numerical computing
- **Supabase**: Database integration

## Setup

1. **Install Dependencies**

   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Configuration**

   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

3. **Run the Server**

   ```bash
   python main.py
   ```

   Or with uvicorn:

   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

### Health Check

- `GET /` - Basic health check
- `GET /health` - Detailed health status

### Recommendations

- `POST /recommendations/stream` - Get stream recommendations
- `POST /recommendations/college` - Get college recommendations
- `POST /recommendations/career` - Get career recommendations
- `POST /recommendations/quiz` - Process quiz results

## API Documentation

Once running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Development

The AI engine uses machine learning algorithms to provide personalized recommendations:

1. **TF-IDF Vectorization**: For text-based interest matching
2. **Cosine Similarity**: For finding similar profiles and preferences
3. **K-Means Clustering**: For grouping similar users and recommendations
4. **Confidence Scoring**: For recommendation reliability

## Deployment

The AI engine can be deployed to:

- **AWS Lambda**: Serverless deployment
- **Google Cloud Run**: Containerized deployment
- **Docker**: Container deployment
- **Heroku**: Platform-as-a-Service

## Integration

The AI engine integrates with the main EduNiti frontend through REST APIs. Make sure to configure CORS origins in the environment variables.
