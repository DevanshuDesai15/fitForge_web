import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

export default function MobileSection({ title, action, children, sx }) {
  return (
    <Box component="section" sx={{ mb: 4, ...sx }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, mb: 2 }}>
        <Typography component="h2" sx={{ fontSize: '1.45rem', fontWeight: 800, lineHeight: 1.1 }}>{title}</Typography>
        {action}
      </Box>
      {children}
    </Box>
  );
}

MobileSection.propTypes = {
  title: PropTypes.string.isRequired,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
  sx: PropTypes.object,
};
