import PropTypes from 'prop-types';
import { Box, Chip, Typography } from '@mui/material';

export default function MobileHeroStat({ value, unit, caption, delta, stats }) {
  return (
    <Box sx={{ p: 2.25, border: '1px solid', borderColor: 'border.main', borderRadius: '18px', backgroundColor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography component="strong" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: { xs: '2.65rem', sm: '3rem' }, fontWeight: 800, lineHeight: 1 }}>
          {value}
        </Typography>
        {unit ? <Typography sx={{ color: 'text.muted', fontSize: '1.05rem' }}>{unit}</Typography> : null}
        {delta ? <Chip label={delta} size="small" sx={{ ml: 'auto', color: 'primary.main', backgroundColor: 'rgba(221,237,0,0.1)', fontWeight: 700 }} /> : null}
      </Box>
      <Typography sx={{ mt: 0.75, color: 'text.muted', fontSize: '0.95rem' }}>{caption}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 1.5, mt: 2.25, pt: 2, borderTop: '1px solid', borderColor: 'border.main' }}>
        {stats.map((stat) => (
          <Box key={stat.label}>
            <Typography sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '1.1rem', fontWeight: 700 }}>{stat.value}</Typography>
            <Typography sx={{ mt: 0.35, color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1.2 }}>{stat.label}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

MobileHeroStat.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  unit: PropTypes.string,
  caption: PropTypes.string.isRequired,
  delta: PropTypes.string,
  stats: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired, label: PropTypes.string.isRequired })).isRequired,
};
