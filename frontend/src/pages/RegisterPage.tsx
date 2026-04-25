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

import { LayoutGrid as Kanban } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import authService from '../services/authService';

const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const { mode } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      // Use authService to ensure axios is correctly handled
      await authService.simpleRegister(email, password, name);
      
      setSuccessMsg('User registered successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      console.error('Registration failed', err);
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Registration failed';
      setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
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
              Create your account
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 1 }}>{error}</Alert>}
          {successMsg && <Alert severity="success" sx={{ mb: 3, borderRadius: 1 }}>{successMsg}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Full Name"
              type="text"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              sx={{ 
                mb: 2.5,
                '& .MuiInputBase-root': { bgcolor: 'background.default' },
                '& .MuiInputLabel-root': { color: 'text.secondary' }
              }}
            />
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="off"
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
              autoComplete="new-password"
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
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign Up'}
            </Button>
          </form>

          <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" sx={{ color: '#4C9AFF', fontWeight: 600, textDecoration: 'none' }}>
                Log in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default RegisterPage;
