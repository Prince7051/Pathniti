import { QuestionTemplate } from "./question-generator";

export interface ValidationResult {
  isValid: boolean;
  score: number; // 0-100 quality score
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class QualityValidator {
  // Main validation function
  validateQuestion(question: QuestionTemplate): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Basic validation
    this.validateBasicFields(question, errors);
    this.validateQuestionText(question, errors, warnings, suggestions);
    this.validateAnswerFormat(question, errors, warnings);
    this.validateDifficulty(question, warnings, suggestions);
    this.validateTimeAndMarks(question, warnings, suggestions);
    this.validateTagsAndMetadata(question, warnings, suggestions);

    // Calculate quality score
    score -= errors.length * 20; // Major errors reduce score significantly
    score -= warnings.length * 5; // Warnings reduce score moderately
    score = Math.max(0, score); // Ensure score doesn't go below 0

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
    };
  }

  // Validate basic required fields
  private validateBasicFields(
    question: QuestionTemplate,
    errors: string[],
    // warnings: string[], // Unused parameter
  ): void {
    if (!question.text || question.text.trim().length === 0) {
      errors.push("Question text cannot be empty");
    }

    if (!question.correct_answer) {
      errors.push("Correct answer is required");
    }

    if (!question.explanation || question.explanation.trim().length === 0) {
      errors.push("Explanation is required");
    }

    if (!question.grade || ![10, 11, 12].includes(question.grade)) {
      errors.push("Valid grade (10, 11, or 12) is required");
    }

    if (!question.subject) {
      errors.push("Subject is required");
    }

    if (!question.topic || question.topic.trim().length === 0) {
      errors.push("Topic is required");
    }
  }

  // Validate question text quality
  private validateQuestionText(
    question: QuestionTemplate,
    errors: string[],
    warnings: string[],
    suggestions: string[],
  ): void {
    if (!question.text) return;

    const text = question.text.trim();

    // Check minimum length
    if (text.length < 10) {
      errors.push("Question text is too short (minimum 10 characters)");
    }

    // Check maximum length
    if (text.length > 1000) {
      warnings.push("Question text is very long (over 1000 characters)");
    }

    // Check for proper punctuation
    if (!text.endsWith("?") && !text.endsWith(".")) {
      warnings.push("Question should end with proper punctuation");
    }

    // Check for spelling and grammar issues (basic checks)
    if (this.hasSpellingIssues(text)) {
      warnings.push("Question text may contain spelling or grammar issues");
    }

    // Check reading level appropriateness
    const readingLevel = this.calculateReadingLevel(text);
    const expectedLevel = this.getExpectedReadingLevel(question.grade);

    if (readingLevel > expectedLevel + 2) {
      warnings.push(
        `Question may be too complex for grade ${question.grade} students`,
      );
    } else if (readingLevel < expectedLevel - 2) {
      warnings.push(
        `Question may be too simple for grade ${question.grade} students`,
      );
    }

    // Check for clarity
    if (this.hasAmbiguousLanguage(text)) {
      suggestions.push("Consider making the question more specific and clear");
    }
  }

  // Validate answer format
  private validateAnswerFormat(
    question: QuestionTemplate,
    errors: string[],
    warnings: string[],
  ): void {
    if (!question.correct_answer) return;

    // MCQ validation
    if (["mcq_single", "mcq_multi"].includes(question.question_type)) {
      if (!question.options || question.options.length < 2) {
        errors.push("MCQ questions must have at least 2 options");
      } else if (question.options.length > 6) {
        warnings.push("MCQ questions should not have more than 6 options");
      }

      // Check for duplicate options
      const uniqueOptions = new Set(
        question.options?.map((opt) => opt.toLowerCase().trim()) || [],
      );
      if (uniqueOptions.size !== (question.options?.length || 0)) {
        errors.push("MCQ options must be unique");
      }

      // Validate correct answer for MCQ
      if (question.question_type === "mcq_single") {
        if (Array.isArray(question.correct_answer)) {
          errors.push("Single-select MCQ should have only one correct answer");
        } else if (typeof question.correct_answer === "string") {
          if (!question.options?.includes(question.correct_answer)) {
            errors.push("Correct answer must be one of the provided options");
          }
        }
      } else if (question.question_type === "mcq_multi") {
        if (!Array.isArray(question.correct_answer)) {
          errors.push("Multi-select MCQ should have multiple correct answers");
        } else if (question.correct_answer.length < 2) {
          warnings.push(
            "Multi-select MCQ should have at least 2 correct answers",
          );
        }
      }
    }

    // Numerical answer validation
    if (question.question_type === "numerical") {
      if (typeof question.correct_answer === "string") {
        if (!this.isValidNumber(question.correct_answer)) {
          errors.push("Numerical answer must be a valid number");
        }
      } else if (Array.isArray(question.correct_answer)) {
        const allNumbers = question.correct_answer.every((ans) =>
          this.isValidNumber(ans),
        );
        if (!allNumbers) {
          errors.push("All numerical answers must be valid numbers");
        }
      }
    }
  }

  // Validate difficulty level
  private validateDifficulty(
    question: QuestionTemplate,
    warnings: string[],
    suggestions: string[],
  ): void {
    if (!question.difficulty) return;

    const difficulty = question.difficulty;
    const grade = question.grade;

    // Check if difficulty matches grade level
    if (grade === 10 && difficulty === "hard") {
      warnings.push(
        "Grade 10 questions should generally be easy to medium difficulty",
      );
    }

    if (grade === 12 && difficulty === "easy") {
      warnings.push(
        "Grade 12 questions should generally be medium to hard difficulty",
      );
    }

    // Check if question complexity matches difficulty
    const complexity = this.assessQuestionComplexity(question);
    if (complexity !== difficulty) {
      suggestions.push(
        `Question complexity (${complexity}) doesn't match assigned difficulty (${difficulty})`,
      );
    }
  }

  // Validate time and marks allocation
  private validateTimeAndMarks(
    question: QuestionTemplate,
    warnings: string[],
    suggestions: string[],
  ): void {
    const timeSeconds = question.time_seconds;
    const marks = question.marks;

    // Check reasonable time allocation
    if (timeSeconds < 30) {
      warnings.push("Time allocation seems too short for most questions");
    } else if (timeSeconds > 300) {
      warnings.push("Time allocation seems too long for a single question");
    }

    // Check marks allocation
    if (marks < 1) {
      warnings.push("Questions should have at least 1 mark");
    } else if (marks > 10) {
      warnings.push("Single questions should not have more than 10 marks");
    }

    // Check time-to-marks ratio
    const timePerMark = timeSeconds / marks;
    if (timePerMark < 30) {
      suggestions.push("Consider increasing time allocation relative to marks");
    } else if (timePerMark > 120) {
      suggestions.push("Consider reducing time allocation relative to marks");
    }

    // Check question type specific time allocation
    if (question.question_type === "mcq_single" && timeSeconds > 60) {
      suggestions.push("Single-select MCQ questions typically need less time");
    }

    if (question.question_type === "long" && timeSeconds < 120) {
      suggestions.push("Long answer questions typically need more time");
    }
  }

  // Validate tags and metadata
  private validateTagsAndMetadata(
    question: QuestionTemplate,
    warnings: string[],
    suggestions: string[],
  ): void {
    // Check tags
    if (!question.tags || question.tags.length === 0) {
      warnings.push("Questions should have relevant tags");
    } else if (question.tags.length > 10) {
      warnings.push("Too many tags - consider using fewer, more relevant tags");
    }

    // Check competency codes
    if (!question.competency_codes || question.competency_codes.length === 0) {
      suggestions.push(
        "Consider adding competency codes for better curriculum alignment",
      );
    }

    // Check topic relevance
    if (question.topic && question.tags) {
      const topicInTags = question.tags.some((tag) =>
        tag.toLowerCase().includes(question.topic.toLowerCase()),
      );
      if (!topicInTags) {
        suggestions.push("Consider adding the topic as a tag");
      }
    }
  }

  // Helper methods
  private hasSpellingIssues(text: string): boolean {
    // Basic spelling check - in a real implementation, you'd use a proper spell checker
    const commonMisspellings = [
      "recieve",
      "seperate",
      "occured",
      "definately",
      "accomodate",
      "begining",
      "beleive",
      "calender",
      "cemetary",
      "concious",
    ];

    return commonMisspellings.some((misspelling) =>
      text.toLowerCase().includes(misspelling),
    );
  }

  private calculateReadingLevel(text: string): number {
    // Simplified Flesch-Kincaid reading level calculation
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const syllables = this.countSyllables(text);

    if (sentences === 0 || words === 0) return 0;

    const score =
      0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
    return Math.round(score);
  }

  private countSyllables(text: string): number {
    // Simplified syllable counting
    const words = text.toLowerCase().split(/\s+/);
    let syllables = 0;

    for (const word of words) {
      const vowels = word.match(/[aeiouy]+/g);
      if (vowels) {
        syllables += vowels.length;
      }
    }

    return syllables;
  }

  private getExpectedReadingLevel(grade: number): number {
    // Expected reading levels for different grades
    const levels = { 10: 10, 11: 11, 12: 12 };
    return levels[grade as keyof typeof levels] || 10;
  }

  private hasAmbiguousLanguage(text: string): boolean {
    const ambiguousWords = [
      "some",
      "many",
      "few",
      "several",
      "often",
      "sometimes",
      "usually",
      "generally",
      "typically",
      "probably",
      "maybe",
    ];

    return ambiguousWords.some((word) => text.toLowerCase().includes(word));
  }

  private isValidNumber(str: string): boolean {
    return !isNaN(parseFloat(str)) && isFinite(parseFloat(str));
  }

  private assessQuestionComplexity(
    question: QuestionTemplate,
  ): "easy" | "medium" | "hard" {
    let complexity = 0;

    // Text length factor
    if (question.text && question.text.length > 200) complexity += 1;

    // Question type factor
    if (["long", "numerical"].includes(question.question_type)) complexity += 1;
    if (question.question_type === "diagram") complexity += 2;

    // Options factor
    if (question.options && question.options.length > 4) complexity += 1;

    // Time factor
    if (question.time_seconds > 120) complexity += 1;

    // Marks factor
    if (question.marks > 3) complexity += 1;

    if (complexity <= 1) return "easy";
    if (complexity <= 3) return "medium";
    return "hard";
  }

  // Validate test composition
  validateTestComposition(questions: QuestionTemplate[]): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    if (questions.length === 0) {
      errors.push("Test must have at least one question");
      return { isValid: false, score: 0, errors, warnings, suggestions };
    }

    // Check difficulty distribution
    const difficultyCount = questions.reduce(
      (acc, q) => {
        acc[q.difficulty] = (acc[q.difficulty] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const total = questions.length;
    const easyPercent = ((difficultyCount.easy || 0) / total) * 100;
    const mediumPercent = ((difficultyCount.medium || 0) / total) * 100;
    const hardPercent = ((difficultyCount.hard || 0) / total) * 100;

    // Check if distribution follows recommended ratios (40% easy, 40% medium, 20% hard)
    if (easyPercent < 30 || easyPercent > 50) {
      warnings.push(
        `Easy questions should be 30-50% of total (currently ${easyPercent.toFixed(1)}%)`,
      );
    }

    if (mediumPercent < 30 || mediumPercent > 50) {
      warnings.push(
        `Medium questions should be 30-50% of total (currently ${mediumPercent.toFixed(1)}%)`,
      );
    }

    if (hardPercent < 10 || hardPercent > 30) {
      warnings.push(
        `Hard questions should be 10-30% of total (currently ${hardPercent.toFixed(1)}%)`,
      );
    }

    // Check question type distribution
    const typeCount = questions.reduce(
      (acc, q) => {
        acc[q.question_type] = (acc[q.question_type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const mcqCount = (typeCount.mcq_single || 0) + (typeCount.mcq_multi || 0);
    const mcqPercent = (mcqCount / total) * 100;

    if (mcqPercent > 80) {
      warnings.push(
        "Test has too many MCQ questions - consider adding more open-ended questions",
      );
    }

    if (mcqPercent < 20) {
      warnings.push(
        "Test has very few MCQ questions - consider adding more for better coverage",
      );
    }

    // Check time allocation
    const totalTime = questions.reduce((sum, q) => sum + q.time_seconds, 0);
    const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0);

    if (totalTime > 7200) {
      // 2 hours
      warnings.push(
        "Total test time exceeds 2 hours - consider reducing time or questions",
      );
    }

    if (totalMarks > 100) {
      warnings.push(
        "Total marks exceed 100 - consider standardizing to 100 marks",
      );
    }

    // Check subject coverage
    const subjectCount = questions.reduce(
      (acc, q) => {
        acc[q.subject] = (acc[q.subject] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const subjects = Object.keys(subjectCount);
    if (subjects.length === 1) {
      suggestions.push(
        "Consider adding questions from multiple subjects for comprehensive assessment",
      );
    }

    const score = Math.max(0, 100 - errors.length * 20 - warnings.length * 5);

    return {
      isValid: errors.length === 0,
      score,
      errors,
      warnings,
      suggestions,
    };
  }
}
