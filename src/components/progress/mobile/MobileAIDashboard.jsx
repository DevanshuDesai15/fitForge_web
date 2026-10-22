import { useState } from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { Activity, AlertTriangle, Brain, LineChart, Minus, TrendingDown, TrendingUp, Trophy } from 'lucide-react';
import { Box, ButtonBase, Chip, Typography } from '@mui/material';
import { MobileHeroStat, MobileState } from '../../mobile';
import PlateauAlerts from '../components/PlateauAlerts';
import PerformanceCharts from '../components/PerformanceCharts';

const mono = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' };
const cardSx = { p: 2, borderRadius: '16px', border: '1px solid rgba(255,255,255,0.16)', backgroundColor: 'background.paper' };
const muted = { color: 'text.secondary', fontSize: '0.85rem' };

// Trend is an ordered scale, so it reads as brightness plus a direction glyph, not a traffic light.
const TREND = {
  improving: { color: '#ffffff', Icon: TrendingUp, label: 'Improving' },
  maintaining: { color: '#b8b8b8', Icon: Minus, label: 'Maintaining' },
  declining: { color: '#8b8b8b', Icon: TrendingDown, label: 'Declining' },
};
const confidenceColor = (c) => (c >= 0.8 ? '#ffffff' : c >= 0.6 ? '#b8b8b8' : '#8b8b8b');

const SUB_TABS = [
  { id: 'insights', label: 'AI Insights', Icon: Brain },
  { id: 'plateaus', label: 'Plateaus', Icon: AlertTriangle },
  { id: 'charts', label: 'Charts', Icon: LineChart },
  { id: 'stats', label: 'Statistics', Icon: Activity },
  { id: 'overview', label: 'Overview', Icon: Trophy },
];

function summarizeAnalyses(analyses) {
  const count = (trend) => analyses.filter((a) => a.progressionTrend === trend).length;
  const total = analyses.length;
  return {
    total,
    improving: count('improving'),
    maintaining: count('maintaining'),
    declining: count('declining'),
    improvingPct: total ? Math.round((count('improving') / total) * 100) : null,
    avgConfidencePct: total ? Math.round((analyses.reduce((s, a) => s + (a.confidenceLevel || 0), 0) / total) * 100) : null,
  };
}

const SectionTitle = ({ Icon, children, hint }) => (
  <Box sx={{ mb: 2 }}>
    <Typography sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontSize: '1.15rem' }}>
      <Icon size={20} aria-hidden="true" />{children}
    </Typography>
    {hint ? <Typography sx={{ ...muted, mt: 0.5 }}>{hint}</Typography> : null}
  </Box>
);

SectionTitle.propTypes = { Icon: PropTypes.elementType.isRequired, children: PropTypes.node.isRequired, hint: PropTypes.string };

const NoAnalyses = () => (
  <MobileState kind="empty" title="No insights yet" message="Log a few sessions of the same lift and the analysis will appear here." />
);

