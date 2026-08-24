import { Box, styled } from '@mui/material';
import { User, Settings, Shield } from 'lucide-react';

const TabsContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: '8px',
  marginBottom: '32px',
  borderBottom: `1px solid ${theme.palette.divider}`,
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollbarWidth: 'none', // Firefox
  '&::-webkit-scrollbar': {
    display: 'none', // Chrome, Safari, Edge
  },
  [theme.breakpoints.down('sm')]: {
    gap: '4px',
    marginBottom: '24px',
  },
}));

const TabButton = styled(Box)(({ theme, active }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  padding: '12px 24px',
  fontSize: '15px',
  fontWeight: active ? 600 : 500,
  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
  backgroundColor: 'transparent',
  border: 'none',
  borderBottom: active ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  position: 'relative',
  bottom: '-1px',
  whiteSpace: 'nowrap',
  flex: '1',
  justifyContent: 'center',

  '&:hover': {
    color: theme.palette.primary.main,
    backgroundColor: 'rgba(221, 237, 0, 0.05)',
  },

  '& svg': {
    width: '20px',
    height: '20px',
    flexShrink: 0,
  },

  [theme.breakpoints.down('sm')]: {
    padding: '10px 12px',
    fontSize: '13px',
    gap: '6px',
    minWidth: 'auto',
  },

  [theme.breakpoints.down(400)]: {
    padding: '10px 8px',
    fontSize: '12px',
    gap: '4px',
  },
}));

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Preferences', icon: Settings },
  { id: 'account', label: 'Account', icon: Shield },
];

const TabNavigation = ({ activeTab, onTabChange }) => {
  return (
    <TabsContainer>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id ? 1 : 0}
            onClick={() => onTabChange(tab.id)}
          >
            <Icon />
            {tab.label}
          </TabButton>
        );
      })}
    </TabsContainer>
  );
};

export default TabNavigation;
