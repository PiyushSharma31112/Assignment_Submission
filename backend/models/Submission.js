import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  fileName: { type: String, required: true },
  originalName: { type: String, required: true, maxlength: 255 },
  mimeType: { type: String, required: true },
  fileSize: { type: Number, required: true, min: 1 },
  submittedAt: { type: Date, required: true, default: Date.now },
  marks: { type: Number, default: null, min: 0 },
  feedback: { type: String, default: '', maxlength: 3000 },
  evaluatedAt: { type: Date, default: null },
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

export default mongoose.model('Submission', submissionSchema);
