import PropTypes from 'prop-types';
import { ArrowLeft } from 'lucide-react';
import { Box, IconButton, Typography } from '@mui/material';

export default function MobileScreen({ children, title, subtitle, backAction, headerAction, sx }) {
  return (
    <Box sx={{ minHeight: '100%', backgroundColor: 'background.default' }}>
      <Box sx={{ boxSizing: 'border-box', width: '100%', maxWidth: 920, mx: 'auto', px: { xs: 2, sm: 3.5 }, pt: { xs: 2.5, sm: 3.5 }, pb: 3, ...sx }}>
        {title || backAction || headerAction ? (
          <Box component="header" sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 3 }}>
            {backAction ? (
              <IconButton aria-label="Go back" onClick={backAction} sx={{ width: 44, height: 44, ml: -1 }}>
                <ArrowLeft size={22} />
              </IconButton>
            ) : null}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {title ? <Typography component="h1" sx={{ fontSize: { xs: '2rem', sm: '2.25rem' }, fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.025em' }}>{title}</Typography> : null}
              {subtitle ? <Typography sx={{ mt: 0.75, color: 'text.muted', fontSize: '0.95rem' }}>{subtitle}</Typography> : null}
            </Box>
            {headerAction}
          </Box>
        ) : null}
        {children}
      </Box>
    </Box>
  );
}

MobileScreen.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  backAction: PropTypes.func,
  headerAction: PropTypes.node,
  sx: PropTypes.object,
};
