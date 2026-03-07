import { createServiceClient } from "./supabase/service";
import { QuestionTemplate } from "./question-generator";
import { QualityValidator } from "./quality-validator";

export interface TestConfiguration {
  grade: number;
  testType: "stream_assessment" | "subject_test" | "practice";
  subjects?: string[];
  totalQuestions?: number;
  timeLimit?: number; // in minutes
  difficultyDistribution?: {
    easy: number; // percentage
    medium: number; // percentage
    hard: number; // percentage
  };
  questionTypeDistribution?: {
    mcq_single: number; // percentage
    mcq_multi: number; // percentage
    short: number; // percentage
    long: number; // percentage
    numerical: number; // percentage
    diagram: number; // percentage
  };
}

export interface GeneratedTest {
  test_id: string;
  student_id: string;
  grade: number;
  test_type: string;
  questions: QuestionTemplate[];
  total_marks: number;
  time_limit_seconds: number;
  difficulty_distribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  subject_coverage: Record<string, number>;
  quality_score: number;
  created_at: string;
}

export class TestGenerator {
  private supabase: ReturnType<typeof createServiceClient>;
  private qualityValidator: QualityValidator;

  constructor() {
    this.supabase = createServiceClient();
    this.qualityValidator = new QualityValidator();
  }

  // Generate test based on configuration
  async generateTest(
    studentId: string,
    config: TestConfiguration,
  ): Promise<GeneratedTest> {
    const testId = this.generateTestId();
    const now = new Date().toISOString();

    // Set default configuration
    const finalConfig = this.setDefaultConfiguration(config);

    // Get questions from database
    const questions = await this.selectQuestions(finalConfig);

    // Validate test composition
    const validation = this.qualityValidator.validateTestComposition(questions);

    if (!validation.isValid) {
      throw new Error(
        `Test validation failed: ${validation.errors.join(", ")}`,
      );
    }

    // Calculate test metrics
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);
    const timeLimit =
      finalConfig.timeLimit || this.calculateOptimalTime(questions);

    // Calculate distributions
    const difficultyDistribution =
      this.calculateDifficultyDistribution(questions);
    const subjectCoverage = this.calculateSubjectCoverage(questions);

    const test: GeneratedTest = {
      test_id: testId,
      student_id: studentId,
      grade: finalConfig.grade,
      test_type: finalConfig.testType,
      questions,
      total_marks: totalMarks,
      time_limit_seconds: timeLimit * 60, // Convert to seconds
      difficulty_distribution: difficultyDistribution,
      subject_coverage: subjectCoverage,
      quality_score: validation.score,
      created_at: now,
    };

    // Store test in database
    await this.storeTest(test);

