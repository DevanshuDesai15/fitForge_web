import { useState } from 'react';
import PropTypes from 'prop-types';
import { Check, Pause, Trash2 } from 'lucide-react';
import { Box, Button, ButtonBase, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Typography } from '@mui/material';

const rowSx = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, width: '100%', minHeight: 64, px: 2, py: 1.5, borderRadius: '14px', border: '1px solid', borderColor: 'border.main', textAlign: 'left' };

// Back-button interception for a live mobile session. Leaving never silently loses sets: the user picks
// between logging it, parking it to resume from Home, or discarding it (which asks once more).
export default function MobileExitSheet({ open, setsLogged, onClose, onFinish, onIncomplete, onDiscard }) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const sets = `${setsLogged} ${setsLogged === 1 ? 'set' : 'sets'}`;
  const close = () => { setConfirmDiscard(false); onClose(); };

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open && !confirmDiscard}
        onClose={close}
        PaperProps={{ sx: { borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundImage: 'none', backgroundColor: 'background.paper', px: 2.5, pt: 1.5, pb: 'calc(20px + env(safe-area-inset-bottom))' } }}
      >
        <Box aria-hidden="true" sx={{ width: 40, height: 4, borderRadius: 2, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        <Typography component="h2" sx={{ fontSize: '1.35rem', fontWeight: 800, mb: 1 }}>Leave this workout?</Typography>
        <Typography sx={{ color: 'text.secondary', mb: 2 }}>You have {sets} logged.</Typography>
        <Box sx={{ display: 'grid', gap: 1.25 }}>
          <ButtonBase onClick={onFinish} sx={rowSx}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Finish now</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Log it as a complete session, short or not.</Typography>
            </Box>
            <Check size={18} color="#dded00" aria-hidden="true" />
          </ButtonBase>
          <ButtonBase onClick={onIncomplete} sx={rowSx}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>Save as incomplete</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Keeps every set. Resume it from Home whenever.</Typography>
            </Box>
            <Pause size={18} aria-hidden="true" />
          </ButtonBase>
          <ButtonBase onClick={() => setConfirmDiscard(true)} sx={{ ...rowSx, borderColor: 'rgba(239,68,68,0.3)', bgcolor: 'rgba(239,68,68,0.1)' }}>
            <Box>
              <Typography sx={{ fontWeight: 700, color: '#f87171' }}>Discard</Typography>
              <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>Throw the session away. Asks once more.</Typography>
            </Box>
            <Trash2 size={18} color="#f87171" aria-hidden="true" />
          </ButtonBase>
        </Box>
      </Drawer>

      <Dialog open={open && confirmDiscard} onClose={() => setConfirmDiscard(false)} aria-labelledby="discard-session-title">
        <DialogTitle id="discard-session-title">Discard this session?</DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'text.secondary' }}>
            {sets} logged and this session&apos;s timer are deleted. Nothing goes to your history, your streak, or your records. This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscard(false)}>Keep it</Button>
          <Button color="error" variant="contained" onClick={onDiscard}>Discard {sets}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

MobileExitSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  setsLogged: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onFinish: PropTypes.func.isRequired,
  onIncomplete: PropTypes.func.isRequired,
  onDiscard: PropTypes.func.isRequired,
};