function Insights({ analyses, weightUnit }) {
  if (!analyses.length) return <NoAnalyses />;
  return (
    <Box>
      <SectionTitle Icon={Brain} hint={`Analyzing ${analyses.length} exercises with intelligent progress tracking`}>AI Performance Insights</SectionTitle>
      <Box sx={{ display: 'grid', gap: 2 }}>
        {analyses.map((a) => {
          const trend = TREND[a.progressionTrend] || TREND.declining;
          const conf = confidenceColor(a.confidenceLevel);
          const rate = a.progressionRate || 0;
          return (
            <Box key={a.exerciseId || a.exerciseName} sx={{ ...cardSx, backgroundColor: 'rgba(255,255,255,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                <Typography sx={{ color: '#fff', fontSize: '1.05rem' }}>{a.exerciseName}</Typography>
                <Chip size="small" label={`${Math.round((a.confidenceLevel || 0) * 100)}%`} sx={{ ...mono, height: 20, fontSize: '0.7rem', color: conf, backgroundColor: `${conf}20` }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                <trend.Icon size={16} color={trend.color} aria-hidden="true" />
                <Typography sx={{ color: trend.color, fontWeight: 700 }}>{trend.label}</Typography>
                <Typography sx={{ ...mono, ...muted }}>{rate > 0 ? '+' : ''}{rate.toFixed(1)}{weightUnit}/week</Typography>
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mb: 2 }}>
                <Box>
                  <Typography sx={muted}>Current Weight</Typography>
                  <Typography sx={{ ...mono, color: 'primary.main', fontWeight: 700 }}>{a.currentWeight}{weightUnit}</Typography>
                </Box>
                <Box>
                  <Typography sx={muted}>Total Sessions</Typography>
                  <Typography sx={{ ...mono, color: 'primary.main', fontWeight: 700 }}>{a.totalSessions}</Typography>
                </Box>
              </Box>
              {a.lastProgressDate ? <Typography sx={muted}>Last Session: {format(new Date(a.lastProgressDate), 'MMM dd')}</Typography> : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

// The web version of this tab shows fixed sample figures; these are computed from the analyses.
function Statistics({ analyses, personalRecords, exercises, weightUnit }) {
  const s = summarizeAnalyses(analyses);
  const best = personalRecords[0];
  if (!best) return <MobileState kind="empty" title="No statistics yet" message="Your heaviest lifts and trend counts show up after your first logged workout." />;
  return (
    <Box>
      <SectionTitle Icon={Activity} hint="Key performance metrics and trend indicators">Statistics Dashboard</SectionTitle>
      <Box sx={{ mb: 2.5 }}>
        <MobileHeroStat
          value={best.weight}
          unit={weightUnit}
          caption={`Heaviest lift on record · ${best.exerciseName}`}
          stats={[
            { value: exercises.length, label: 'exercises logged' },
            { value: personalRecords.length, label: 'lifts tracked' },
            { value: s.avgConfidencePct === null ? '—' : `${s.avgConfidencePct}%`, label: 'avg confidence' },
          ]}
        />
      </Box>
      <Box sx={{ ...cardSx, backgroundColor: 'rgba(255,255,255,0.06)' }}>
        <Typography sx={{ color: '#fff', fontSize: '1.15rem', mb: 2 }}>Trend Analysis</Typography>
        <Box sx={{ display: 'grid', gap: 1.5 }}>
          {Object.entries(TREND).map(([key, { color, Icon, label }]) => (
            <Box key={key} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography sx={muted}>{label}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon size={18} color={color} aria-hidden="true" />
                <Typography sx={{ ...mono, color, fontSize: '1.15rem' }}>{s[key]}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function AIOverview({ analyses, plateauAlerts }) {
  const s = summarizeAnalyses(analyses);
  const tiles = [
    { color: 'primary.main', value: s.total, label: 'AI Insights' },
    { color: '#b8b8b8', value: plateauAlerts.length, label: 'Active Plateaus' },
    { color: '#fff', value: s.improvingPct === null ? '—' : `${s.improvingPct}%`, label: 'Improving' },
    { color: '#4a8af5', value: s.avgConfidencePct === null ? '—' : `${s.avgConfidencePct}%`, label: 'Avg Confidence' },
  ];
  return (
    <Box>
      <SectionTitle Icon={LineChart}>Overview</SectionTitle>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2.5 }}>
        {tiles.map((t) => (
          <Box key={t.label} sx={{ textAlign: 'center', p: 2, borderRadius: '12px', backgroundColor: 'background.paper' }}>
            <Typography sx={{ ...mono, color: t.color, fontSize: '2rem', lineHeight: 1.2 }}>{t.value}</Typography>
            <Typography sx={{ ...muted, mt: 0.5 }}>{t.label}</Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: 'background.paper' }}>
          <Typography sx={{ color: '#fff', fontSize: '1.15rem', mb: 2 }}>Latest AI Insights</Typography>
          {analyses.length === 0 ? <Typography sx={muted}>No insights yet.</Typography> : analyses.slice(0, 3).map((a) => (
            <Box key={a.exerciseId || a.exerciseName} sx={{ mb: 1.5, p: 2, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Typography sx={{ color: '#fff', fontWeight: 700 }}>{a.exerciseName}</Typography>
              <Typography sx={{ ...muted, mt: 0.25 }}>{(TREND[a.progressionTrend] || TREND.declining).label} · {(a.progressionRate || 0) > 0 ? '+' : ''}{(a.progressionRate || 0).toFixed(1)}/week</Typography>
            </Box>
          ))}
        </Box>
        <Box sx={{ p: 2, borderRadius: '12px', backgroundColor: 'background.paper' }}>
          <Typography sx={{ color: '#b8b8b8', fontSize: '1.15rem', mb: 2 }}>Active Plateau Alerts</Typography>
          {plateauAlerts.length === 0 ? <Typography sx={muted}>No active plateaus detected.</Typography> : plateauAlerts.slice(0, 3).map((p) => (
            <Box key={p.id} sx={{ mb: 1.5, p: 2, borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <Typography sx={{ color: '#b8b8b8', fontWeight: 700 }}>{p.exerciseName}</Typography>
              <Typography sx={{ ...muted, mt: 0.25 }}>{p.severity} priority</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default function MobileAIDashboard({
  progressionAnalyses, plateauAlerts, appliedInterventions, dismissedAlerts, onInterventionApply, onAlertDismiss,
  progressData, selectedExercise, setSelectedExercise, timeRange, setTimeRange, exercises, personalRecords, weightUnit,
}) {
  const [tab, setTab] = useState('insights');
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, p: 2.5, mb: 3, borderRadius: '12px', border: '1px solid rgba(221,237,0,0.2)', background: 'linear-gradient(135deg, rgba(221,237,0,0.1), rgba(221,237,0,0.05))' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <Brain size={32} color="#dded00" aria-hidden="true" />
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ color: '#fff', fontSize: '1.35rem', lineHeight: 1.2 }}>AI-Powered Progress Dashboard</Typography>
            <Typography sx={{ ...muted, mt: 0.5 }}>Intelligent analysis of your fitness journey with actionable insights</Typography>
          </Box>
        </Box>
        <Chip size="small" label="AI Enhanced" sx={{ color: 'primary.main', backgroundColor: 'rgba(221,237,0,0.159)' }} />
      </Box>

      <Box role="tablist" aria-label="AI dashboard sections" sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', mb: 3, borderBottom: '1px solid', borderColor: 'border.main', scrollbarWidth: 'none' }}>
        {SUB_TABS.map(({ id, label, Icon }) => {
          const on = id === tab;
          return (
            <ButtonBase
              key={id}
              role="tab"
              aria-selected={on}
              onClick={() => setTab(id)}
              sx={{ flexDirection: 'column', gap: 0.5, px: 2, py: 1.25, mb: '-1px', minHeight: 44, whiteSpace: 'nowrap', fontSize: '0.75rem', color: on ? 'primary.main' : 'rgba(255,255,255,0.7)', borderBottom: '2px solid', borderColor: on ? 'primary.main' : 'transparent' }}
            >
              <Icon size={18} aria-hidden="true" />{label}
            </ButtonBase>
          );
        })}
      </Box>

      {tab === 'insights' && <Insights analyses={progressionAnalyses} weightUnit={weightUnit} />}
      {tab === 'plateaus' && (
        <PlateauAlerts
          plateauAlerts={plateauAlerts}
          appliedInterventions={appliedInterventions}
          dismissedAlerts={dismissedAlerts}
          onInterventionApply={onInterventionApply}
          onAlertDismiss={onAlertDismiss}
        />
      )}
      {tab === 'charts' && (
        <PerformanceCharts
          progressData={progressData}
          selectedExercise={selectedExercise}
          setSelectedExercise={setSelectedExercise}
          timeRange={timeRange}
          setTimeRange={setTimeRange}
          weightUnit={weightUnit}
        />
      )}
      {tab === 'stats' && <Statistics analyses={progressionAnalyses} personalRecords={personalRecords} exercises={exercises} weightUnit={weightUnit} />}
      {tab === 'overview' && <AIOverview analyses={progressionAnalyses} plateauAlerts={plateauAlerts} />}
    </Box>
  );
}

MobileAIDashboard.propTypes = {
  progressionAnalyses: PropTypes.array.isRequired,
  plateauAlerts: PropTypes.array.isRequired,
  appliedInterventions: PropTypes.object.isRequired,
  dismissedAlerts: PropTypes.instanceOf(Set).isRequired,
  onInterventionApply: PropTypes.func.isRequired,
  onAlertDismiss: PropTypes.func.isRequired,
  progressData: PropTypes.object.isRequired,
  selectedExercise: PropTypes.string.isRequired,
  setSelectedExercise: PropTypes.func.isRequired,
  timeRange: PropTypes.string.isRequired,
  setTimeRange: PropTypes.func.isRequired,
  exercises: PropTypes.array.isRequired,
  personalRecords: PropTypes.array.isRequired,
  weightUnit: PropTypes.string.isRequired,
};
