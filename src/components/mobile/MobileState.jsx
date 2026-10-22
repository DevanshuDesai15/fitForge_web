import PropTypes from 'prop-types';
import { AlertTriangle, CloudOff, Info, Inbox, RotateCcw } from 'lucide-react';
import { Box, Button, Skeleton, Typography } from '@mui/material';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const stateIcons = {
  empty: Inbox,
  failure: AlertTriangle,
  offline: CloudOff,
  degraded: Info,
};

const FAILURE_BODY = 'The request failed before anything came back. Nothing you logged is lost — it lives on the server and on this phone.';
const OFFLINE_BODY = 'Logged sets are stored on the phone and sync the moment you are back. Everything you can see here is the last synced copy.';

// Skeletons mirror the content they stand in for so the layout does not jump when data lands.
const skeletonCard = (key, blockHeight = 30) => (
  <Box key={key} sx={{ p: 2, borderRadius: '18px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
    <Skeleton variant="text" width="42%" height={16} />
    <Skeleton variant="rounded" height={blockHeight} sx={{ mt: 1.75 }} />
    <Box sx={{ display: 'flex', gap: 1.25, mt: 1.75 }}>
      <Skeleton variant="text" width="30%" height={14} />
      <Skeleton variant="text" width="24%" height={14} />
      <Skeleton variant="text" width="28%" height={14} />
    </Box>
  </Box>
);

function LoadingState({ title, shape }) {
  return (
    <Box aria-label={title || 'Loading content'} aria-busy="true" sx={{ display: 'grid', gap: 1.75 }}>
      {shape === 'rings' ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', gap: 1.25, py: 2.5, px: 1.5, borderRadius: '18px', border: '1px solid', borderColor: 'border.main', backgroundColor: 'background.paper' }}>
            <Skeleton variant="circular" width={76} height={76} />
            <Skeleton variant="circular" width={104} height={104} />
            <Skeleton variant="circular" width={76} height={76} />
          </Box>
          {skeletonCard('a', 40)}
          {skeletonCard('b')}
        </>
      ) : (
        [0, 1, 2].map((i) => skeletonCard(i))
      )}
    </Box>
  );
}

export default function MobileState({ kind, title, message, onRetry, action, secondary, shape }) {
  const online = useOnlineStatus();

  if (kind === 'loading') return <LoadingState title={title} shape={shape} />;

  // A failed load while the phone has no connection is an offline state, not a server error.
  const autoOffline = kind === 'failure' && !online;
  const effectiveKind = autoOffline ? 'offline' : kind;
  const heading = autoOffline ? 'You are offline.' : title;
  const isFailure = effectiveKind === 'failure' || effectiveKind === 'offline';
  const body = effectiveKind === 'offline' ? OFFLINE_BODY : effectiveKind === 'failure' ? FAILURE_BODY : null;
  const bannerText = isFailure ? message : null;
  const Icon = stateIcons[effectiveKind] || Info;
  const role = isFailure ? 'alert' : effectiveKind === 'degraded' ? 'status' : undefined;
  const degraded = effectiveKind === 'degraded';

  return (
    <Box
      role={role}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1.25,
        minHeight: degraded ? 'auto' : 180,
        p: degraded ? 2 : 3,
        textAlign: 'center',
        border: '1px solid',
        borderColor: isFailure ? 'error.main' : 'border.main',
        borderRadius: '18px',
        backgroundColor: 'background.paper',
      }}
    >
      {bannerText ? (
        <Typography sx={{ alignSelf: 'stretch', p: 1.25, borderRadius: '10px', bgcolor: 'rgba(239,68,68,0.12)', color: '#f87171', fontSize: '0.85rem', textAlign: 'left' }}>
          {bannerText}
        </Typography>
      ) : null}
      <Icon size={degraded ? 20 : 28} aria-hidden="true" />
      <Typography component="h2" sx={{ fontSize: degraded ? '0.9rem' : '1.05rem', fontWeight: 700 }}>
        {heading}
      </Typography>
      {body ? <Typography sx={{ color: 'text.muted', fontSize: '0.9rem' }}>{body}</Typography> : null}
      {!isFailure && message ? <Typography sx={{ color: 'text.muted', fontSize: '0.9rem' }}>{message}</Typography> : null}
      {onRetry ? (
        <Button fullWidth={isFailure} variant={isFailure ? 'contained' : 'text'} size={isFailure ? 'medium' : 'small'} startIcon={<RotateCcw size={16} />} onClick={onRetry}>
          Try again
        </Button>
      ) : null}
      {action}
      {secondary}
    </Box>
  );
}

LoadingState.propTypes = { title: PropTypes.string, shape: PropTypes.oneOf(['cards', 'rings']) };

MobileState.propTypes = {
  kind: PropTypes.oneOf(['loading', 'empty', 'failure', 'offline', 'degraded']).isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  onRetry: PropTypes.func,
  action: PropTypes.node,
  secondary: PropTypes.node,
  shape: PropTypes.oneOf(['cards', 'rings']),
};
