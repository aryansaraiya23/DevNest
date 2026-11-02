import { z } from 'zod';

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'cpp', 'java'] as const;

export const executeCodeSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, {
    error: 'Language must be one of: javascript, python, cpp, java',
  }),
  sourceCode: z
    .string({
      error: 'Source code is required',
    })
    .min(1, 'Source code cannot be empty')
    .max(100000, 'Source code cannot exceed 100KB (100,000 characters)'),
  stdin: z
    .string()
    .max(50000, 'Standard input cannot exceed 50KB (50,000 characters)')
    .optional(),
  projectId: z.string().optional(),
});

export type ExecuteCodeInput = z.infer<typeof executeCodeSchema>;

export const testCaseInputSchema = z.object({
  id: z.string().optional(),
  input: z.string().max(50000, 'Test input cannot exceed 50KB').default(''),
  expectedOutput: z.string().max(50000, 'Expected output cannot exceed 50KB').optional(),
});

export const runBatchTestsSchema = z.object({
  language: z.enum(SUPPORTED_LANGUAGES, {
    error: 'Language must be one of: javascript, python, cpp, java',
  }),
  sourceCode: z
    .string({
      error: 'Source code is required',
    })
    .min(1, 'Source code cannot be empty')
    .max(100000, 'Source code cannot exceed 100KB (100,000 characters)'),
  tests: z
    .array(testCaseInputSchema)
    .min(1, 'At least one test case is required')
    .max(10, 'Cannot execute more than 10 test cases in a single batch'),
  projectId: z.string().optional(),
});

export type RunBatchTestsInput = z.infer<typeof runBatchTestsSchema>;

