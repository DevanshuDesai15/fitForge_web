import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TIMER_STATUS } from "../../utils/workoutTimerState";
import WorkoutTimerControl from "../WorkoutTimerControl";

describe("WorkoutTimerControl", () => {
  it("shows elapsed time and pauses a running workout", () => {
    const onPause = vi.fn();

    render(
      <WorkoutTimerControl
        elapsedTime={65}
        timerStatus={TIMER_STATUS.RUNNING}
        onPause={onPause}
        onResume={vi.fn()}
      />
    );

    expect(screen.getByText("1:05")).toBeInTheDocument();
    expect(screen.getByText("Workout running")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pause workout timer" }));
    expect(onPause).toHaveBeenCalledTimes(1);
  });

  it("shows paused status and resumes without changing the displayed time", () => {
    const onResume = vi.fn();

    render(
      <WorkoutTimerControl
        elapsedTime={3_661}
        timerStatus={TIMER_STATUS.PAUSED}
        onPause={vi.fn()}
        onResume={onResume}
      />
    );

    expect(screen.getByText("1:01:01")).toBeInTheDocument();
    expect(screen.getByText("Workout paused")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Resume workout timer" }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
