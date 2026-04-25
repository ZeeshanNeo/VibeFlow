import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { CircularProgress, Box } from '@mui/material';

const PrivateRoute: React.FC = () => {
  const { isAuthenticated, loading } = useSelector((state: RootState) => state.auth);
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateRoute;