import PropTypes from 'prop-types';
import { Tab, Tabs } from '@mui/material';

export default function MobileTabs({ tabs, value, onChange, variant = 'pill', ariaLabel, sx }) {
  return (
    <Tabs
      value={value}
      onChange={(_, nextValue) => onChange(nextValue)}
      aria-label={ariaLabel}
      variant="fullWidth"
      sx={{
        minHeight: 44,
        ...(variant === 'pill' && {
          p: 0.5,
          borderRadius: '999px',
          backgroundColor: 'rgba(255,255,255,0.06)',
          '& .MuiTabs-indicator': { display: 'none' },
          '& .MuiTab-root': {
            minHeight: 36,
            minWidth: 0,
            px: 1,
            borderRadius: '999px',
            color: 'text.muted',
            textTransform: 'none',
            fontWeight: 700,
          },
          '& .MuiTab-root.Mui-selected': {
            color: 'primary.contrastText',
            backgroundColor: 'primary.main',
          },
        }),
        ...(variant === 'underline' && {
          '& .MuiTab-root': { minHeight: 44, minWidth: 0, textTransform: 'none', fontWeight: 700 },
          '& .MuiTabs-indicator': { height: 2, borderRadius: 2 },
        }),
        ...sx,
      }}
    >
      {tabs.map((tab) => <Tab key={tab.id} value={tab.id} label={tab.label} />)}
    </Tabs>
  );
}

MobileTabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired })).isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['pill', 'underline']),
  ariaLabel: PropTypes.string.isRequired,
  sx: PropTypes.object,
};
