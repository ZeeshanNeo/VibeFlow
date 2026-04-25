import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};

export const ThemeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem('theme-mode');
    return (saved as ThemeMode) || 'dark';
  });

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    localStorage.setItem('theme-mode', mode);
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#0C66E4', // Jira Blue
      },
      secondary: {
        main: '#1F845A', // Jira Green
      },
      background: {
        default: mode === 'dark' ? '#1d2125' : '#EBEDF0',
        paper: mode === 'dark' ? '#161b22' : '#FFFFFF',
      },
      text: {
        primary: mode === 'dark' ? '#B6C2CF' : '#172B4D',
        secondary: mode === 'dark' ? '#8C9BAB' : '#44546F',
      },
      divider: mode === 'dark' ? 'rgba(143, 155, 171, 0.15)' : 'rgba(9, 30, 66, 0.12)',
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      h4: { fontWeight: 700 },
      h6: { fontWeight: 700 },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            transition: 'background-color 0.2s ease, color 0.2s ease',
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
            transition: 'background-color 0.2s ease, border-color 0.2s ease',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: mode === 'dark' ? '#22272b' : '#FFFFFF',
            border: mode === 'dark' ? '1px solid rgba(143, 155, 171, 0.1)' : '1px solid rgba(9, 30, 66, 0.08)',
            boxShadow: mode === 'dark' ? 'none' : '0 1px 1px rgba(9, 30, 66, 0.25), 0 0 1px rgba(9, 30, 66, 0.31)',
          },
        },
      },
    },
  });

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};
