import { createServiceClient } from "./supabase/service";
import { v4 as uuidv4 } from "uuid";

// Types for question generation
export interface QuestionTemplate {
  question_id: string;
  grade: number;
  subject: string;
  topic: string;
  question_type:
    | "mcq_single"
    | "mcq_multi"
    | "short"
    | "long"
    | "numerical"
    | "diagram";
  difficulty: "easy" | "medium" | "hard";
  text: string;
  options?: string[];
  correct_answer: string | string[];
  explanation: string;
  time_seconds: number;
  marks: number;
  tags: string[];
  competency_codes: string[];
  version: number;
  pending_review: boolean;
  generated_by: string;
  generated_at: string;
}

export interface TestTemplate {
  test_id: string;
  student_id: string;
  grade: number;
  test_type: string;
  questions: string[];
  total_marks: number;
  time_limit_seconds: number;
  created_at: string;
}

// Curriculum topics for CBSE-like structure
const CURRICULUM_TOPICS = {
  10: {
    mathematics: [
      "Real Numbers",
      "Polynomials",
      "Pair of Linear Equations",
      "Quadratic Equations",
      "Arithmetic Progressions",
      "Triangles",
      "Coordinate Geometry",
      "Introduction to Trigonometry",
      "Some Applications of Trigonometry",
      "Circles",
      "Constructions",
      "Areas Related to Circles",
      "Surface Areas and Volumes",
      "Statistics",
      "Probability",
    ],
    science: [
      "Light - Reflection and Refraction",
      "Human Eye and Colourful World",
      "Electricity",
      "Magnetic Effects of Electric Current",
      "Sources of Energy",
      "Life Processes",
      "Control and Coordination",
      "How do Organisms Reproduce",
      "Heredity and Evolution",
      "Natural Resources",
      "Our Environment",
      "Management of Natural Resources",
    ],
    english: [
      "Reading Comprehension",
      "Writing Skills",
      "Grammar",
      "Literature",
      "Poetry Analysis",
      "Prose Analysis",
      "Vocabulary",
      "Communication Skills",
    ],
    social_science: [
      "Nationalism in India",
      "The Making of a Global World",
      "The Age of Industrialisation",
      "Print Culture and the Modern World",
      "Resources and Development",
      "Water Resources",
      "Agriculture",
      "Minerals and Energy Resources",
      "Manufacturing Industries",
      "Lifelines of National Economy",
      "Power Sharing",
      "Federalism",
      "Democracy and Diversity",
      "Gender Religion and Caste",
      "Popular Struggles and Movements",
      "Political Parties",
      "Outcomes of Democracy",
      "Challenges to Democracy",
    ],
  },
  11: {
    mathematics: [
      "Sets",
      "Relations and Functions",
      "Trigonometric Functions",
      "Principle of Mathematical Induction",
      "Complex Numbers and Quadratic Equations",
      "Linear Inequalities",
      "Permutations and Combinations",
      "Binomial Theorem",
      "Sequences and Series",
      "Straight Lines",
      "Conic Sections",
      "Introduction to Three Dimensional Geometry",
      "Limits and Derivatives",
      "Mathematical Reasoning",
      "Statistics",
      "Probability",
    ],
    science: [
      "Physical World",
      "Units and Measurements",
      "Motion in a Straight Line",
      "Motion in a Plane",
      "Laws of Motion",
      "Work, Energy and Power",
      "System of Particles and Rotational Motion",
      "Gravitation",
      "Mechanical Properties of Solids",
      "Mechanical Properties of Fluids",
      "Thermal Properties of Matter",
      "Thermodynamics",
      "Kinetic Theory",
      "Oscillations",
      "Waves",
    ],
    english: [
      "Reading Comprehension",
      "Writing Skills",
      "Grammar",
      "Literature",
      "Poetry Analysis",
      "Prose Analysis",
      "Vocabulary",
      "Communication Skills",
    ],
    social_science: [
      "From the Beginning of Time",
      "Writing and City Life",
      "An Empire Across Three Continents",
      "The Central Islamic Lands",
      "Nomadic Empires",
      "The Three Orders",
      "Changing Cultural Traditions",
      "Confrontation of Cultures",
      "The Industrial Revolution",
      "Displacing Indigenous Peoples",
      "Paths to Modernisation",
      "The Constitution: Why and How?",
      "Rights in the Indian Constitution",
      "Election and Representation",
      "Executive",
      "Legislature",
      "Judiciary",
      "Federalism",
      "Local Governments",
      "Constitution as a Living Document",
      "The Philosophy of the Constitution",
    ],
  },
  12: {
    mathematics: [
      "Relations and Functions",
      "Inverse Trigonometric Functions",
      "Matrices",
      "Determinants",
      "Continuity and Differentiability",
      "Application of Derivatives",
      "Integrals",
      "Application of Integrals",
      "Differential Equations",
      "Vector Algebra",
      "Three Dimensional Geometry",
      "Linear Programming",
      "Probability",
    ],
    science: [
      "Electric Charges and Fields",
      "Electrostatic Potential and Capacitance",
      "Current Electricity",
      "Moving Charges and Magnetism",
      "Magnetism and Matter",
      "Electromagnetic Induction",
      "Alternating Current",
      "Electromagnetic Waves",
      "Ray Optics and Optical Instruments",
      "Wave Optics",
      "Dual Nature of Radiation and Matter",
      "Atoms",
      "Nuclei",
      "Semiconductor Electronics",
    ],
    english: [
      "Reading Comprehension",
      "Writing Skills",
      "Grammar",
      "Literature",
      "Poetry Analysis",
      "Prose Analysis",
      "Vocabulary",
      "Communication Skills",
    ],
    social_science: [
      "Bricks, Beads and Bones",
      "Kings, Farmers and Towns",
      "Kinship, Caste and Class",
      "Thinkers, Beliefs and Buildings",
      "Through the Eyes of Travellers",
      "Bhakti-Sufi Traditions",
      "An Imperial Capital: Vijayanagara",
      "Peasants, Zamindars and the State",
      "Kings and Chronicles",
      "Colonialism and the Countryside",
      "Rebels and the Raj",
      "Colonial Cities",
      "Mahatma Gandhi and the Nationalist Movement",
      "Understanding Partition",
      "Framing the Constitution",
      "The Cold War Era",
      "The End of Bipolarity",
      "US Hegemony in World Politics",
      "Alternative Centres of Power",
      "Contemporary South Asia",
      "International Organisations",
      "Security in Contemporary World",
      "Environment and Natural Resources",
      "Globalisation",
      "Challenges of Nation Building",
      "Era of One Party Dominance",
      "Politics of Planned Development",
      "India's External Relations",
      "Challenges to and Restoration of the Congress System",
      "The Crisis of Democratic Order",
      "Rise of Popular Movements",
      "Regional Aspirations",
      "Recent Developments in Indian Politics",
    ],
  },
};

