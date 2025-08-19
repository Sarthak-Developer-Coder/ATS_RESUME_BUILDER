import mongoose from 'mongoose';

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'My Resume' },
  versionLabel: { type: String, default: 'v1' },
  isPublic: { type: Boolean, default: false },
  shareSlug: { type: String, unique: true, sparse: true },
  personalDetails: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    linkedin: String,
    github: String,
    website: String,
  },
  summary: String,
  education: [{
    degree: String,
    institution: String,
    location: String,
    startDate: String,
    endDate: String,
    gpa: String,
    achievements: String,
  }],
  experience: [{
    jobTitle: String,
    company: String,
    location: String,
    startDate: String,
    endDate: String,
    currentJob: Boolean,
    responsibilities: String,
  }],
  projects: [{
    name: String,
    description: String,
    technologies: String,
    link: String,
    duration: String,
  }],
  // Persist chosen template so preview/public pages can render consistently
  selectedTemplate: { type: mongoose.Schema.Types.Mixed, default: null },
  skills: [String],
  achievements: [{
    title: String,
    description: String,
    link: String,
    date: String,
    organization: String,
  }],
  hobbies: [String],
  score: { type: Number, default: 0 },
  publicViews: { type: Number, default: 0 },
  lastViewedAt: { type: Date, default: null },
  // Map of YYYY-MM-DD -> number of views
  viewsByDay: { type: Map, of: Number, default: {} },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

resumeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Resume', resumeSchema);