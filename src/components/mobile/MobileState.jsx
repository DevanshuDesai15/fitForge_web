import PropTypes from 'prop-types';
import { AlertTriangle, CloudOff, Info, Inbox, RotateCcw } from 'lucide-react';
import { Box, Button, Skeleton, Typography } from '@mui/material';

const stateIcons = {
  empty: Inbox,
  failure: AlertTriangle,
  offline: CloudOff,
  degraded: Info,
};

export default function MobileState({ kind, title, message, onRetry }) {
  if (kind === 'loading') {
    return (
      <Box aria-label={title || 'Loading content'} aria-busy="true" sx={{ display: 'grid', gap: 1.5 }}>
        <Skeleton variant="rounded" height={112} />
        <Skeleton variant="rounded" height={72} />
        <Skeleton variant="rounded" height={72} />
      </Box>
    );
  }

  const Icon = stateIcons[kind] || Info;
  const role = kind === 'failure' || kind === 'offline' ? 'alert' : kind === 'degraded' ? 'status' : undefined;

  return (
    <Box
      role={role}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        minHeight: kind === 'degraded' ? 'auto' : 180,
        p: kind === 'degraded' ? 2 : 3,
        textAlign: 'center',
        border: '1px solid',
        borderColor: kind === 'failure' || kind === 'offline' ? 'error.main' : 'border.main',
        borderRadius: '18px',
        backgroundColor: 'background.paper',
      }}
    >
      <Icon size={kind === 'degraded' ? 20 : 28} aria-hidden="true" />
      <Typography component="h2" sx={{ fontSize: kind === 'degraded' ? '0.9rem' : '1.05rem', fontWeight: 700 }}>
        {title}
      </Typography>
      {message ? <Typography sx={{ color: 'text.muted', fontSize: '0.9rem' }}>{message}</Typography> : null}
      {onRetry ? (
        <Button size="small" startIcon={<RotateCcw size={16} />} onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </Box>
  );
}

MobileState.propTypes = {
  kind: PropTypes.oneOf(['loading', 'empty', 'failure', 'offline', 'degraded']).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
};