export class QuestionGenerator {
  private supabase: ReturnType<typeof createServiceClient>;

  constructor() {
    this.supabase = createServiceClient();
  }

  // Generate questions for a specific grade and subject
  async generateQuestionsForSubject(
    grade: number,
    subject: string,
    count: number = 10,
  ): Promise<QuestionTemplate[]> {
    const topics =
      CURRICULUM_TOPICS[grade as keyof typeof CURRICULUM_TOPICS]?.[
        subject as keyof (typeof CURRICULUM_TOPICS)[10]
      ];

    if (!topics) {
      throw new Error(
        `No topics found for grade ${grade} and subject ${subject}`,
      );
    }

    const questions: QuestionTemplate[] = [];
    const difficulties: ("easy" | "medium" | "hard")[] = [
      "easy",
      "medium",
      "hard",
    ];

    for (let i = 0; i < count; i++) {
      const topic = topics[Math.floor(Math.random() * topics.length)];
      const difficulty =
        difficulties[Math.floor(Math.random() * difficulties.length)];
      const questionType = this.getRandomQuestionType(subject);

      const question = await this.generateSingleQuestion(
        grade,
        subject,
        topic,
        difficulty,
        questionType,
      );

      questions.push(question);
    }

    return questions;
  }

  // Generate a single question
  private async generateSingleQuestion(
    grade: number,
    subject: string,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
    questionType: string,
  ): Promise<QuestionTemplate> {
    const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();

    // Generate question based on subject and type
    let questionData: Partial<QuestionTemplate>;

    switch (subject) {
      case "mathematics":
        questionData = this.generateMathQuestion(
          grade,
          topic,
          difficulty,
        );
        break;
      case "science":
        questionData = this.generateScienceQuestion(
          grade,
          topic,
          difficulty,
        );
        break;
      case "english":
        questionData = this.generateEnglishQuestion(
          grade,
          topic,
          difficulty,
        );
        break;
      case "social_science":
        questionData = this.generateSocialScienceQuestion(
          grade,
          topic,
          difficulty,
        );
        break;
      default:
        throw new Error(`Unsupported subject: ${subject}`);
    }

    return {
      question_id: questionId,
      grade,
      subject,
      topic,
      question_type: questionType as "mcq_single" | "mcq_multi" | "short" | "long" | "numerical" | "diagram",
      difficulty,
      text: questionData.text!,
      options: questionData.options,
      correct_answer: questionData.correct_answer!,
      explanation: questionData.explanation!,
      time_seconds: questionData.time_seconds!,
      marks: questionData.marks!,
      tags: questionData.tags!,
      competency_codes: questionData.competency_codes!,
      version: 1,
      pending_review: true,
      generated_by: "sarthi-auto",
      generated_at: now,
    };
  }

