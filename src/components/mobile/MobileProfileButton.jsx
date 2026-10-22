import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar, ButtonBase } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../hooks/useProfile';

// The Mobile Kit pins one profile avatar to the top-right of every tab screen. It steps aside on
// pushed screens (detail, editors) where a back button owns that corner, so those screens call
// useHideProfileButton() instead of the button knowing about each of them.
const TAB_PATHS = ['/', '/workout', '/history', '/progress'];
const HideContext = createContext(null);

export function ProfileButtonProvider({ children }) {
  const [hiders, setHiders] = useState(0);
  const register = useCallback(() => {
    setHiders((n) => n + 1);
    return () => setHiders((n) => n - 1);
  }, []);
  const value = useMemo(() => ({ hidden: hiders > 0, register }), [hiders, register]);
  return <HideContext.Provider value={value}>{children}</HideContext.Provider>;
}

ProfileButtonProvider.propTypes = { children: PropTypes.node.isRequired };

export function useHideProfileButton(active = true) {
  const register = useContext(HideContext)?.register;
  useEffect(() => (active && register ? register() : undefined), [active, register]);
}

export default function MobileProfileButton() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { profile } = useProfile();
  const hidden = useContext(HideContext)?.hidden;

  if (hidden || !TAB_PATHS.includes(pathname)) return null;

  const name = profile?.display_name || currentUser?.displayName || currentUser?.email || 'Member';
  return (
    <ButtonBase
      aria-label="Open profile"
      onClick={() => navigate('/profile')}
      sx={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top))',
        right: 14,
        zIndex: 1100,
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1px solid',
        borderColor: 'border.strong',
        backgroundColor: 'background.paper',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Avatar src={profile?.avatar_url || currentUser?.photoURL || undefined} alt="" sx={{ width: 38, height: 38, bgcolor: 'transparent', color: 'text.primary', fontWeight: 700, fontSize: 15 }}>
        {name.charAt(0).toUpperCase()}
      </Avatar>
    </ButtonBase>
  );
}
