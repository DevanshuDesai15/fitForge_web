import PropTypes from 'prop-types';
import { Box, Paper, Typography, useTheme } from '@mui/material';
import { ChartNoAxesCombined, Dumbbell, History, Home } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import shortLogo from '../../assets/shortLogo.svg';

const items = [
  { label: 'Home', path: '/', icon: Home },
  { label: 'Workout', path: '/workout', icon: Dumbbell },
  { label: 'History', path: '/history', icon: History },
  { label: 'Progress', path: '/progress', icon: ChartNoAxesCombined },
];

function isItemActive(pathname, path) {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function MobileBottomNav({ onStart }) {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const leftItems = items.slice(0, 2);
  const rightItems = items.slice(2);

  const renderItem = ({ label, path, icon: Icon }) => {
    const active = isItemActive(location.pathname, path);

    return (
      <Box
        key={path}
        component={NavLink}
        to={path}
        aria-current={active ? 'page' : undefined}
        sx={{
          minWidth: 0,
          minHeight: 52,
          px: 0.5,
          py: 0.75,
          borderRadius: '12px',
          color: active ? 'primary.main' : 'rgba(255,255,255,0.68)',
          backgroundColor: active ? 'rgba(221,237,0,0.08)' : 'transparent',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.5,
          transition: 'color 180ms ease, background-color 180ms ease',
          '&:hover': {
            color: active ? 'primary.main' : 'common.white',
            backgroundColor: active ? 'rgba(221,237,0,0.1)' : 'rgba(255,255,255,0.05)',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
      >
        <Icon size={21} aria-hidden="true" />
        <Typography component="span" sx={{ fontSize: '0.68rem', fontWeight: active ? 700 : 600, lineHeight: 1 }}>
          {label}
        </Typography>
      </Box>
    );
  };

  const handleStart = () => {
    if (onStart) {
      onStart();
      return;
    }
    navigate('/workout/start');
  };

  return (
    <Paper
      component="nav"
      aria-label="Primary navigation"
      elevation={0}
      sx={{
        '--ff-mobile-nav-height': '88px',
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1200,
        px: 1,
        pb: 'calc(8px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, transparent 0%, rgba(18,18,18,0.92) 34%)',
        overflow: 'visible',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          display: 'grid',
          gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
          alignItems: 'end',
          gap: 0.5,
          minHeight: 64,
          px: 0.5,
          py: 0.75,
          border: '1px solid rgba(221,237,0,0.13)',
          borderRadius: '28px',
          background: 'linear-gradient(180deg, rgba(35,35,35,0.98), rgba(20,20,20,0.99))',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {leftItems.map(renderItem)}
        <Box sx={{ position: 'relative', minHeight: 52 }}>
          <Box sx={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <Box
              component="button"
              type="button"
              aria-label="Start workout"
              onClick={handleStart}
              sx={{
                width: 66,
                height: 66,
                p: 0,
                border: '1px solid rgba(221,237,0,0.16)',
                background: 'linear-gradient(180deg, rgba(40,45,20,0.98) 0%, rgba(24,29,16,1) 100%)',
                color: 'primary.main',
                clipPath: 'polygon(50% 0%, 88% 20%, 88% 74%, 50% 100%, 12% 74%, 12% 20%)',
                boxShadow: '0 10px 28px rgba(0,0,0,0.42)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { background: 'linear-gradient(180deg, rgba(48,54,24,1) 0%, rgba(30,36,19,1) 100%)' },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.common.white}`,
                  outlineOffset: 3,
                },
              }}
            >
              <Box component="img" src={shortLogo} alt="" sx={{ width: 34, height: 34 }} />
            </Box>
            <Typography component="span" sx={{ display: 'block', mt: 0.25, color: 'primary.main', fontSize: '0.68rem', fontWeight: 700, lineHeight: 1 }}>
              Start
            </Typography>
          </Box>
        </Box>
        {rightItems.map(renderItem)}
      </Box>
    </Paper>
  );
}

MobileBottomNav.propTypes = {
  onStart: PropTypes.func,
};
