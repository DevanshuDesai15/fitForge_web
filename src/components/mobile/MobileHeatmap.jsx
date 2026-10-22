import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Typography } from '@mui/material';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_ROW = 14;

// Year activity heat map from the Mobile Kit. Columns are weeks, rows Sun→Sat, one dot per day.
// Binary (a day has a workout or it doesn't). Scrolls sideways and opens on the latest weeks.
// A null value is a leading/trailing pad day and renders nothing.
export default function MobileHeatmap({
  values,
  months,
  year,
  caption,
  dotSize = 20,
  gap = 4,
  todayIndex,
  selectedIndex,
  onSelectDay,
  dayLabel,
}) {
  const scroller = useRef(null);
  const weekCount = Math.ceil(values.length / 7) || 1;

  useEffect(() => {
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, [values.length]);

  const rows = `${MONTH_ROW}px repeat(7, ${dotSize}px)`;
  const labelSx = { color: 'text.secondary', fontSize: '0.68rem', lineHeight: 1 };

  return (
    <Box sx={{ width: '100%', boxSizing: 'border-box', p: 2, borderRadius: '16px', backgroundColor: '#2a2a2a' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 2.5 }}>
        <Typography sx={{ color: 'primary.main', fontSize: '1rem' }}>{year} Workout Activity</Typography>
        {caption ? <Typography sx={{ ...labelSx, fontSize: '0.8rem', textAlign: 'right' }}>{caption}</Typography> : null}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'grid', gridTemplateRows: rows, rowGap: `${gap}px`, mr: 0.75, flexShrink: 0 }}>
          <span />
          {DAY_LABELS.map((d, i) => (
            <Box key={i} component="span" sx={{ ...labelSx, display: 'flex', alignItems: 'center' }}>{d}</Box>
          ))}
        </Box>

        <Box ref={scroller} data-testid="heatmap-scroller" sx={{ flex: 1, minWidth: 0, overflowX: 'auto', overflowY: 'hidden', pb: 0.5 }}>
          <Box sx={{
            display: 'grid',
            width: 'max-content',
            gridTemplateColumns: `repeat(${weekCount}, ${dotSize}px)`,
            gridTemplateRows: rows,
            columnGap: `${gap}px`,
            rowGap: `${gap}px`,
          }}>
            {months.map((m) => (
              <Box key={m.label} component="span" sx={{ ...labelSx, gridRow: 1, gridColumn: m.weekIndex + 1, alignSelf: 'end', mb: '4px', whiteSpace: 'nowrap' }}>
                {m.label}
              </Box>
            ))}
            {values.map((v, i) => {
              if (v === null) return null;
              const label = `${dayLabel ? dayLabel(i) : `Day ${i}`}: ${v ? `${v} workout${v > 1 ? 's' : ''}` : 'no workouts'}`;
              const selected = i === selectedIndex;
              return (
                <Box
                  key={i}
                  component="button"
                  type="button"
                  aria-label={label}
                  aria-pressed={selected}
                  onClick={() => onSelectDay(i)}
                  sx={{
                    gridColumn: Math.floor(i / 7) + 1,
                    gridRow: (i % 7) + 2,
                    width: dotSize,
                    height: dotSize,
                    p: 0,
                    border: 'none',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    backgroundColor: v ? 'primary.main' : 'rgba(255,255,255,0.07)',
                    outline: selected ? '2px solid #fff' : i === todayIndex ? '1px solid' : 'none',
                    outlineColor: selected ? '#fff' : 'primary.main',
                    outlineOffset: selected ? '2px' : '1px',
                  }}
                />
              );
            })}
          </Box>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
        <Typography sx={labelSx}>Less</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.07)' }} />
          <Box sx={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'primary.main' }} />
        </Box>
        <Typography sx={labelSx}>More</Typography>
      </Box>
    </Box>
  );
}

MobileHeatmap.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  months: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string.isRequired, weekIndex: PropTypes.number.isRequired })).isRequired,
  year: PropTypes.number.isRequired,
  caption: PropTypes.string,
  dotSize: PropTypes.number,
  gap: PropTypes.number,
  todayIndex: PropTypes.number,
  selectedIndex: PropTypes.number,
  onSelectDay: PropTypes.func.isRequired,
  dayLabel: PropTypes.func,
};
