import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { api_url } from '../helper/Helper';
import { Box, Container, Paper, Typography, CircularProgress, Alert, Button, Stack, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { templateComponents } from '../components/templates';

export default function PublicResume() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${api_url}/api/r/${slug}`);
        setData(res.data);
      } catch (e) {
        setError(e.response?.data?.error || 'Public resume not found');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container sx={{ py: 6 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  const Template = data?.selectedTemplate?.id && templateComponents[data.selectedTemplate.id]
    ? templateComponents[data.selectedTemplate.id]
    : templateComponents['modern-professional'];

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container maxWidth="md" sx={{ py: 6 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2 }}>
            {data?.title || 'Resume'} {data?.versionLabel ? `(${data.versionLabel})` : ''}
          </Typography>
          {typeof data?.analytics?.publicViews === 'number' && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Views: {data.analytics.publicViews}
            </Typography>
          )}
          {data?.analytics?.viewsByDay && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Last views</Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 40, mt: 0.5 }}>
                {Object.entries(data.analytics.viewsByDay)
                  .sort(([a],[b]) => a.localeCompare(b))
                  .slice(-14)
                  .map(([day, count], idx, arr) => {
                    const max = Math.max(...arr.map(x => x[1]));
                    const h = max ? (Math.max(2, Math.round((count / max) * 36))) : 2;
                    return <Box key={day} sx={{ width: 6, height: h, bgcolor: 'primary.main', borderRadius: 1 }} title={`${day}: ${count}`} />
                  })}
              </Box>
              <Divider sx={{ my: 1 }} />
            </Box>
          )}
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Button size="small" variant="outlined" onClick={async ()=>{
              try { await navigator.clipboard.writeText(window.location.href); } catch {}
            }}>Copy Link</Button>
            <Button size="small" variant="contained" onClick={async ()=>{
              try {
                const res = await axios.post(`${api_url}/api/download-resume`, data, { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([res.data]));
                const a = document.createElement('a');
                a.href = url;
                a.download = `${data?.personalDetails?.fullName || 'resume'}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
              } catch {}
            }}>Download PDF</Button>
          </Stack>
          <Paper sx={{ p: 0, borderRadius: 2, overflow: 'hidden', background: 'white' }}>
            {Template && <Template resumeData={data} />}
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
