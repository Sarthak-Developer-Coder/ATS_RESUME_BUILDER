import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
  company: { type: String, required: true },
  role: { type: String, required: true },
  link: { type: String, default: '' },
  status: { type: String, enum: ['Planned', 'Applied', 'Interview', 'Offer', 'Rejected'], default: 'Planned', index: true },
  notes: { type: String, default: '' },
  appliedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

applicationSchema.pre('save', function(next){ this.updatedAt = new Date(); next(); });

export default mongoose.model('Application', applicationSchema);
