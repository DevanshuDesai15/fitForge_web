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

const HEX_CLIP = 'polygon(50% 0%, 88% 20%, 88% 74%, 50% 100%, 12% 74%, 12% 20%)';
const NAV_GRADIENT = 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(30,30,30,0.98) 100%)';

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
          minHeight: 46,
          px: 0.5,
          py: '5px',
          borderRadius: '16px',
          color: active ? 'primary.main' : 'rgba(255,255,255,0.78)',
          transform: active ? 'translateY(-2px)' : 'none',
          backgroundColor: active ? 'rgba(221,237,0,0.08)' : 'transparent',
          textDecoration: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          transition: 'color 180ms ease, background-color 180ms ease, transform 180ms ease',
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
        <Typography component="span" sx={{ fontSize: '0.7rem', fontWeight: active ? 700 : 600, lineHeight: 1.15 }}>
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
          alignItems: 'center',
          gap: '4px',
          px: '4px',
          py: 1,
          borderTop: '1px solid rgba(221,237,0,0.13)',
          borderRadius: '28px',
          background: NAV_GRADIENT,
          boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* The bar is notched behind the hex so the overhang reads as part of it. */}
        <Box aria-hidden="true" sx={{ position: 'absolute', left: '50%', top: -28, transform: 'translateX(-50%)', width: 96, height: 96, borderRadius: '28px', clipPath: HEX_CLIP, background: NAV_GRADIENT }} />
        {leftItems.map(renderItem)}
        <Box sx={{ position: 'relative', minHeight: 46 }}>
          <Box sx={{ position: 'absolute', left: '50%', bottom: 4, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
            <Box
              component="button"
              type="button"
              aria-label="Start workout"
              onClick={handleStart}
              sx={{
                width: 72,
                height: 72,
                p: 0,
                border: '1px solid rgba(221,237,0,0.16)',
                background: 'linear-gradient(180deg, rgba(40,45,20,0.98) 0%, rgba(24,29,16,1) 100%)',
                color: 'primary.main',
                clipPath: HEX_CLIP,
                boxShadow: '0 10px 28px rgba(0,0,0,0.34)',
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
              <Box component="img" src={shortLogo} alt="" sx={{ height: 30, width: 'auto' }} />
            </Box>
            <Typography component="span" sx={{ display: 'block', color: 'primary.main', fontSize: '0.7rem', fontWeight: 700, lineHeight: 1.15 }}>
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
