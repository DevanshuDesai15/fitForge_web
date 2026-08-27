import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import MobilePrograms, { MobileProgramDetail } from '../MobilePrograms';

const programs = [{
  id: 'program-1',
  name: 'Push / Pull / Legs',
  description: 'Three-way split, each muscle twice a week.',
  category: 'Hypertrophy',
  difficulty: 'Intermediate',
  frequency: '4x/week',
  duration: '8 weeks',
  days: [
    { id: 'push', name: 'Push', focus: 'Chest, Shoulders, Triceps', exercises: [{ id: 'bench' }], completed: true },
    { id: 'pull', name: 'Pull', focus: 'Back, Biceps, Rear delts', exercises: [{ id: 'row' }, { id: 'curl' }] },
  ],
}];

describe('MobilePrograms', () => {
  it('matches the Mobile Kit program-card hierarchy and wires its actions', () => {
    const onOpen = vi.fn();
    const onStart = vi.fn();
    render(<MobilePrograms programs={programs} onOpen={onOpen} onStart={onStart} onNew={vi.fn()} />);

    expect(screen.getByPlaceholderText('Search programs')).toBeInTheDocument();
    expect(screen.getByText('Hypertrophy')).toBeInTheDocument();
    expect(screen.getByText('2 days')).toBeInTheDocument();
    expect(screen.getByText('3 exercises')).toBeInTheDocument();
    expect(screen.getByText('Pull · Back, Biceps, Rear delts')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /open push \/ pull \/ legs/i }));
    expect(onOpen).toHaveBeenCalledWith('program-1');

    fireEvent.click(screen.getByRole('button', { name: /start pull/i }));
    expect(onStart).toHaveBeenCalledWith(programs[0], programs[0].days[1]);
  });

  it('filters programs and exposes the no-match state', () => {
    render(<MobilePrograms programs={programs} onOpen={vi.fn()} onStart={vi.fn()} onNew={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText('Search programs'), { target: { value: 'upper' } });

    expect(screen.getByText('No programs match “upper”.')).toBeInTheDocument();
  });

  it('shows an actionable empty state', () => {
    const onNew = vi.fn();
    render(<MobilePrograms programs={[]} onOpen={vi.fn()} onStart={vi.fn()} onNew={onNew} />);

    fireEvent.click(screen.getByRole('button', { name: /build your first program/i }));
    expect(onNew).toHaveBeenCalledOnce();
  });
});

describe('MobileProgramDetail', () => {
  it('matches the Mobile Kit detail hierarchy and exposes its actions', () => {
    const program = {
      ...programs[0],
      days: [
        { ...programs[0].days[0], weekday: 'Mon' },
        { ...programs[0].days[1], weekday: 'Wed' },
      ],
    };
    const onEdit = vi.fn();
    const onOpenDay = vi.fn();
    const onAddDay = vi.fn();
    const onDelete = vi.fn();
    render(
      <MobileProgramDetail
        program={program}
        onBack={vi.fn()}
        onStart={vi.fn()}
        onEdit={onEdit}
        onOpenDay={onOpenDay}
        onAddDay={onAddDay}
        onDelete={onDelete}
      />,
    );

    expect(screen.getByRole('button', { name: /edit program/i })).toBeInTheDocument();
    expect(screen.getByText('2 training days · 5 rest')).toBeInTheDocument();
    expect(screen.getAllByText('Rest')).toHaveLength(5);

    fireEvent.click(screen.getByRole('button', { name: /open pull day/i }));
    expect(onOpenDay).toHaveBeenCalledWith(program.days[1]);
    fireEvent.click(screen.getByRole('button', { name: /add a day/i }));
    expect(onAddDay).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole('button', { name: /delete program/i }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
