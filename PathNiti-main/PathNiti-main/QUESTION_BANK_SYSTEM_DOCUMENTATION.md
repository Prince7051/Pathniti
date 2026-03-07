# 📚 Question Bank and Test Generation System

## 🎯 **Overview**

This comprehensive system generates curriculum-aligned question banks and tests for Class 10, 11, and 12 students. It replaces MOOC/mock data with database-driven content and provides intelligent test generation with proper difficulty distribution.

## 🏗️ **System Architecture**

### **Core Components**

1. **Question Generator** (`/src/lib/question-generator.ts`)
   - Generates curriculum-aligned questions for all subjects
   - Supports multiple question types (MCQ, short answer, long answer, numerical, diagram)
   - Implements CBSE-like curriculum structure

2. **Test Generator** (`/src/lib/test-generator.ts`)
   - Creates tests with proper difficulty distribution (40% easy, 40% medium, 20% hard)
   - Supports multiple test types (stream assessment, subject test, practice)
   - Ensures balanced question type distribution

3. **Quality Validator** (`/src/lib/quality-validator.ts`)
   - Validates question quality and test composition
   - Checks grammar, reading level, and pedagogical appropriateness
   - Provides quality scores and improvement suggestions

4. **College Migration Service** (`/src/lib/college-migration.ts`)
   - Replaces mock college data with database-driven content
   - Provides college verification and management

## 📊 **Database Schema**

### **New Tables Created**

```sql
-- Enhanced questions table
CREATE TABLE public.questions (
    question_id UUID PRIMARY KEY,
    grade INTEGER NOT NULL,
    subject subject_type NOT NULL,
    topic TEXT NOT NULL,
    question_type question_type NOT NULL,
    difficulty difficulty_level NOT NULL,
    text TEXT NOT NULL,
    options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT NOT NULL,
    time_seconds INTEGER NOT NULL,
    marks INTEGER NOT NULL,
    tags TEXT[],
    competency_codes TEXT[],
    version INTEGER DEFAULT 1,
    pending_review BOOLEAN DEFAULT TRUE,
    generated_by TEXT DEFAULT 'kiro-auto',
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES public.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT FALSE
);

-- Tests table
CREATE TABLE public.tests (
    test_id UUID PRIMARY KEY,
    student_id UUID REFERENCES public.profiles(id),
    grade INTEGER NOT NULL,
    test_type TEXT NOT NULL,
    questions JSONB NOT NULL,
    total_marks INTEGER NOT NULL,
    time_limit_seconds INTEGER NOT NULL,
    status test_status DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metrics JSONB
);

-- Student responses table
CREATE TABLE public.student_responses (
    id UUID PRIMARY KEY,
    test_id UUID REFERENCES public.tests(test_id),
    student_id UUID REFERENCES public.profiles(id),
    question_id UUID REFERENCES public.questions(question_id),
    answer JSONB NOT NULL,
    is_correct BOOLEAN,
    response_time_seconds INTEGER NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced colleges table
CREATE TABLE public.colleges_enhanced (
    college_id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    streams_offered JSONB NOT NULL,
    admission_criteria TEXT,
    fee_structure JSONB,
    verified BOOLEAN DEFAULT FALSE,
    last_verified_at TIMESTAMP WITH TIME ZONE
);
```

## 🚀 **API Endpoints**

### **Question Management**

#### **Generate Questions**

```http
POST /api/questions/generate
Content-Type: application/json

{
  "grade": 10,
  "subject": "mathematics",
  "count": 20
}
```

#### **Get Questions**

```http
GET /api/questions/generate?grade=10&subject=mathematics&difficulty=medium&limit=50
```

### **Test Generation**

#### **Generate Test**

```http
POST /api/tests/generate
Content-Type: application/json

{
  "student_id": "uuid",
  "grade": 10,
  "test_type": "stream_assessment",
  "subjects": ["mathematics", "science", "english", "social_science"],
  "total_questions": 50,
  "time_limit": 90,
  "difficulty_distribution": {
    "easy": 40,
    "medium": 40,
    "hard": 20
  }
}
```

#### **Submit Test**

```http
POST /api/tests/submit
Content-Type: application/json

{
  "test_id": "uuid",
  "student_id": "uuid",
  "responses": [
    {
      "question_id": "uuid",
      "answer": "option_a",
      "response_time_seconds": 45
    }
  ]
}
```

### **Admin Management**

#### **Approve Questions**

```http
PATCH /api/admin/questions
Content-Type: application/json

{
  "question_id": "uuid",
  "action": "approve",
  "feedback": "Good question"
}
```

#### **Verify Colleges**

```http
PATCH /api/admin/colleges
Content-Type: application/json

{
  "college_id": "uuid",
  "action": "verify",
  "feedback": "Verified information"
}
```

#### **Setup System**

```http
POST /api/admin/setup-system
Content-Type: application/json

{
  "action": "all"
}
```

## 📝 **Question Types Supported**

### **1. MCQ Single Select**

- Single correct answer
- 2-6 options
- Time: 30-60 seconds
- Marks: 1-2

