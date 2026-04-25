import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Box, Typography, Alert, InputAdornment,
} from '@mui/material';
import { FolderKanban } from 'lucide-react';
import projectService, { Project } from '../services/projectService';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (project: Project) => void;
}

const CreateProjectModal: React.FC<Props> = ({ open, onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [keyEdited, setKeyEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNameChange = (val: string) => {
    setName(val);
    if (!keyEdited) {
      // Auto-generate key from name: first letters of each word, max 6 chars
      const autoKey = val
        .split(' ')
        .filter(Boolean)
        .map(w => w[0])
        .join('')
        .toUpperCase()
        .substring(0, 6) || val.replace(/[^A-Za-z]/g, '').toUpperCase().substring(0, 6);
      setKey(autoKey);
    }
  };

  const handleKeyChange = (val: string) => {
    setKey(val.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10));
    setKeyEdited(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !key.trim()) {
      setError('Project name and key are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const project = await projectService.createProject(name.trim(), key.trim(), description.trim() || undefined);
      // Reset
      setName(''); setKey(''); setDescription(''); setKeyEdited(false);
      onCreated(project);
    } catch (e: any) {
      setError(e.response?.data?.error || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName(''); setKey(''); setDescription(''); setError(''); setKeyEdited(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ bgcolor: '#0C66E4', p: 0.8, borderRadius: 1, display: 'flex' }}>
            <FolderKanban size={20} color="white" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>Create Project</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>Set up a new project to organize your work</Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important' }}>
        {error && <Alert severity="error" onClose={() => setError('')}>{error}</Alert>}

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, color: 'text.primary' }}>
            Project Name <span style={{ color: '#FF5630' }}>*</span>
          </Typography>
          <TextField
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Vibe Flow Mobile App"
            size="small"
            fullWidth
            disabled={loading}
            autoFocus
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, color: 'text.primary' }}>
            Project Key <span style={{ color: '#FF5630' }}>*</span>
          </Typography>
          <TextField
            value={key}
            onChange={(e) => handleKeyChange(e.target.value)}
            placeholder="e.g. VF"
            size="small"
            fullWidth
            disabled={loading}
            slotProps={{ htmlInput: { maxLength: 10 } }}
            helperText="Short unique identifier for this project (2-10 uppercase letters)"
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.8, color: 'text.primary' }}>
            Description <span style={{ color: '#8C9BAB', fontWeight: 400 }}>(optional)</span>
          </Typography>
          <TextField
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            size="small"
            fullWidth
            multiline
            rows={3}
            disabled={loading}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading} color="inherit" sx={{ fontWeight: 600 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || !name.trim() || !key.trim()}
          sx={{ fontWeight: 700, px: 3 }}
        >
          {loading ? 'Creating...' : 'Create Project'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateProjectModal;
