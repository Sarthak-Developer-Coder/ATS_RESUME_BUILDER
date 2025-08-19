import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Grid,
  IconButton,
  Checkbox,
  FormControlLabel
} from '@mui/material';
import { Add, Delete, AutoFixHigh } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_url } from '../../helper/Helper';

function ExperienceForm({ data, onChange }) {
  const [experienceList, setExperienceList] = useState(data.length > 0 ? data : [
    {
      jobTitle: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      currentJob: false,
      responsibilities: ''
    }
  ]);

  useEffect(() => {
    onChange(experienceList);
  }, [experienceList, onChange]);

  const addExperience = () => {
    setExperienceList([
      ...experienceList,
      {
        jobTitle: '',
        company: '',
        location: '',
        startDate: '',
        endDate: '',
        currentJob: false,
        responsibilities: ''
      }
    ]);
  };

  const removeExperience = (index) => {
    if (experienceList.length > 1) {
      setExperienceList(experienceList.filter((_, i) => i !== index));
    }
  };

  const updateExperience = (index, field, value) => {
    const updated = experienceList.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setExperienceList(updated);
  };

  const optimizeAllBullets = async () => {
    try {
      const { data } = await axios.post(`${api_url}/api/optimize-bullets`, {
        experience: experienceList
      });
      const suggestions = data?.bullets || [];
      // Group by experience index based on order
      const updated = experienceList.map((exp) => ({ ...exp }));
      let cursor = 0;
      for (let i = 0; i < updated.length; i++) {
        const exp = updated[i];
  const lines = String(exp.responsibilities || '').split(/\r?\n|•|\u2022|-|\*/).filter(Boolean);
        const slice = suggestions.slice(cursor, cursor + lines.length);
        cursor += lines.length;
        const newLines = slice.map(s => s.suggestion || s.original).filter(Boolean);
        if (newLines.length) {
          exp.responsibilities = '• ' + newLines.join('\n• ');
        }
      }
      setExperienceList(updated);
    } catch (e) {
      // best-effort; ignore errors
      console.error('Optimize bullets failed', e);
    }
  };

  const polishResponsibilities = async (index) => {
    try {
      const text = experienceList[index]?.responsibilities || '';
      if (!text.trim()) return;
      const { data } = await axios.post(`${api_url}/api/polish-text`, { text });
      updateExperience(index, 'responsibilities', data.text || text);
    } catch (e) {
      // ignore
    }
  };

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Add your professional experience. Start with your most recent position first.
      </Typography>

  {experienceList.map((experience, index) => (
        <Card key={index} sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">
                Experience {index + 1}
              </Typography>
              {experienceList.length > 1 && (
                <IconButton
                  color="error"
                  onClick={() => removeExperience(index)}
                >
                  <Delete />
                </IconButton>
              )}
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Job Title"
                  value={experience.jobTitle}
                  onChange={(e) => updateExperience(index, 'jobTitle', e.target.value)}
                  placeholder="Software Engineer"
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Company"
                  value={experience.company}
                  onChange={(e) => updateExperience(index, 'company', e.target.value)}
                  placeholder="Tech Corp Inc."
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Location"
                  value={experience.location}
                  onChange={(e) => updateExperience(index, 'location', e.target.value)}
                  placeholder="San Francisco, CA"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="month"
                  value={experience.startDate}
                  onChange={(e) => updateExperience(index, 'startDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="End Date"
                  type="month"
                  value={experience.endDate}
                  onChange={(e) => updateExperience(index, 'endDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  disabled={experience.currentJob}
                />
              </Grid>
              
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={experience.currentJob}
                      onChange={(e) => updateExperience(index, 'currentJob', e.target.checked)}
                    />
                  }
                  label="I currently work here"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={5}
                  label="Key Responsibilities & Achievements"
                  value={experience.responsibilities}
                  onChange={(e) => updateExperience(index, 'responsibilities', e.target.value)}
                  placeholder="• Led a team of 5 developers to build a customer portal
• Increased system performance by 40% through code optimization
• Implemented agile methodologies reducing project delivery time by 25%"
                />
              </Grid>
              <Grid item xs={12} sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" onClick={optimizeAllBullets}>
                  Optimize All Bullets (AI)
                </Button>
                <Button variant="text" size="small" startIcon={<AutoFixHigh />} onClick={() => polishResponsibilities(index)}>
                  Polish This Section
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}

      <Button
        variant="outlined"
        startIcon={<Add />}
        onClick={addExperience}
        sx={{ mt: 2 }}
      >
        Add Another Experience
      </Button>
    </Box>
  );
}

export default ExperienceForm;