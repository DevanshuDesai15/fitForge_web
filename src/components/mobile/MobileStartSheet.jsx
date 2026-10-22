import PropTypes from 'prop-types';
import { ChevronRight, Play, Plus } from 'lucide-react';
import { Box, Button, ButtonBase, Chip, Drawer, Typography } from '@mui/material';

const eyebrowSx = { fontSize: '0.7rem', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 };
const chipSx = { height: 26, color: 'text.secondary', borderColor: 'border.main', fontWeight: 700, '& .MuiChip-icon': { color: 'inherit' } };

// What the bottom bar's centre action opens (Mobile Kit "Start a workout" sheet). The big hex never
// drops straight into a live session: today's programmed focus is offered first, then the other
// workouts, then an empty workout. Presentational — the container supplies the data.
//   focus: { eyebrow, name, detail, chips: [{ icon, label }], onStart } | null
//   ongoing: { name, setsLogged } | null     others: [{ id, title, meta, onStart }]
export default function MobileStartSheet({ open, onClose, focus = null, ongoing = null, others = [], loading = false, onResume, onEmpty }) {
  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxHeight: '86vh', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundImage: 'none', backgroundColor: 'background.paper', px: 2.5, pt: 1.5, pb: 'calc(20px + env(safe-area-inset-bottom))' } }}
    >
      <Box aria-hidden="true" sx={{ width: 40, height: 4, borderRadius: 2, mx: 'auto', mb: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />
      <Typography component="h2" sx={{ fontSize: '1.35rem', fontWeight: 800, mb: 2.5 }}>Start a workout</Typography>

      {ongoing ? (
        <Box sx={{ p: 2, mb: 2.5, borderRadius: '20px', border: '1px solid rgba(221,237,0,0.22)', backgroundColor: 'rgba(221,237,0,0.06)' }}>
          <Typography sx={{ ...eyebrowSx, color: 'primary.main', mb: 1 }}>Unfinished session</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{ongoing.name}</Typography>
          <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>{ongoing.setsLogged} sets logged</Typography>
          <Button fullWidth variant="contained" startIcon={<Play size={17} />} onClick={onResume} sx={{ mt: 2, color: 'primary.contrastText', fontWeight: 800 }}>Resume</Button>
        </Box>
      ) : null}

      {focus ? (
        <Box sx={{ p: 2, mb: 3, borderRadius: '20px', border: '1px solid rgba(221,237,0,0.22)', backgroundColor: 'rgba(221,237,0,0.06)' }}>
          <Typography sx={{ ...eyebrowSx, color: 'primary.main', mb: 1 }}>{focus.eyebrow}</Typography>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.1 }}>{focus.name}</Typography>
          {focus.detail ? <Typography sx={{ color: 'text.secondary', mt: 0.75 }}>{focus.detail}</Typography> : null}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 1.75 }}>
            {focus.chips.map(({ icon: Icon, label }) => (
              <Chip key={label} variant="outlined" size="small" icon={<Icon size={14} />} label={label} sx={chipSx} />
            ))}
          </Box>
          <Button fullWidth variant="contained" startIcon={<Play size={17} />} onClick={focus.onStart} sx={{ color: 'primary.contrastText', fontWeight: 800 }}>
            Start {focus.name}
          </Button>
        </Box>
      ) : null}

      {loading && !focus && !others.length ? (
        <Typography role="status" sx={{ color: 'text.secondary', mb: 2 }}>Loading your workouts…</Typography>
      ) : null}

      {others.length ? (
        <>
          <Typography sx={{ ...eyebrowSx, color: 'text.secondary', mb: 1.25 }}>{focus || ongoing ? 'Or pick another' : 'Pick a workout'}</Typography>
          <Box sx={{ display: 'grid', gap: 1, mb: 2, overflowY: 'auto' }}>
            {others.map((item) => (
              <ButtonBase
                key={item.id}
                onClick={item.onStart}
                sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, minHeight: 56, px: 2, py: 1.25, borderRadius: '14px', border: '1px solid', borderColor: 'border.main', textAlign: 'left' }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</Typography>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>{item.meta}</Typography>
                </Box>
                <ChevronRight size={18} aria-hidden="true" />
              </ButtonBase>
            ))}
          </Box>
        </>
      ) : null}

      <Button fullWidth variant="text" startIcon={<Plus size={17} />} onClick={onEmpty}>Empty workout</Button>
    </Drawer>
  );
}

MobileStartSheet.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  focus: PropTypes.shape({
    eyebrow: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    detail: PropTypes.string,
    chips: PropTypes.arrayOf(PropTypes.shape({ icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired })).isRequired,
    onStart: PropTypes.func.isRequired,
  }),
  ongoing: PropTypes.shape({ name: PropTypes.string.isRequired, setsLogged: PropTypes.number.isRequired }),
  others: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string.isRequired, title: PropTypes.string.isRequired, meta: PropTypes.string, onStart: PropTypes.func.isRequired })),
  loading: PropTypes.bool,
  onResume: PropTypes.func,
  onEmpty: PropTypes.func.isRequired,
};
