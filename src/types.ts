export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption?: number; // 0, 1, 2, 3 (hidden from student during active exam)
  topic: string;
  createdBy?: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  instructions?: string;
  durationMinutes: number; // 5 to 180
  passingScore?: number; // e.g. 0%
  maxAttempts?: number; // e.g. 1
  allowedTabSwitches?: number; // e.g. 1
  showResultAfterSubmission?: boolean; // toggle
  autoSubmitOnTabLimit?: boolean; // toggle
  availableFrom?: string; // ISO
  availableTo?: string; // ISO
  questionIds: string[];
  createdBy?: string;
  status: 'published' | 'draft';
  questionCount?: number;
}

export interface ExamAttempt {
  id: string;
  examId: string;
  examTitle?: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  startedAt: string;
  deadlineAt: string;
  submittedAt?: string;
  submissionReason?: 'manual' | 'auto';
  status: 'in_progress' | 'submitted';
  score?: number;
  totalQuestions?: number;
  remainingSeconds?: number;
  violationsCount?: number;
}

export interface Violation {
  id: string;
  attemptId: string;
  eventType: 'hidden' | 'visible' | 'blur' | 'focus' | 'tab_switch' | 'window_minimize' | 'page_unload';
  occurredAt: string; // Server-assigned ISO timestamp
  details?: string;
}

export interface ConsolidatedReportRow {
  attemptId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  examId: string;
  examTitle: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  submissionReason: 'manual' | 'auto';
  startedAt: string;
  submittedAt: string;
  violationsCount: number;
  violations: Violation[];
}

export interface TestCaseResult {
  testId: string;
  requirement: string;
  scenario: string;
  expectedResult: string;
  actualResult: string;
  status: 'passed' | 'failed' | 'not_executed';
  timestamp?: string;
}
