import { z } from 'zod';

const SUPPORTED_LANGUAGES = ['javascript', 'python', 'cpp', 'java'] as const;

// ─── Project CRUD validators ──────────────────────────────────────────────────

export const createProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Project title is required')
    .max(100, 'Title cannot exceed 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters')
    .optional()
    .default(''),
  language: z.enum(SUPPORTED_LANGUAGES, {
    error: 'Language must be one of: javascript, python, cpp, java',
  }),
});

export const renameProjectSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Project title is required')
    .max(100, 'Title cannot exceed 100 characters'),
});

// ─── File tree validator ──────────────────────────────────────────────────────

// Recursive FileNode validation using z.lazy
const FileNodeSchemaBase = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'File name is required').max(255),
  path: z.string().min(1),
  type: z.enum(['file', 'folder']),
  content: z.string().optional(),
  isOpen: z.boolean().optional(),
  isEntry: z.boolean().optional(),
});

export type FileNodeInput = z.infer<typeof FileNodeSchemaBase> & {
  children?: FileNodeInput[];
};

// Lazy recursive schema for nested children
export const FileNodeSchema: z.ZodType<FileNodeInput> = FileNodeSchemaBase.extend({
  children: z.lazy(() => FileNodeSchema.array().optional()),
});

export const updateFilesSchema = z.object({
  rootFiles: z.array(FileNodeSchema).max(500, 'Cannot store more than 500 file nodes'),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type RenameProjectInput = z.infer<typeof renameProjectSchema>;
export type UpdateFilesInput = z.infer<typeof updateFilesSchema>;