  // Generate mathematics questions
  private generateMathQuestion(
    grade: number,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
  ): Partial<QuestionTemplate> {
    const questions = {
      "Quadratic Equations": {
        easy: {
          text: "Solve the quadratic equation x² - 5x + 6 = 0",
          options: ["x = 2, 3", "x = 1, 6", "x = -2, -3", "x = 0, 5"],
          correct_answer: "x = 2, 3",
          explanation: "Factorizing: (x-2)(x-3) = 0, so x = 2 or x = 3",
          time_seconds: 90,
          marks: 2,
        },
        medium: {
          text: "Find the discriminant of the quadratic equation 2x² - 7x + 3 = 0 and determine the nature of roots",
          options: [
            "D = 25, Real and equal",
            "D = 25, Real and distinct",
            "D = 49, Real and equal",
            "D = 49, Real and distinct",
          ],
          correct_answer: "D = 25, Real and distinct",
          explanation:
            "Discriminant D = b² - 4ac = 49 - 24 = 25. Since D > 0, roots are real and distinct",
          time_seconds: 120,
          marks: 3,
        },
        hard: {
          text: "If α and β are roots of x² - 6x + 8 = 0, find the equation whose roots are α² and β²",
          options: [
            "x² - 20x + 64 = 0",
            "x² - 36x + 64 = 0",
            "x² - 20x + 16 = 0",
            "x² - 36x + 16 = 0",
          ],
          correct_answer: "x² - 20x + 64 = 0",
          explanation:
            "α + β = 6, αβ = 8. For new equation: sum = α² + β² = (α+β)² - 2αβ = 36 - 16 = 20, product = α²β² = 64",
          time_seconds: 180,
          marks: 4,
        },
      },
      Triangles: {
        easy: {
          text: "In a right-angled triangle, if one angle is 30°, what is the measure of the other acute angle?",
          options: ["60°", "45°", "90°", "120°"],
          correct_answer: "60°",
          explanation:
            "In a right triangle, sum of acute angles is 90°. So 90° - 30° = 60°",
          time_seconds: 60,
          marks: 1,
        },
      },
    };

    const topicQuestions = questions[topic as keyof typeof questions] as Record<string, unknown>;
    if (!topicQuestions || !topicQuestions[difficulty]) {
      // Fallback question
      return {
        text: `Solve a ${difficulty} level problem related to ${topic}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "Option A",
        explanation: `This is a ${difficulty} level question about ${topic}`,
        time_seconds: 120,
        marks: 2,
        tags: [topic.toLowerCase().replace(/\s+/g, "_")],
        competency_codes: [
          `MATH_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
        ],
      };
    }

