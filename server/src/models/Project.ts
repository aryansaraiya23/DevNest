import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import { SupportedLanguage } from '@devnest/shared';

// ─── Sub-document interfaces ──────────────────────────────────────────────────

export interface IFileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  content?: string;
  children?: IFileNode[];
  isOpen?: boolean;
  isEntry?: boolean;
}

// ─── Project document interface ───────────────────────────────────────────────

export interface IProject extends Document {
  title: string;
  description: string;
  language: SupportedLanguage;
  owner: Types.ObjectId;
  rootFiles: IFileNode[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeProject;
}

export interface SafeProject {
  id: string;
  title: string;
  description: string;
  language: SupportedLanguage;
  ownerId: string;
  rootFiles: IFileNode[];
  createdAt: string;
  updatedAt: string;
}

// ─── Recursive FileNode schema ────────────────────────────────────────────────

// Mongoose requires explicit recursive schema definitions.
// We define a function to build the schema so children can reference it.
function buildFileNodeSchema(): Schema {
  const FileNodeSchema: Schema = new Schema(
    {
      id: { type: String, required: true },
      name: { type: String, required: true, trim: true },
      path: { type: String, required: true },
      type: { type: String, enum: ['file', 'folder'], required: true },
      content: { type: String, default: '' },
      isOpen: { type: Boolean },
      isEntry: { type: Boolean },
      // children is added below to allow recursion
    },
    { _id: false } // No separate _id for sub-documents
  );

  // Add children after to allow self-reference
  FileNodeSchema.add({
    children: { type: [FileNodeSchema], default: undefined },
  });

  return FileNodeSchema;
}

const FileNodeSchema = buildFileNodeSchema();

// ─── Project schema ───────────────────────────────────────────────────────────

const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    language: {
      type: String,
      enum: {
        values: ['javascript', 'python', 'cpp', 'java'],
        message: '{VALUE} is not a supported language',
      },
      required: [true, 'Language is required'],
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
      index: true,
    },
    rootFiles: {
      type: [FileNodeSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index: one user's projects queried by updatedAt for dashboard ordering
ProjectSchema.index({ owner: 1, updatedAt: -1 });

// ─── Instance methods ─────────────────────────────────────────────────────────

ProjectSchema.methods.toSafeObject = function (): SafeProject {
  return {
    id: this._id.toString(),
    title: this.title,
    description: this.description,
    language: this.language as SupportedLanguage,
    ownerId: this.owner.toString(),
    rootFiles: this.rootFiles as IFileNode[],
    createdAt: this.createdAt.toISOString(),
    updatedAt: this.updatedAt.toISOString(),
  };
};

export const Project: Model<IProject> =
  mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema);
