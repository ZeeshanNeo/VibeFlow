import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { LayoutGrid as Kanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import projectService from '../services/projectService';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useAuth();
  const { mode } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      
      // Try to fetch projects to see if we can redirect straight to a board
      try {
        const projects = await projectService.getProjects();
        if (projects.length === 1) {
          navigate(`/projects/${projects[0].id}/board`);
        } else {
          navigate('/projects');
        }
      } catch {
        navigate('/projects');
      }
    } catch (err) {
      console.error('Login failed', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: mode === 'dark' ? 'radial-gradient(circle at 50% 50%, rgba(12, 102, 228, 0.08) 0%, transparent 50%)' : 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 5,
            width: 420,
            textAlign: 'center',
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Box sx={{ bgcolor: '#0C66E4', p: 1, borderRadius: 1, mb: 2 }}>
              <Kanban color="white" size={32} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              Log in to your account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ 
                mb: 2.5,
                '& .MuiInputBase-root': { bgcolor: 'background.default' },
                '& .MuiInputLabel-root': { color: 'text.secondary' }
              }}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ 
                mb: 3.5,
                '& .MuiInputBase-root': { bgcolor: 'background.default' },
                '& .MuiInputLabel-root': { color: 'text.secondary' }
              }}
            />
            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.2, fontSize: '1rem' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
            </Button>
          </form>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Don't have an account?{' '}
              <Link component={RouterLink} to="/register" sx={{ color: '#4C9AFF', fontWeight: 600, textDecoration: 'none' }}>
                Sign up
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default LoginPage;
