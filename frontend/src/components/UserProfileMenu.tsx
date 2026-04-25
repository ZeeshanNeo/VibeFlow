import React, { useState } from 'react';
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
} from '@mui/material';
import {
  LogOut,
  User as UserIcon,
  CircleDot,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';

const UserProfileMenu: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const { mode } = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openSettings, setOpenSettings] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <Avatar
        onClick={handleClick}
        sx={{
          width: 32,
          height: 32,
          ml: 1,
          bgcolor: '#0C66E4',
          fontSize: '0.85rem',
          cursor: 'pointer',
          border: '2px solid transparent',
          '&:hover': {
            border: `2px solid ${mode === 'dark' ? '#4C9AFF' : '#0C66E4'}`,
          },
          transition: 'all 0.2s',
        }}
      >
        {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
      </Avatar>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              mt: 1.5,
              width: 320,
              overflow: 'visible',
              filter: 'drop-shadow(0px 4px 20px rgba(0,0,0,0.1))',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
                borderLeft: '1px solid',
                borderTop: '1px solid',
                borderColor: 'divider',
              },
            },
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2.5, py: 2 }}>
          <Typography variant="overline" sx={{ color: 'text.secondary', fontWeight: 700, letterSpacing: '0.05em' }}>
            Account
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1.5 }}>
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: '#0C66E4',
                fontSize: '1.2rem',
                fontWeight: 600,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : (user?.email?.charAt(0).toUpperCase() || 'U')}
            </Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Unknown User'}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.email || 'No email provided'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <CircleDot size={12} color="#1F845A" />
                <Typography variant="caption" sx={{ color: '#1F845A', fontWeight: 600 }}>Active Now</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        <Divider sx={{ mb: 1 }} />

        <MenuItem
          onClick={() => {
            handleClose();
            setNameInput(user?.name || '');
            setEmailInput(user?.email || '');
            setErrorMsg('');
            setOpenSettings(true);
          }}
          sx={{ py: 1.5, px: 2.5, gap: 1.5 }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: 'text.secondary' }}>
            <UserIcon size={18} />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 500, color: 'text.primary' }}>Profile Settings</Typography>}
          />
        </MenuItem>

        <Divider sx={{ my: 1 }} />

        <MenuItem
          onClick={() => {
            handleClose();
            logout();
          }}
          sx={{ py: 1.5, px: 2.5, gap: 1.5, '&:hover': { bgcolor: 'rgba(255, 86, 48, 0.08)' } }}
        >
          <ListItemIcon sx={{ minWidth: 'auto !important', color: '#FF5630' }}>
            <LogOut size={18} />
          </ListItemIcon>
          <ListItemText
            primary={<Typography variant="body2" sx={{ fontWeight: 600, color: '#FF5630' }}>Logout</Typography>}
          />
        </MenuItem>
      </Menu>

      <Dialog open={openSettings} onClose={() => !loading && setOpenSettings(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Profile Settings</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
          {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
          <TextField
            label="Name"
            variant="outlined"
            size="small"
            fullWidth
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            disabled={loading}
          />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            size="small"
            fullWidth
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenSettings(false)} disabled={loading} color="inherit">Cancel</Button>
          <Button
            variant="contained"
            disabled={loading || !emailInput}
            onClick={async () => {
              try {
                setLoading(true);
                setErrorMsg('');
                await updateProfile(nameInput, emailInput);
                setOpenSettings(false);
              } catch (err: any) {
                setErrorMsg(err.message || 'Failed to update profile');
              } finally {
                setLoading(false);
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfileMenu;
