import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  subject: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  deadline: { type: Date, required: true },
  maxMarks: { type: Number, required: true, min: 1, max: 1000, default: 50 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);
