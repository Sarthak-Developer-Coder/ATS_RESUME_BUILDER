import {
  TextField,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { api_url } from './../../helper/Helper';

function SummaryForm({ data, type, personalDetails, onChange }) {
  const [summary, setSummary] = useState(data || '');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    onChange(summary);
  }, [summary, onChange]);

  const generateSummary = async () => {
    setGenerating(true);
    setError('');

    try {
      const response = await axios.post(`${api_url}/api/generate-summary`, {
        type,
        personalDetails
      });
      
      setSummary(response.data.summary);
    } catch (error) {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const polish = async () => {
    if (!summary.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const { data } = await axios.post(`${api_url}/api/polish-text`, { text: summary });
      setSummary(data.text || summary);
    } catch (e) {
      setError('Failed to polish text');
    } finally { setGenerating(false); }
  };

  const translate = async (target) => {
    if (!summary.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const { data } = await axios.post(`${api_url}/api/translate-text`, { text: summary, target });
      setSummary(data.text || summary);
    } catch (e) {
      setError('Failed to translate text');
    } finally { setGenerating(false); }
  };

  return (
    <Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        {type === 'fresher' 
          ? 'A professional summary highlights your key qualifications and career objectives as a new graduate or entry-level professional.'
          : 'An executive summary showcases your experience, achievements, and value proposition as a seasoned professional.'
        }
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={generating ? <CircularProgress size={20} /> : <AutoAwesome />}
          onClick={generateSummary}
          disabled={generating || !personalDetails.fullName}
          sx={{ mb: 2 }}
        >
          {generating ? 'Generating...' : 'Generate with AI'}
        </Button>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button size="small" variant="outlined" disabled={generating || !summary.trim()} onClick={polish}>Polish</Button>
          <Button size="small" variant="outlined" disabled={generating || !summary.trim()} onClick={() => translate('en')}>Translate EN</Button>
          <Button size="small" variant="outlined" disabled={generating || !summary.trim()} onClick={() => translate('hi')}>Translate HI</Button>
        </Box>
        
        {!personalDetails.fullName && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Please fill in your personal details first to generate an AI summary.
          </Alert>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
      </Box>

      <TextField
        fullWidth
        multiline
        rows={6}
        label={type === 'fresher' ? 'Professional Summary' : 'Executive Summary'}
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        placeholder={
          type === 'fresher'
            ? 'Write a brief summary highlighting your education, skills, and career objectives...'
            : 'Write a compelling summary of your professional experience, key achievements, and expertise...'
        }
        helperText={`${summary.length}/500 characters recommended`}
      />
    </Box>
  );
}

export default SummaryForm;
