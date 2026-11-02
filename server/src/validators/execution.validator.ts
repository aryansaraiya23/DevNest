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
