import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider, createTheme, responsiveFontSizes } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, CircularProgress } from '@mui/material';
import { store, persistor, RootState } from './store/store';
import { useAuth } from './hooks/useAuth';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KanbanBoard from './pages/KanbanBoard';
import ReportsPage from './pages/ReportsPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectBoardPage from './pages/ProjectBoardPage';
import './styles/global.css';
import { ThemeContextProvider } from './context/ThemeContext';

let theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#0C66E4',
    },
    background: {
      default: '#1d2125',
      paper: '#161b22',
    },
    text: {
      primary: '#B6C2CF',
      secondary: '#9FADBC',
    },
    divider: 'rgba(143, 155, 171, 0.1)',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    h4: { fontWeight: 600, color: '#FFFFFF' },
    h6: { fontWeight: 600, color: '#B6C2CF' },
    body2: { fontSize: '0.875rem' },
  },
  shape: {
    borderRadius: 3,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#1d2125',
          color: '#B6C2CF',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 3,
        },
        contained: {
          backgroundColor: '#0C66E4',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#0052CC',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#22272b',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#22272b',
          border: '1px solid rgba(143, 155, 171, 0.1)',
        },
      },
    },
  },
});

theme = responsiveFontSizes(theme);

const FullScreenLoader: React.FC = () => (
  <Box
    sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
    }}
  >
    <CircularProgress color="primary" size={44} thickness={4.5} />
  </Box>
);

const AppRoutes: React.FC = () => {
  const { checkAuth } = useAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setAuthChecked(true);
        return;
      }
      try {
        await checkAuth();
      } catch (error) {
        console.error('Auth bootstrap failed', error);
      } finally {
        setAuthChecked(true);
      }
    };
    bootstrapAuth();
  }, [checkAuth]);

  if (!authChecked) {
    return <FullScreenLoader />;
  }

  return (
    <Router>
      <Routes>
        {/* Root redirects to projects (like JIRA) */}
        <Route path="/" element={<Navigate to={isAuthenticated ? '/projects' : '/login'} replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/projects" replace /> : <LoginPage />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/projects" replace /> : <RegisterPage />} />

        <Route element={<PrivateRoute />}>
          {/* Projects dashboard */}
          <Route path="/projects" element={<ProjectsPage />} />
          {/* Project-scoped kanban board */}
          <Route path="/projects/:projectId/board" element={<ProjectBoardPage />} />
          <Route path="/projects/:projectId/reports" element={<ReportsPage />} />
          {/* Legacy board redirect */}
          <Route path="/board" element={<Navigate to="/projects" replace />} />
        </Route>

        <Route path="*" element={<Navigate to={isAuthenticated ? '/projects' : '/login'} replace />} />
      </Routes>
    </Router>
  );
};

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <PersistGate loading={<FullScreenLoader />} persistor={persistor}>
        <ThemeContextProvider>
          <AppRoutes />
        </ThemeContextProvider>
      </PersistGate>
    </Provider>
  );
};

export default App;