### **2. MCQ Multi Select**

- Multiple correct answers
- 2-6 options
- Time: 60-90 seconds
- Marks: 2-3

### **3. Short Answer**

- 1-3 line responses
- Time: 60-120 seconds
- Marks: 2-3

### **4. Long Answer**

- 4-6 line explanations
- Time: 120-300 seconds
- Marks: 4-6

### **5. Numerical Problems**

- Step-by-step solutions
- Time: 90-180 seconds
- Marks: 3-5

### **6. Diagram/Label**

- Science diagrams
- Time: 120-180 seconds
- Marks: 3-4

## 🎯 **Test Generation Rules**

### **Difficulty Distribution**

- **Easy**: 40% (30-50% range)
- **Medium**: 40% (30-50% range)
- **Hard**: 20% (10-30% range)

### **Question Type Distribution**

- **MCQ Single**: 50%
- **MCQ Multi**: 10%
- **Short Answer**: 20%
- **Long Answer**: 10%
- **Numerical**: 8%
- **Diagram**: 2%

### **Time Allocation**

- **Total Test Time**: 90 minutes (default)
- **Buffer Time**: 20% of calculated time
- **Per Question**: Based on question type and difficulty

## 🔍 **Quality Validation**

### **Question Validation**

- ✅ Text not empty
- ✅ Proper punctuation
- ✅ Appropriate reading level
- ✅ Valid answer format
- ✅ Reasonable time allocation
- ✅ Correct marks allocation

### **Test Validation**

- ✅ Difficulty distribution within limits
- ✅ Question type distribution balanced
- ✅ Total time reasonable
- ✅ Subject coverage appropriate
- ✅ No duplicate questions

## 🏫 **College Data Migration**

### **Replaced Mock Data**

- ❌ Hardcoded college lists in frontend
- ❌ Static college data in components
- ❌ Mock API responses

### **Database-Driven Data**

- ✅ Real college information
- ✅ Verified college data
- ✅ Admin approval workflow
- ✅ College self-update capability

## 🛠️ **Setup Instructions**

### **1. Database Setup**

```bash
# Apply the new schema
psql -d your_database -f src/lib/question-bank-schema.sql
```

### **2. System Initialization**

```bash
# Setup the complete system
curl -X POST http://localhost:3000/api/admin/setup-system \
  -H "Content-Type: application/json" \
  -d '{"action": "all"}'
```

### **3. Generate Sample Questions**

```bash
# Generate questions for Grade 10 Mathematics
curl -X POST http://localhost:3000/api/questions/generate \
  -H "Content-Type: application/json" \
  -d '{"grade": 10, "subject": "mathematics", "count": 50}'
```

## 📈 **Usage Examples**

### **Generate Stream Assessment Test**

```javascript
const response = await fetch("/api/tests/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    student_id: "student-uuid",
    grade: 10,
    test_type: "stream_assessment",
    total_questions: 50,
    time_limit: 90,
  }),
});

const { test } = await response.json();
console.log("Generated test:", test);
```

### **Submit Test Responses**

```javascript
const response = await fetch("/api/tests/submit", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    test_id: "test-uuid",
    student_id: "student-uuid",
    responses: [
      {
        question_id: "question-uuid",
        answer: "option_a",
        response_time_seconds: 45,
      },
    ],
  }),
});

const { metrics } = await response.json();
console.log("Test metrics:", metrics);
```

## 🔒 **Security Features**

### **Row Level Security (RLS)**

- Students can only view their own tests
- Students can only view active questions
- Admins can manage all content
- College admins can update their own college

### **Authentication**

- All admin endpoints require authentication
- Role-based access control
- API key validation for external access

## 📊 **Monitoring and Analytics**

### **Test Metrics**

- Accuracy percentage
- Average response time
- Speed score
- Weighted score
- Subject-wise performance

### **Question Analytics**

- Usage frequency
- Difficulty effectiveness
- Student performance
- Quality scores

## 🚀 **Future Enhancements**

1. **AI-Powered Question Generation**
   - GPT integration for dynamic question creation
   - Adaptive difficulty based on student performance

2. **Advanced Analytics**
   - Learning outcome tracking
   - Competency-based assessment
   - Predictive analytics for stream recommendation

3. **Multi-Language Support**
   - Regional language questions
   - Bilingual test options

4. **Mobile Optimization**
   - Offline test capability
   - Mobile-friendly interface

## 🐛 **Troubleshooting**

### **Common Issues**

1. **No Questions Found**
   - Ensure questions are generated and approved
   - Check grade and subject parameters
   - Verify database connection

2. **Test Generation Fails**
   - Check if enough questions exist
   - Verify student exists in database
   - Check difficulty distribution parameters

3. **Quality Validation Errors**
   - Review question text for clarity
   - Check answer format correctness
   - Verify time and marks allocation

## 📞 **Support**

For technical support or questions about the system:

- Check the API documentation
- Review the database schema
- Test with sample data first
- Use the admin setup endpoint for initialization

---

**System Status**: ✅ Production Ready  
**Last Updated**: September 2024  
**Version**: 1.0.0
