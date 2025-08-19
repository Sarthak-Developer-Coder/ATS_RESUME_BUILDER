import { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Paper,
  Grid,
  Alert,
  Snackbar,
  LinearProgress,
  Chip
} from '@mui/material';
// removed unused AlertTitle
import { WarningAmber, CheckCircle } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { Save, Preview, AutoAwesome, Bolt, Article, TipsAndUpdates } from '@mui/icons-material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import PersonalDetailsForm from '../components/forms/PersonalDetailsForm';
import SummaryForm from '../components/forms/SummaryForm';
import EducationForm from '../components/forms/EducationForm';
import ExperienceForm from '../components/forms/ExperienceForm';
import ProjectsForm from '../components/forms/ProjectsForm';
import SkillsForm from '../components/forms/SkillsForm';
import AchievementsForm from '../components/forms/AchievementsForm';
import HobbiesForm from '../components/forms/HobbiesForm';
import ResumePreview from '../components/ResumePreview';
import { TemplateSelector } from '../components/templates';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { api_url } from '../helper/Helper';

function ResumeBuilder() {
  const { type } = useParams();
  const location = useLocation();
  // const navigate = useNavigate();
  const { user, token } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [resumeData, setResumeData] = useState({
    personalDetails: {},
    summary: '',
    education: [],
    experience: [],
    projects: [],
    skills: [],
    achievements: [],
    hobbies: []
  });
  const [showPreview, setShowPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [aiBusy, setAiBusy] = useState(false);
  const [jdText, setJdText] = useState('');
  const [atsIssues, setAtsIssues] = useState(null);
  const [liveScore, setLiveScore] = useState(null);
  const [liveScoreBusy, setLiveScoreBusy] = useState(false);
  const draftKey = `resumeDraft:${type || 'default'}`;
  const importInputRef = useRef(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.resumeData) setResumeData(prev => ({ ...prev, ...parsed.resumeData }));
        if (parsed?.selectedTemplate) setSelectedTemplate(parsed.selectedTemplate);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave draft
  useEffect(() => {
    try {
      localStorage.setItem(draftKey, JSON.stringify({ resumeData, selectedTemplate }));
    } catch {}
  }, [resumeData, selectedTemplate, draftKey]);

  // Live ATS meter: debounce checks on key content changes
  useEffect(() => {
    const handle = setTimeout(async () => {
      try {
        setLiveScoreBusy(true);
        const { data } = await axios.post(`${api_url}/api/detect-ats-issues`, { resumeData });
        setAtsIssues(prev => prev || data);
        let score = 100;
        score -= (data.blockers?.length || 0) * 20;
        score -= (data.warnings?.length || 0) * 5;
        score = Math.max(0, Math.min(100, score));
        setLiveScore(score);
      } catch (e) {
        // ignore errors in live meter
      } finally {
        setLiveScoreBusy(false);
      }
    }, 700);
    return () => clearTimeout(handle);
  }, [resumeData]);

  const fresherStepsDefault = [
    'Template',
    'Personal Details',
    'Summary',
    'Education',
    'Experience',
    'Projects',
    'Skills',
    'Achievements',
    'Hobbies'
  ];

  const experiencedStepsDefault = [
    'Template',
    'Personal Details',
    'Summary',
    'Experience',
    'Projects',
    'Skills',
    'Education',
    'Achievements'
  ];
  const [customSteps, setCustomSteps] = useState(null);
  const steps = customSteps || (type === 'fresher' ? fresherStepsDefault : experiencedStepsDefault);

  useEffect(() => {
    if (location.state?.resumeData) {
      setResumeData(prev => ({
        ...prev,
        ...location.state.resumeData
      }));
    }
  }, [location.state]);

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepClick = (step) => {
    setActiveStep(step);
  };

  const moveStep = (index, delta) => {
    const list = [...steps];
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    // Keep first three fixed: Template, Personal Details, Summary
    if (index < 3 || target < 3) return;
    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;
    setCustomSteps(list);
    if (activeStep === index) setActiveStep(target);
  };

  const updateResumeData = (section, data) => {
    setResumeData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  const exportJSON = () => {
    try {
      const payload = { resumeData, selectedTemplate };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personalDetails?.fullName || 'resume'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Exported resume JSON', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Failed to export JSON', severity: 'error' });
    }
  };

  const importJSON = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (parsed?.resumeData) setResumeData(parsed.resumeData);
        if (parsed?.selectedTemplate) setSelectedTemplate(parsed.selectedTemplate);
        setActiveStep(0);
        setSnackbar({ open: true, message: 'Imported resume JSON', severity: 'success' });
      } catch {
        setSnackbar({ open: true, message: 'Invalid JSON file', severity: 'error' });
      }
    };
    reader.readAsText(file);
  };

  const saveResume = async () => {
    if (!user || !token) {
      setSnackbar({ open: true, message: 'Please login to save resume', severity: 'error' });
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...resumeData,
        selectedTemplate: selectedTemplate
      };

      const response = await axios.post(`${api_url}/api/save-resume`, dataToSave, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      setResumeData(prev => ({
        ...prev,
        _id: response.data.resumeId
      }));
      
      setSnackbar({ open: true, message: 'Resume saved successfully!', severity: 'success' });
    } catch (error) {
      console.error('Failed to save resume:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to save resume', 
        severity: 'error' 
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadResume = async () => {
    setDownloading(true);
    try {
      const dataToDownload = {
        ...resumeData,
        selectedTemplate: selectedTemplate
      };

      const response = await axios.post(`${api_url}/api/download-resume`, dataToDownload, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const fileName = `${resumeData.personalDetails?.fullName || 'resume'}.pdf`;
      link.setAttribute('download', fileName);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      setSnackbar({ open: true, message: 'Resume downloaded successfully!', severity: 'success' });
      
      if (user && token) {
        await saveResume();
      }
    } catch (error) {
      console.error('Failed to download resume:', error);
      setSnackbar({ 
        open: true, 
        message: error.response?.data?.error || 'Failed to download resume', 
        severity: 'error' 
      });
    } finally {
      setDownloading(false);
    }
  };

  const renderStepContent = (step) => {
    const stepName = steps[step];
    
    switch (stepName) {
      case 'Template':
        return (
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            resumeData={resumeData}
          />
        );
      case 'Personal Details':
        return (
          <PersonalDetailsForm
            data={resumeData.personalDetails}
            onChange={(data) => updateResumeData('personalDetails', data)}
          />
        );
      case 'Summary':
        return (
          <SummaryForm
            data={resumeData.summary}
            type={type}
            personalDetails={resumeData.personalDetails}
            onChange={(data) => updateResumeData('summary', data)}
          />
        );
      case 'Education':
        return (
          <EducationForm
            data={resumeData.education}
            onChange={(data) => updateResumeData('education', data)}
          />
        );
      case 'Experience':
        if (type === 'fresher') {
          // Experience is optional for freshers
          if (resumeData.experience.length === 0) {
            return (
              <Box textAlign="center" sx={{ py: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Work Experience (Optional)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                  As a fresher, you might not have professional work experience yet. You can skip this section or add any internships, part-time jobs, or volunteer work you've done.
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() =>
                    updateResumeData('experience', [
                      {
                        jobTitle: '',
                        company: '',
                        location: '',
                        startDate: '',
                        endDate: '',
                        currentJob: false,
                        responsibilities: ''
                      }
                    ])
                  }
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Add Experience (Optional)
                </Button>
              </Box>
            );
          } else {
            return (
              <Box>
                <ExperienceForm
                  data={resumeData.experience}
                  onChange={(data) => updateResumeData('experience', data)}
                />
                <Box textAlign="center" mt={3}>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => updateResumeData('experience', [])}
                    sx={{ borderRadius: 2 }}
                  >
                    Remove Experience Section
                  </Button>
                </Box>
              </Box>
            );
          }
        } else {
          // Experience is mandatory for experienced professionals
          return (
            <ExperienceForm
              data={resumeData.experience}
              onChange={(data) => updateResumeData('experience', data)}
            />
          );
        }
      case 'Projects':
        if (type === 'experienced') {
          // Projects are optional for experienced professionals
          if (resumeData.projects.length === 0) {
            return (
              <Box textAlign="center" sx={{ py: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                  Personal Projects (Optional)
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
                  As an experienced professional, your work experience is the main focus. You can optionally add personal projects, side projects, or freelance work that showcase additional skills.
                </Typography>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() =>
                    updateResumeData('projects', [
                      {
                        title: '',
                        description: '',
                        technologies: '',
                        link: ''
                      }
                    ])
                  }
                  sx={{ borderRadius: 2, px: 4 }}
                >
                  Add Projects (Optional)
                </Button>
              </Box>
            );
          } else {
            return (
              <Box>
                <ProjectsForm
                  data={resumeData.projects}
                  type={type}
                  onChange={(data) => updateResumeData('projects', data)}
                />
                <Box textAlign="center" mt={3}>
                  <Button
                    color="error"
                    variant="outlined"
                    onClick={() => updateResumeData('projects', [])}
                    sx={{ borderRadius: 2 }}
                  >
                    Remove Projects Section
                  </Button>
                </Box>
              </Box>
            );
          }
        } else {
          // Projects are important for freshers to showcase their skills
          return (
            <ProjectsForm
              data={resumeData.projects}
              type={type}
              onChange={(data) => updateResumeData('projects', data)}
            />
          );
        }
      case 'Skills':
        return (
          <SkillsForm
            data={resumeData.skills}
            personalDetails={resumeData.personalDetails}
            onChange={(data) => updateResumeData('skills', data)}
          />
        );
      case 'Achievements':
        return (
          <AchievementsForm
            data={resumeData.achievements}
            onChange={(data) => updateResumeData('achievements', data)}
          />
        );
      case 'Hobbies':
        return (
          <HobbiesForm
            data={resumeData.hobbies}
            onChange={(data) => updateResumeData('hobbies', data)}
          />
        );
      default:
        return <div>Unknown step</div>;
    }
  };

  if (showPreview) {
    return (
      <ResumePreview
        resumeData={resumeData}
        selectedTemplate={selectedTemplate}
        onBack={() => setShowPreview(false)}
        onSave={saveResume}
        onDownload={downloadResume}
        onTemplateChange={setSelectedTemplate}
        saving={saving}
        downloading={downloading}
      />
    );
  }

  const progress = activeStep === steps.length - 1 ? 100 : (activeStep / steps.length) * 100;

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Navbar />

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Box sx={{ mb: 4 }}>
            <Typography
              variant="h3"
              sx={{
                mb: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Resume Builder
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Chip 
                icon={<AutoAwesome />}
                label={type === 'fresher' ? 'Fresher Template' : 'Professional Template'} 
                color="primary" 
                sx={{ fontWeight: 600 }} 
              />
              <Chip 
                label={`Step ${activeStep + 1} of ${steps.length}`} 
                color="secondary" 
                sx={{ fontWeight: 600 }} 
              />
              <Chip 
                label={`Live ATS: ${liveScoreBusy ? '…' : (liveScore ?? '—')}%`} 
                color={liveScore >= 85 ? 'success' : liveScore >= 70 ? 'info' : liveScore >= 50 ? 'warning' : 'error'}
                sx={{ fontWeight: 700 }}
              />
            </Box>
            
           <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box 
              sx={{
                mb: 4,
                display: 'flex',
                
                gap: 2,
                
              }}
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0] 
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <WarningAmber sx={{ color: '#f57c00', fontSize: 26 }} />
              </motion.div>
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#e65100',
                  fontSize: '0.8rem'
                }}
              >
                Please verify all details before saving or downloading your resume
              </Typography>
            </Box>
          </motion.div>
                      
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Progress: {Math.round(progress)}% Complete
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'grey.200',
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 4
                  }
                }} 
              />
            </Box>
          </Box>
        </motion.div>

    <Grid container spacing={4}>
          {/* Stepper */}
          <Grid item xs={12} md={3}>
      <Paper sx={{ p: 3, position: 'sticky', top: 100, borderRadius: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Resume Sections
              </Typography>
              <Stepper 
                activeStep={activeStep} 
                orientation="vertical"
                sx={{ 
                  '& .MuiStepLabel-root': {
                    cursor: 'pointer'
                  }
                }}
              >
                {steps.map((label, index) => {
                  const isOptional = (type === 'fresher' && label === 'Experience') || 
                                   (type === 'experienced' && label === 'Projects');
                  
                  return (
                    <Step 
                      key={label}
                      completed={index < activeStep}
                      onClick={() => handleStepClick(index)}
                    >
                      <StepLabel
                        optional={isOptional ? <Typography variant="caption">Optional</Typography> : null}
                        sx={{
                          '& .MuiStepLabel-label': {
                            fontWeight: index === activeStep ? 600 : 400,
                            color: index === activeStep ? 'primary.main' : 'text.secondary'
                          }
                        }}
                      >
                        {label}
                        {index < activeStep && (
                          <CheckCircle sx={{ ml: 1, fontSize: 16, color: 'success.main' }} />
                        )}
                      </StepLabel>
                    </Step>
                  );
                })}
              </Stepper>
              
              <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                  variant="outlined"
                  startIcon={<Save />}
                  onClick={saveResume}
                  disabled={saving}
                  fullWidth
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  {saving ? 'Saving...' : 'Save Draft'}
                </Button>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <Button variant="text" fullWidth onClick={exportJSON}>Export JSON</Button>
                  <input ref={importInputRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={(e)=>{ const f=e.target.files?.[0]; if (f) importJSON(f); e.target.value=''; }} />
                  <Button variant="text" fullWidth onClick={()=>importInputRef.current?.click()}>Import JSON</Button>
                </Box>
                <Button
                  variant="outlined"
                  onClick={async ()=>{
                    try {
                      const { data } = await axios.post(`${api_url}/api/suggest-section-order`, { type, resumeData });
                      const next = Array.isArray(data.order) && data.order.length ? data.order : null;
                      if (next) {
                        setCustomSteps(next);
                        setActiveStep(0);
                        setSnackbar({ open: true, message: 'Sections reordered for your profile', severity: 'success' });
                      }
                    } catch {
                      setSnackbar({ open: true, message: 'Could not reorder sections', severity: 'error' });
                    }
                  }}
                  fullWidth
                  sx={{ mb: 2, borderRadius: 2 }}
                >
                  Auto-Reorder Sections (AI)
                </Button>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'space-between' }}>
                  <Button size="small" startIcon={<ArrowUpwardIcon />} disabled={activeStep < 3} onClick={()=>moveStep(activeStep, -1)}>Move Up</Button>
                  <Button size="small" startIcon={<ArrowDownwardIcon />} disabled={activeStep < 3 || activeStep >= steps.length - 1} onClick={()=>moveStep(activeStep, +1)}>Move Down</Button>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Preview />}
                  onClick={() => setShowPreview(true)}
                  fullWidth
                  disabled={!selectedTemplate && activeStep === 0}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2
                  }}
                >
                  Preview Resume
                </Button>
                {/* AI Assist mini panel */}
                <Box sx={{ mt: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AutoAwesome fontSize="small" /> AI Assist
                  </Typography>
                  <Button size="small" startIcon={<Bolt />} disabled={aiBusy}
                    onClick={async () => {
                      try {
                        setAiBusy(true);
                        const { data } = await axios.post(`${api_url}/api/detect-ats-issues`, { resumeData });
                        setAtsIssues(data);
                        setSnackbar({ open: true, message: 'ATS check complete', severity: 'success' });
                      } catch (e) {
                        setSnackbar({ open: true, message: 'ATS check failed', severity: 'error' });
                      } finally { setAiBusy(false); }
                    }}>ATS Check</Button>
                  <Button size="small" startIcon={<TipsAndUpdates />} disabled={aiBusy}
                    onClick={async () => {
                      if (!jdText.trim()) { setSnackbar({ open: true, message: 'Paste JD text in AI panel', severity: 'info' }); return; }
                      try {
                        setAiBusy(true);
                        const { data } = await axios.post(`${api_url}/api/tailor-resume`, { resumeData, jobDescription: jdText });
                        setResumeData(prev => ({ ...prev, summary: data.updated.summary, skills: data.updated.skills }));
                        setSnackbar({ open: true, message: 'Tailored summary and skills', severity: 'success' });
                      } catch (e) {
                        setSnackbar({ open: true, message: 'Tailoring failed', severity: 'error' });
                      } finally { setAiBusy(false); }
                    }}>Tailor to JD</Button>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Form Content */}
          <Grid item xs={12} md={9}>
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                  {steps[activeStep]}
                  {((type === 'fresher' && steps[activeStep] === 'Experience') || 
                    (type === 'experienced' && steps[activeStep] === 'Projects')) && (
                    <Chip 
                      label="Optional" 
                      size="small" 
                      color="secondary" 
                      sx={{ ml: 2, fontWeight: 500 }} 
                    />
                  )}
                </Typography>
                
                {renderStepContent(activeStep)}

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    size="large"
                    sx={{ px: 4, borderRadius: 2 }}
                  >
                    Back
                  </Button>
                  
                  <Box>
                    {activeStep === steps.length - 1 ? (
                      <Button
                        variant="contained"
                        onClick={() => setShowPreview(true)}
                        size="large"
                        startIcon={<Preview />}
                        disabled={!selectedTemplate}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          px: 4,
                          borderRadius: 2,
                          fontWeight: 600
                        }}
                      >
                        Preview Resume
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        onClick={handleNext}
                        size="large"
                        disabled={activeStep === 0 && !selectedTemplate}
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          px: 4,
                          borderRadius: 2,
                          fontWeight: 600
                        }}
                      >
                        Next
                      </Button>
                    )}
                  </Box>
                </Box>
              </Paper>
              {/* AI Panel below forms */}
              <Paper sx={{ mt: 3, p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AutoAwesome /> AI Job Match & Writer
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Paste job description text here:</Typography>
                    <textarea value={jdText} onChange={(e)=>setJdText(e.target.value)} rows={7}
                      style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit' }}
                      placeholder="Paste JD text or summary..." />
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      {/* Role Presets */}
                      <Button size="small" variant="text" onClick={()=>{
                        // Frontend Engineer preset
                        setResumeData(prev => ({
                          ...prev,
                          summary: prev.summary || 'Frontend Engineer specializing in React, TypeScript, and performance-focused UI development. Experienced in building accessible, responsive interfaces and collaborating in product-driven teams.',
                          skills: Array.from(new Set([...(prev.skills||[]), 'React', 'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Redux', 'REST APIs', 'Vite', 'Webpack']))
                        }));
                        setSnackbar({ open:true, message:'Applied preset: Frontend Engineer', severity:'success' });
                      }}>Preset: Frontend</Button>
                      <Button size="small" variant="text" onClick={()=>{
                        // Backend Engineer preset
                        setResumeData(prev => ({
                          ...prev,
                          summary: prev.summary || 'Backend Engineer focused on Node.js, Express, and scalable API design. Strong in databases, security best practices, and cloud-native deployment.',
                          skills: Array.from(new Set([...(prev.skills||[]), 'Node.js', 'Express', 'MongoDB', 'PostgreSQL', 'Docker', 'JWT', 'Redis', 'Kubernetes']))
                        }));
                        setSnackbar({ open:true, message:'Applied preset: Backend Engineer', severity:'success' });
                      }}>Preset: Backend</Button>
                      <Button size="small" variant="text" onClick={()=>{
                        // Data Analyst preset
                        setResumeData(prev => ({
                          ...prev,
                          summary: prev.summary || 'Data Analyst skilled in Python, SQL, and visualization. Proven ability to translate business questions into data-driven insights and dashboards.',
                          skills: Array.from(new Set([...(prev.skills||[]), 'Python', 'Pandas', 'SQL', 'Tableau', 'Power BI', 'Statistics']))
                        }));
                        setSnackbar({ open:true, message:'Applied preset: Data Analyst', severity:'success' });
                      }}>Preset: Data Analyst</Button>
                      {/* Quick Imports */}
                      <Button variant="outlined" size="small" onClick={async ()=>{
                        const username = window.prompt('GitHub username to import projects from:');
                        if (!username) return;
                        try {
                          const { data } = await axios.post(`${api_url}/api/import/github`, { username });
                          if (Array.isArray(data.projects) && data.projects.length) {
                            setResumeData(prev => ({ ...prev, projects: [...(prev.projects || []), ...data.projects] }));
                            setSnackbar({ open: true, message: `Imported ${data.projects.length} projects from GitHub`, severity: 'success' });
                          } else {
                            setSnackbar({ open: true, message: 'No public repos found or import blocked', severity: 'info' });
                          }
                        } catch (e) {
                          setSnackbar({ open: true, message: 'GitHub import failed', severity: 'error' });
                        }
                      }}>Import GitHub</Button>
                      <Button variant="outlined" size="small" onClick={async ()=>{
                        const profileText = window.prompt('Paste LinkedIn profile text (Summary + Skills + Experience section):');
                        if (!profileText) return;
                        try {
                          const { data } = await axios.post(`${api_url}/api/import/linkedin`, { profileText });
                          setResumeData(prev => ({
                            ...prev,
                            summary: data.summary || prev.summary,
                            skills: Array.isArray(data.skills) && data.skills.length ? Array.from(new Set([...(prev.skills||[]), ...data.skills])) : prev.skills,
                            experience: Array.isArray(data.experience) && data.experience.length ? [ ...(prev.experience||[]), ...data.experience ] : prev.experience,
                            education: Array.isArray(data.education) && data.education.length ? [ ...(prev.education||[]), ...data.education ] : prev.education
                          }));
                          setSnackbar({ open: true, message: 'Imported from LinkedIn text', severity: 'success' });
                        } catch (e) {
                          setSnackbar({ open: true, message: 'LinkedIn import failed', severity: 'error' });
                        }
                      }}>Import LinkedIn</Button>
                      <Button variant="outlined" size="small" onClick={async ()=>{
                        if (!jdText.trim()) { setSnackbar({ open:true, message:'Paste JD text first', severity:'info'}); return; }
                        setAiBusy(true);
                        try {
                          const { data } = await axios.post(`${api_url}/api/parse-jd`, { jobDescription: jdText });
                          const topSkills = (data.skills || []).slice(0,10).join(', ');
                          setSnackbar({ open:true, message:`Parsed JD. Top skills: ${topSkills}`, severity:'success' });
                        } catch(e) { setSnackbar({ open:true, message:'Could not parse JD', severity:'error' }); }
                        finally { setAiBusy(false); }
                      }}>Parse JD</Button>
                      <Button variant="contained" size="small" disabled={aiBusy}
                        onClick={async ()=>{
                          if (!jdText.trim()) { setSnackbar({ open:true, message:'Paste JD text first', severity:'info'}); return; }
                          setAiBusy(true);
                          try {
                            const { data } = await axios.post(`${api_url}/api/tailor-resume`, { resumeData, jobDescription: jdText });
                            setResumeData(prev => ({ ...prev, summary: data.updated.summary, skills: data.updated.skills }));
                            setSnackbar({ open:true, message:'Tailored summary and skills to JD', severity:'success' });
                          } catch(e) { setSnackbar({ open:true, message:'Tailor failed', severity:'error' }); }
                          finally { setAiBusy(false); }
                        }}>Tailor Summary & Skills</Button>
                      <Button variant="outlined" size="small" startIcon={<Article />} disabled={aiBusy}
                        onClick={async ()=>{
                          if (!jdText.trim()) { setSnackbar({ open:true, message:'Paste JD text first', severity:'info'}); return; }
                          setAiBusy(true);
                          try {
                            const { data } = await axios.post(`${api_url}/api/generate-cover-letter`, { resumeData, jobDescription: jdText });
                            // Put cover letter into summary section temporarily for user copy
                            setResumeData(prev => ({ ...prev, summary: (prev.summary ? prev.summary + '\n\n' : '') + data.coverLetter }));
                            setSnackbar({ open:true, message:'Draft cover letter added under Summary', severity:'success' });
                          } catch(e) { setSnackbar({ open:true, message:'Cover letter failed', severity:'error' }); }
                          finally { setAiBusy(false); }
                        }}>Generate Cover Letter</Button>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>ATS Insights</Typography>
                    <Button size="small" variant="outlined" onClick={async ()=>{
                      setAiBusy(true);
                      try { const { data } = await axios.post(`${api_url}/api/detect-ats-issues`, { resumeData }); setAtsIssues(data); }
                      catch(e){ setSnackbar({ open:true, message:'ATS check failed', severity:'error' }); }
                      finally{ setAiBusy(false); }
                    }}>Run ATS Check</Button>
                    {atsIssues && (
                      <Box sx={{ mt: 2 }}>
                        {atsIssues.blockers?.length>0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>Blockers</Typography>
                            <ul style={{ marginTop: 4 }}>
                              {atsIssues.blockers.map((b,i)=>(<li key={i}>{b}</li>))}
                            </ul>
                          </Box>
                        )}
                        {atsIssues.warnings?.length>0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'warning.main' }}>Warnings</Typography>
                            <ul style={{ marginTop: 4 }}>
                              {atsIssues.warnings.map((w,i)=>(<li key={i}>{w}</li>))}
                            </ul>
                          </Box>
                        )}
                        {atsIssues.recommendations?.length>0 && (
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>Recommendations</Typography>
                            <ul style={{ marginTop: 4 }}>
                              {atsIssues.recommendations.map((r,i)=>(<li key={i}>{r}</li>))}
                            </ul>
                          </Box>
                        )}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </Paper>
              {/* Import/Export and Draft controls */}
              <Paper sx={{ mt: 2, p: 2, display: 'flex', gap: 1.5, alignItems: 'center', borderRadius: 2 }}>
                <Button size="small" variant="outlined" onClick={() => {
                  try {
                    const blob = new Blob([JSON.stringify({ resumeData, selectedTemplate }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url; a.download = 'resume-draft.json'; a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }}>Export Draft (JSON)</Button>
                <label style={{ display: 'inline-block' }}>
                  <input type="file" accept="application/json" style={{ display: 'none' }} onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    try {
                      const text = await file.text();
                      const { resumeData: rd, selectedTemplate: st } = JSON.parse(text);
                      if (rd) setResumeData(prev => ({ ...prev, ...rd }));
                      if (st) setSelectedTemplate(st);
                      setSnackbar({ open: true, message: 'Draft imported', severity: 'success' });
                    } catch { setSnackbar({ open: true, message: 'Invalid JSON file', severity: 'error' }); }
                    e.target.value = '';
                  }} />
                  <Button size="small" variant="outlined">Import Draft</Button>
                </label>
                <Button size="small" color="error" onClick={() => { localStorage.removeItem(draftKey); setSnackbar({ open:true, message:'Local draft cleared', severity:'success'}); }}>Clear Local Draft</Button>
                <Box sx={{ flex: 1 }} />
                <Button size="small" variant="contained" onClick={async ()=>{
                  try {
                    const { data } = await axios.post(`${api_url}/api/translate-text`, { text: JSON.stringify(resumeData), targetLang: 'hi' });
                    const translated = JSON.parse(data.text || '{}');
                    setResumeData(prev => ({ ...prev, ...translated }));
                    setSnackbar({ open:true, message:'Translated to Hindi', severity:'success' });
                  } catch {
                    setSnackbar({ open:true, message:'Hindi translation failed', severity:'error' });
                  }
                }}>Translate: Hindi</Button>
                <Button size="small" variant="contained" color="secondary" onClick={async ()=>{
                  try {
                    const { data } = await axios.post(`${api_url}/api/translate-text`, { text: JSON.stringify(resumeData), targetLang: 'es' });
                    const translated = JSON.parse(data.text || '{}');
                    setResumeData(prev => ({ ...prev, ...translated }));
                    setSnackbar({ open:true, message:'Translated to Spanish', severity:'success' });
                  } catch {
                    setSnackbar({ open:true, message:'Spanish translation failed', severity:'error' });
                  }
                }}>Translate: Spanish</Button>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ResumeBuilder;