    return test;
  }

  // Set default configuration
  private setDefaultConfiguration(
    config: TestConfiguration,
  ): TestConfiguration {
    const defaults: TestConfiguration = {
      grade: config.grade,
      testType: config.testType || "stream_assessment",
      subjects: config.subjects || [
        "mathematics",
        "science",
        "english",
        "social_science",
      ],
      totalQuestions: config.totalQuestions || 50,
      timeLimit: config.timeLimit || 90, // 90 minutes default
      difficultyDistribution: config.difficultyDistribution || {
        easy: 40,
        medium: 40,
        hard: 20,
      },
      questionTypeDistribution: config.questionTypeDistribution || {
        mcq_single: 50,
        mcq_multi: 10,
        short: 20,
        long: 10,
        numerical: 8,
        diagram: 2,
      },
    };

    return defaults;
  }

  // Select questions from database based on configuration
  private async selectQuestions(
    config: TestConfiguration,
  ): Promise<QuestionTemplate[]> {
    const selectedQuestions: QuestionTemplate[] = [];
    const totalQuestions = config.totalQuestions!;

    // Calculate questions per subject
    const questionsPerSubject = Math.floor(
      totalQuestions / config.subjects!.length,
    );
    const remainingQuestions = totalQuestions % config.subjects!.length;

    for (let i = 0; i < config.subjects!.length; i++) {
      const subject = config.subjects![i];
      const subjectQuestionCount =
        questionsPerSubject + (i < remainingQuestions ? 1 : 0);

      // Get questions for this subject
      const subjectQuestions = await this.getQuestionsForSubject(
        config.grade,
        subject,
        subjectQuestionCount,
        config.difficultyDistribution!,
        config.questionTypeDistribution!,
      );

      selectedQuestions.push(...subjectQuestions);
    }

    // Shuffle questions to randomize order
    return this.shuffleArray(selectedQuestions);
  }

  // Get questions for a specific subject
  private async getQuestionsForSubject(
    grade: number,
    subject: string,
    count: number,
    difficultyDistribution: Record<string, unknown>,
    questionTypeDistribution: Record<string, unknown>,
  ): Promise<QuestionTemplate[]> {
    const { data: questions, error } = await this.supabase
      .from("questions")
      .select("*")
      .eq("grade", grade)
      .eq("subject", subject)
      .eq("is_active", true)
      .eq("pending_review", false);

    if (error) {
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    if (!questions || questions.length === 0) {
      throw new Error(
        `No questions found for grade ${grade} and subject ${subject}`,
      );
    }

    // Filter and select questions based on distribution
    const selectedQuestions = this.selectQuestionsByDistribution(
      questions,
      count,
      difficultyDistribution,
      questionTypeDistribution,
    );

    return selectedQuestions;
  }

  // Select questions based on difficulty and type distribution
  private selectQuestionsByDistribution(
    questions: Record<string, unknown>[],
    count: number,
    difficultyDistribution: Record<string, unknown>,
    questionTypeDistribution: Record<string, unknown>,
  ): QuestionTemplate[] {
    const selected: QuestionTemplate[] = [];
    const used = new Set<string>();

    // Calculate target counts
    const easyCount = Math.floor((count * (difficultyDistribution.easy as number)) / 100);
    const mediumCount = Math.floor(
      (count * (difficultyDistribution.medium as number)) / 100,
    );
    const hardCount = count - easyCount - mediumCount;

    const mcqSingleCount = Math.floor(
      (count * (questionTypeDistribution.mcq_single as number)) / 100,
    );
    const mcqMultiCount = Math.floor(
      (count * (questionTypeDistribution.mcq_multi as number)) / 100,
    );
    const shortCount = Math.floor(
      (count * (questionTypeDistribution.short as number)) / 100,
    );
    const longCount = Math.floor((count * (questionTypeDistribution.long as number)) / 100);
    const numericalCount = Math.floor(
      (count * (questionTypeDistribution.numerical as number)) / 100,
    );
    const _diagramCount =
      count -
      mcqSingleCount -
      mcqMultiCount -
      shortCount -
      longCount -
      numericalCount;

    // Select questions by difficulty
    const difficultyTargets = [
      { difficulty: "easy", count: easyCount },
      { difficulty: "medium", count: mediumCount },
      { difficulty: "hard", count: hardCount },
    ];

    for (const target of difficultyTargets) {
      const difficultyQuestions = questions.filter(
        (q) => {
          const question = q as unknown as QuestionTemplate;
          return question.difficulty === target.difficulty && !used.has(question.question_id);
        }
      );

      const selectedFromDifficulty = this.shuffleArray(
        difficultyQuestions,
      ).slice(0, target.count);

      selectedFromDifficulty.forEach((q) => {
        const question = q as unknown as QuestionTemplate;
        selected.push(question);
        used.add(question.question_id);
      });
    }

    // If we don't have enough questions, fill with any available
    if (selected.length < count) {
      const remainingQuestions = questions.filter(
        (q) => !used.has((q as unknown as QuestionTemplate).question_id),
      );
      const needed = count - selected.length;
      const additional = this.shuffleArray(remainingQuestions).slice(0, needed);

      additional.forEach((q) => {
        const question = q as unknown as QuestionTemplate;
        selected.push(question);
        used.add(question.question_id);
      });
    }

    return selected.slice(0, count);
  }

  // Calculate optimal time for test
  private calculateOptimalTime(questions: QuestionTemplate[]): number {
    const totalTime = questions.reduce((sum, q) => sum + q.time_seconds, 0);
    const bufferTime = totalTime * 0.2; // 20% buffer
    return Math.ceil((totalTime + bufferTime) / 60); // Convert to minutes
  }

  // Calculate difficulty distribution
  private calculateDifficultyDistribution(questions: QuestionTemplate[]): {
    easy: number;
    medium: number;
    hard: number;
  } {
    const total = questions.length;
    const easy = questions.filter((q) => q.difficulty === "easy").length;
    const medium = questions.filter((q) => q.difficulty === "medium").length;
    const hard = questions.filter((q) => q.difficulty === "hard").length;

    return {
      easy: Math.round((easy / total) * 100),
      medium: Math.round((medium / total) * 100),
      hard: Math.round((hard / total) * 100),
    };
  }

  // Calculate subject coverage
  private calculateSubjectCoverage(
    questions: QuestionTemplate[],
  ): Record<string, number> {
    const coverage: Record<string, number> = {};

    questions.forEach((q) => {
      coverage[q.subject] = (coverage[q.subject] || 0) + 1;
    });

    return coverage;
  }

  // Store test in database
  private async storeTest(test: GeneratedTest): Promise<void> {
    try {
      const { error } = await (this.supabase as any).from("tests").insert([
        {
          test_id: test.test_id,
          student_id: test.student_id,
          grade: test.grade,
          test_type: test.test_type,
          questions: test.questions.map((q) => q.question_id),
          total_marks: test.total_marks,
          time_limit_seconds: test.time_limit_seconds,
          created_at: test.created_at,
        },
      ]);

      if (error) {
        throw new Error(`Failed to store test: ${error.message}`);
      }

      console.log(`Successfully stored test ${test.test_id}`);
    } catch (error) {
      console.error("Error storing test:", error);
      throw error;
    }
  }

  // Generate unique test ID
  private generateTestId(): string {
    return `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Shuffle array utility
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get test for student
  async getTest(
    testId: string,
    studentId: string,
  ): Promise<GeneratedTest | null> {
    try {
      const { data: test, error } = await this.supabase
        .from("tests")
        .select("*")
        .eq("test_id", testId)
        .eq("student_id", studentId)
        .single();

      if (error || !test) {
        return null;
      }

      // Get questions for this test
      const { data: questions, error: questionsError } = await this.supabase
        .from("questions")
        .select("*")
        .in("question_id", (test as { questions: string[] }).questions);

      if (questionsError) {
        throw new Error(`Failed to fetch questions: ${questionsError.message}`);
      }

      return {
        test_id: (test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).test_id,
        student_id: (test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).student_id,
        grade: parseInt((test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).grade),
        test_type: (test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).test_type,
        questions: questions || [],
        total_marks: (test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).total_marks,
        time_limit_seconds: parseInt((test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).time_limit_seconds as string),
        difficulty_distribution: this.calculateDifficultyDistribution(
          questions || [],
        ),
        subject_coverage: this.calculateSubjectCoverage(questions || []),
        quality_score: 100, // Default score
        created_at: (test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).created_at as string,
      };
    } catch (error) {
      console.error("Error fetching test:", error);
      return null;
    }
  }

  // Get student's test history
  async getStudentTests(
    studentId: string,
    limit: number = 10,
  ): Promise<GeneratedTest[]> {
    try {
      const { data: tests, error } = await this.supabase
        .from("tests")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Failed to fetch tests: ${error.message}`);
      }

      const result: GeneratedTest[] = [];

      for (const test of tests || []) {
        const fullTest = await this.getTest((test as { test_id: string; student_id: string; grade: string; test_type: string; total_marks: number; [key: string]: unknown }).test_id, studentId);
        if (fullTest) {
          result.push(fullTest);
        }
      }

      return result;
    } catch (error) {
      console.error("Error fetching student tests:", error);
      return [];
    }
  }
}
