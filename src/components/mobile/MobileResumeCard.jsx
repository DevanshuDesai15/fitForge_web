import { useState } from 'react';
import PropTypes from 'prop-types';
import { Play } from 'lucide-react';
import { Box, Button, Typography } from '@mui/material';

// Home's nudge back into an unfinished session. Discarding throws away logged sets, so it asks first.
export default function MobileResumeCard({ name, sets, ago, onResume, onDiscard }) {
  const [confirming, setConfirming] = useState(false);

  return (
    <Box sx={{ p: 2, mb: 3, borderRadius: '20px', border: '1px solid rgba(221,237,0,0.22)', backgroundColor: 'rgba(221,237,0,0.06)' }}>
      <Typography sx={{ color: 'primary.main', fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700, mb: 1 }}>
        Unfinished session
      </Typography>
      <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{name}</Typography>
      <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>
        {sets} set{sets === 1 ? '' : 's'} logged · {ago}
      </Typography>
      {confirming ? (
        <Box role="alertdialog" aria-label="Discard unfinished session" sx={{ mt: 2 }}>
          <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem', mb: 1.5 }}>
            Discard this session? The {sets} logged set{sets === 1 ? '' : 's'} will be lost.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button fullWidth variant="outlined" onClick={() => setConfirming(false)}>Keep it</Button>
            <Button fullWidth variant="contained" color="error" onClick={onDiscard}>Discard</Button>
          </Box>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button fullWidth variant="contained" startIcon={<Play size={17} />} onClick={onResume} sx={{ color: 'primary.contrastText', fontWeight: 800 }}>
            Resume
          </Button>
          <Button variant="text" onClick={() => setConfirming(true)}>Discard</Button>
        </Box>
      )}
    </Box>
  );
}

MobileResumeCard.propTypes = {
  name: PropTypes.string.isRequired,
  sets: PropTypes.number.isRequired,
  ago: PropTypes.string.isRequired,
  onResume: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
};
