//ResumePreview.jsx

import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import { ArrowBack, Save, Download, Palette, Share, Print } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useState } from 'react';
import axios from 'axios';
import { api_url } from '../helper/Helper';
import { templateComponents, TemplateSelector } from './templates';

function ResumePreview({ 
  resumeData, 
  onBack, 
  onSave, 
  onDownload, 
  saving, 
  downloading,
  selectedTemplate,
  onTemplateChange 
}) {
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [sharing, setSharing] = useState(false);
  const [isPublic, setIsPublic] = useState(!!resumeData?.isPublic);

  const computeLocalShareUrl = (url) => {
    try {
      const parts = String(url).split('/share/');
      if (parts.length === 2) {
        return `${window.location.origin}/share/${parts[1]}`;
      }
      return url;
    } catch {
      return url;
    }
  };

  // Initialize share state from resumeData
  React.useEffect(() => {
    setIsPublic(!!resumeData?.isPublic);
    if (resumeData?.shareSlug) {
      setShareUrl(`${window.location.origin}/share/${resumeData.shareSlug}`);
    }
  }, [resumeData]);

  // Get the template component
  const TemplateComponent = selectedTemplate 
    ? templateComponents[selectedTemplate.id] 
    : templateComponents['modern-professional'];

  const handleTemplateSelect = (template) => {
    onTemplateChange(template);
    setTemplateDialogOpen(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      {/* Navigation */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Resume Preview
          </Typography>
          
          {/* Template Info */}
          {selectedTemplate && (
            <Chip
              icon={selectedTemplate.icon}
              label={selectedTemplate.name}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 600,
                mr: 2
              }}
            />
          )}
          
          <Button
            color="inherit"
            startIcon={<Palette />}
            onClick={() => setTemplateDialogOpen(true)}
            sx={{ mr: 2 }}
          >
            Change Template
          </Button>
          <Button
            color="inherit"
            startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
            onClick={onSave}
            disabled={saving}
            sx={{ mr: 2 }}
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            color="inherit"
            startIcon={downloading ? <CircularProgress size={20} color="inherit" /> : <Download />}
            onClick={onDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
          <Button
            color="inherit"
            startIcon={<Print />}
            onClick={() => window.print()}
            sx={{ ml: 1 }}
          >
            Print
          </Button>
          {isPublic ? (
            <>
              <Button
                color="inherit"
                startIcon={<Share />}
                disabled={sharing || !resumeData?._id}
                onClick={async ()=>{
                  try {
                    if (!shareUrl) {
                      setSharing(true);
                      const { data } = await axios.post(`${api_url}/api/resume/${resumeData._id}/share`, { isPublic: true });
                      if (data.shareUrl) {
                        const fixed = computeLocalShareUrl(data.shareUrl);
                        setShareUrl(fixed);
                        await navigator.clipboard.writeText(fixed);
                      }
                    } else {
                      await navigator.clipboard.writeText(shareUrl);
                    }
                  } finally { setSharing(false); }
                }}
                sx={{ ml: 1 }}
              >
                {sharing ? 'Copying...' : (shareUrl ? 'Copy Link' : 'Get Link')}
              </Button>
              <Button
                color="inherit"
                disabled={sharing || !resumeData?._id}
                onClick={async ()=>{
                  try {
                    setSharing(true);
                    await axios.post(`${api_url}/api/resume/${resumeData._id}/share`, { isPublic: false });
                    setIsPublic(false);
                    setShareUrl('');
                  } finally { setSharing(false); }
                }}
                sx={{ ml: 1 }}
              >
                Unpublish
              </Button>
            </>
          ) : (
            <Button
              color="inherit"
              startIcon={<Share />}
              disabled={sharing || !resumeData?._id}
              onClick={async ()=>{
                try {
                  setSharing(true);
                  const versionLabel = window.prompt('Optional: add a version label for this share (e.g., “v1 for Acme”). Leave blank to skip.');
                  const { data } = await axios.post(`${api_url}/api/resume/${resumeData._id}/share`, { isPublic: true, versionLabel: versionLabel || undefined });
                  setIsPublic(true);
                  if (data.shareUrl) {
                    const fixed = computeLocalShareUrl(data.shareUrl);
                    setShareUrl(fixed);
                    await navigator.clipboard.writeText(fixed);
                  }
                } finally { setSharing(false); }
              }}
              sx={{ ml: 1 }}
            >
              {sharing ? 'Publishing...' : 'Publish & Copy Link'}
            </Button>
          )}
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Paper 
            className="resume-sheet"
            sx={{ 
              minHeight: '297mm',
              backgroundColor: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              overflow: 'hidden',
              borderRadius: 2
            }}
          >
            {/* Render the selected template */}
            {TemplateComponent && <TemplateComponent resumeData={resumeData} />}
          </Paper>
        </motion.div>
      </Container>

      {/* Template Selection Dialog */}
      <Dialog
        open={templateDialogOpen}
        onClose={() => setTemplateDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          Choose Resume Template
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          <TemplateSelector
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            resumeData={resumeData}
          />
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setTemplateDialogOpen(false)}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ResumePreview;