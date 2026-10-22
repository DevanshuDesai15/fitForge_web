import PropTypes from 'prop-types';
import { AlertTriangle, X } from 'lucide-react';
import { Box, Button, Dialog, IconButton, Typography } from '@mui/material';

const hairline = '1px solid rgba(255,255,255,0.08)';

// Mobile Kit sign-out confirmation. Signing out is one mis-tap from losing an in-progress session, so it
// says what survives and, when a session is actually unfinished, warns that it stays in progress.
export default function MobileSignOutDialog({ open, hasUnfinishedSession = false, onCancel, onConfirm }) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="sign-out-title"
      PaperProps={{ sx: { width: '100%', maxWidth: 380, m: 2, overflow: 'hidden', backgroundColor: '#1a1a1a', backgroundImage: 'none', borderRadius: '14px', border: '1px solid rgba(221,237,0,0.28)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' } }}
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' } } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, p: 3, borderBottom: hairline }}>
        <Typography id="sign-out-title" component="h2" sx={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1.15 }}>Sign out?</Typography>
        <IconButton aria-label="Close" onClick={onCancel} sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.06)', color: 'text.secondary' }}>
          <X size={18} />
        </IconButton>
      </Box>

      <Box sx={{ p: 3 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '1.05rem', lineHeight: 1.5 }}>
          Every logged set is already saved to your account. You&apos;ll need your password — or a code — to log anything new.
        </Typography>
        {hasUnfinishedSession ? (
          <Box role="alert" sx={{ mt: 2, p: 1.75, display: 'flex', gap: 1.5, alignItems: 'flex-start', borderRadius: '12px', bgcolor: 'rgba(234,179,8,0.14)', border: '1px solid rgba(234,179,8,0.30)', color: '#facc15' }}>
            <AlertTriangle size={20} aria-hidden="true" style={{ flexShrink: 0, marginTop: 2 }} />
            <Typography sx={{ color: 'inherit', fontSize: '1rem', lineHeight: 1.5 }}>You have an unfinished session from today. It stays in progress until you finish it.</Typography>
          </Box>
        ) : null}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, px: 3, py: 2, borderTop: hairline }}>
        <Button onClick={onCancel} sx={{ color: 'text.secondary', fontWeight: 600 }}>Stay signed in</Button>
        <Button onClick={onConfirm} sx={{ color: '#f87171', fontWeight: 700, bgcolor: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.30)', '&:hover': { bgcolor: 'rgba(239,68,68,0.25)' } }}>Sign out</Button>
      </Box>
    </Dialog>
  );
}

MobileSignOutDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  hasUnfinishedSession: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};