    const question = topicQuestions[difficulty] as Record<string, unknown>;
    return {
      ...question,
      tags: [topic.toLowerCase().replace(/\s+/g, "_"), difficulty],
      competency_codes: [
        `MATH_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
      ],
    };
  }

  // Generate science questions
  private generateScienceQuestion(
    grade: number,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
  ): Partial<QuestionTemplate> {
    const questions = {
      "Light - Reflection and Refraction": {
        easy: {
          text: "What is the law of reflection?",
          options: [
            "Angle of incidence = Angle of reflection",
            "Angle of incidence = 2 × Angle of reflection",
            "Angle of reflection = 2 × Angle of incidence",
            "Both angles are always 90°",
          ],
          correct_answer: "Angle of incidence = Angle of reflection",
          explanation:
            "The law of reflection states that the angle of incidence is equal to the angle of reflection",
          time_seconds: 60,
          marks: 1,
        },
        medium: {
          text: "A ray of light passes from air to glass. What happens to its speed and direction?",
          options: [
            "Speed decreases, bends towards normal",
            "Speed increases, bends away from normal",
            "Speed decreases, bends away from normal",
            "Speed increases, bends towards normal",
          ],
          correct_answer: "Speed decreases, bends towards normal",
          explanation:
            "When light enters a denser medium (glass), its speed decreases and it bends towards the normal",
          time_seconds: 90,
          marks: 2,
        },
      },
    };

    const topicQuestions = questions[topic as keyof typeof questions] as Record<string, unknown>;
    if (!topicQuestions || !topicQuestions[difficulty]) {
      return {
        text: `Explain a ${difficulty} level concept related to ${topic}`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        correct_answer: "Option A",
        explanation: `This is a ${difficulty} level question about ${topic}`,
        time_seconds: 120,
        marks: 2,
        tags: [topic.toLowerCase().replace(/\s+/g, "_")],
        competency_codes: [
          `SCIENCE_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
        ],
      };
    }

    const question = topicQuestions[difficulty] as Record<string, unknown>;
    return {
      ...question,
      tags: [topic.toLowerCase().replace(/\s+/g, "_"), difficulty],
      competency_codes: [
        `SCIENCE_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
      ],
    };
  }

  // Generate English questions
  private generateEnglishQuestion(
    grade: number,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
  ): Partial<QuestionTemplate> {
    return {
      text: `Read the following passage and answer the ${difficulty} level question about ${topic}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: "Option A",
      explanation: `This question tests ${topic} skills at ${difficulty} level`,
      time_seconds: 120,
      marks: 2,
      tags: [topic.toLowerCase().replace(/\s+/g, "_"), difficulty],
      competency_codes: [
        `ENGLISH_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
      ],
    };
  }

  // Generate Social Science questions
  private generateSocialScienceQuestion(
    grade: number,
    topic: string,
    difficulty: "easy" | "medium" | "hard",
  ): Partial<QuestionTemplate> {
    return {
      text: `Analyze the ${difficulty} level question about ${topic}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: "Option A",
      explanation: `This question tests understanding of ${topic} at ${difficulty} level`,
      time_seconds: 120,
      marks: 2,
      tags: [topic.toLowerCase().replace(/\s+/g, "_"), difficulty],
      competency_codes: [
        `SOCIAL_${grade}_${topic.toUpperCase().replace(/\s+/g, "_")}`,
      ],
    };
  }

  // Get random question type based on subject
  private getRandomQuestionType(subject: string): string {
    const types = {
      mathematics: ["mcq_single", "numerical", "short"],
      science: ["mcq_single", "short", "diagram"],
      english: ["mcq_single", "short", "long"],
      social_science: ["mcq_single", "short", "long"],
    };

    const subjectTypes = types[subject as keyof typeof types] || ["mcq_single"];
    return subjectTypes[Math.floor(Math.random() * subjectTypes.length)];
  }

  // Store questions in database
  async storeQuestions(questions: QuestionTemplate[]): Promise<void> {
    try {
      const insertData = questions.map(q => ({
        id: q.question_id,
        grade: q.grade,
        subject: q.subject,
        topic: q.topic,
        question_type: q.question_type,
        difficulty: q.difficulty,
        text: q.text,
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        time_seconds: q.time_seconds,
        marks: q.marks,
        tags: q.tags,
        competency_codes: q.competency_codes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));
      const { error } = await (this.supabase as any).from("questions").insert(insertData as never);

      if (error) {
        throw new Error(`Failed to store questions: ${error.message}`);
      }

      console.log(`Successfully stored ${questions.length} questions`);
    } catch (error) {
      console.error("Error storing questions:", error);
      throw error;
    }
  }

  // Generate test for a student
  async generateTest(
    studentId: string,
    grade: number,
    testType: string = "stream_assessment",
  ): Promise<TestTemplate> {
    const testId = uuidv4();
    const now = new Date().toISOString();

    // Get questions based on test type
    let questions: string[] = [];
    let totalMarks = 0;
    let timeLimit = 0;

    if (testType === "stream_assessment") {
      // Generate questions from all subjects for stream assessment
      const subjects = ["mathematics", "science", "english", "social_science"];

      for (const subject of subjects) {
        const subjectQuestions = await this.generateQuestionsForSubject(
          grade,
          subject,
          5,
        );
        await this.storeQuestions(subjectQuestions);

        questions.push(...subjectQuestions.map((q) => q.question_id));
        totalMarks += subjectQuestions.reduce((sum, q) => sum + q.marks, 0);
        timeLimit += subjectQuestions.reduce(
          (sum, q) => sum + q.time_seconds,
          0,
        );
      }
    } else {
      // Single subject test
      const subjectQuestions = await this.generateQuestionsForSubject(
        grade,
        testType,
        20,
      );
      await this.storeQuestions(subjectQuestions);

      questions = subjectQuestions.map((q) => q.question_id);
      totalMarks = subjectQuestions.reduce((sum, q) => sum + q.marks, 0);
      timeLimit = subjectQuestions.reduce((sum, q) => sum + q.time_seconds, 0);
    }

    const test: TestTemplate = {
      test_id: testId,
      student_id: studentId,
      grade,
      test_type: testType,
      questions,
      total_marks: totalMarks,
      time_limit_seconds: timeLimit,
      created_at: now,
    };

    // Store test in database
    await this.storeTest(test);

    return test;
  }

  // Store test in database
  private async storeTest(test: TestTemplate): Promise<void> {
    try {
      const insertData = {
        id: test.test_id,
        student_id: test.student_id,
        grade: test.grade,
        test_type: test.test_type,
        questions: test.questions,
        total_marks: test.total_marks,
        time_limit_seconds: test.time_limit_seconds,
        created_at: test.created_at,
        updated_at: new Date().toISOString()
      };
      const { error } = await (this.supabase as any).from("tests").insert([insertData] as never);

      if (error) {
        throw new Error(`Failed to store test: ${error.message}`);
      }

      console.log(`Successfully stored test ${test.test_id}`);
    } catch (error) {
      console.error("Error storing test:", error);
      throw error;
    }
  }

  // Validate question quality
  validateQuestion(question: QuestionTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!question.text || question.text.trim().length === 0) {
      errors.push("Question text cannot be empty");
    }

    if (["mcq_single", "mcq_multi"].includes(question.question_type)) {
      if (!question.options || question.options.length < 2) {
        errors.push("MCQ questions must have at least 2 options");
      }
    }

    if (!question.correct_answer) {
      errors.push("Correct answer is required");
    }

    if (!question.explanation || question.explanation.trim().length === 0) {
      errors.push("Explanation is required");
    }

    if (question.time_seconds <= 0) {
      errors.push("Time must be positive");
    }

    if (question.marks <= 0) {
      errors.push("Marks must be positive");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
