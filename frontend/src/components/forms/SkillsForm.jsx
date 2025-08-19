import {
  Box,
  Typography,
  TextField,
  Button,
  Chip,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { AutoAwesome, Add, Psychology } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_url } from '../../helper/Helper';

function SkillsForm({ data, personalDetails, onChange }) {
  const [skills, setSkills] = useState(data || []);
  const [newSkill, setNewSkill] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [jdText, setJdText] = useState('');

  useEffect(() => {
    onChange(skills);
  }, [skills, onChange]);

  const addSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addSkill();
    }
  };

  const generateSkills = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${api_url}/api/generate-skills`, {
        personalDetails,
        existingSkills: skills
      });
      
      const newSkills = response.data.skills.filter(skill => !skills.includes(skill));
      setSkills([...skills, ...newSkills]);
    } catch (error) {
      setError('Failed to generate skills. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const suggestFromJD = async () => {
    setGenerating(true);
    setError('');
    try {
      if (!jdText.trim()) {
        setError('Paste a job description to suggest skills');
        return;
      }
      const { data } = await axios.post(`${api_url}/api/parse-jd`, { jobDescription: jdText });
      const jdSkills = Array.isArray(data.skills) ? data.skills : [];
      const merged = Array.from(new Set([...skills, ...jdSkills.slice(0, 20)]));
      setSkills(merged);
    } catch (e) {
      setError('Failed to parse JD for skills');
    } finally {
      setGenerating(false);
    }
  };

  // categories were unused; removed to reduce noise

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Add your technical and soft skills. Include programming languages, frameworks, tools, and other relevant abilities.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesome />}
          onClick={generateSkills}
          disabled={generating || !personalDetails.fullName}
          sx={{ mb: 2 }}
        >
          {generating ? 'Generating...' : 'Generate Skills with AI'}
        </Button>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'start', mb: 2 }}>
          <textarea
            rows={4}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste job description text to suggest JD-specific skills"
            style={{ flex: 1, width: '100%', padding: 10, borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit' }}
          />
          <Button
            variant="outlined"
            startIcon={<Psychology />}
            onClick={suggestFromJD}
            disabled={generating}
            sx={{ height: 40 }}
          >
            Suggest from JD
          </Button>
        </Box>
        
        {!personalDetails.fullName && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please fill in your personal details first to generate relevant skills.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={8}>
          <TextField
            fullWidth
            label="Add a Skill"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="e.g., JavaScript, Leadership, Problem Solving"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={addSkill}
            disabled={!newSkill.trim()}
            sx={{ 
              height: '56px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}
          >
            Add Skill
          </Button>
        </Grid>
      </Grid>

      {skills.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Your Skills ({skills.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            {skills.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                onDelete={() => removeSkill(skill)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      )}

      <Alert severity="info">
        <Typography variant="body2">
          <strong>Tip:</strong> Include a mix of technical skills (programming languages, tools) and soft skills (leadership, communication) relevant to your target role.
        </Typography>
      </Alert>
    </Box>
  );
}

export default SkillsForm;
