import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/app/page";
import { defaultState } from "@/lib/defaultState";
import { saveState, saveView } from "@/lib/storage";
import type { AppState } from "@/lib/types";
import { dateToKey } from "@/lib/dates";

function seedSavedState(wfoDates: string[]): AppState {
  const state: AppState = { ...defaultState(), leavesByMonth: { "2026-08": 2 }, wfoDates };
  saveState(state);
  return state;
}

describe("reload restore", () => {
  it("opens the current month's dashboard when data exists, even without a saved view", async () => {
    seedSavedState([dateToKey(new Date())]);

    render(<Home />);

    expect(await screen.findByText("Saved to this device")).toBeInTheDocument();
    expect(screen.queryByText("Which month and how many office days?")).not.toBeInTheDocument();
  });

  it("opens the dashboard for a saved month after reload", async () => {
    const now = new Date();
    seedSavedState([dateToKey(now)]);
    saveView({ step: "done", year: now.getFullYear(), month: now.getMonth(), applied: true });

    render(<Home />);

    expect(await screen.findByText("Saved to this device")).toBeInTheDocument();
    expect(screen.queryByText("Which month and how many office days?")).not.toBeInTheDocument();
  });

  it("starts fresh on step 1 when nothing is saved", async () => {
    render(<Home />);

    expect(screen.getByText("Which month and how many office days?")).toBeInTheDocument();
    expect(screen.queryByText("Saved to this device")).not.toBeInTheDocument();
  });

  it("keeps the Review tab open for a saved month as the only exception", async () => {
    const user = userEvent.setup();
    seedSavedState([dateToKey(new Date())]);
    saveView({ step: "done", year: 2026, month: new Date().getMonth(), applied: true });

    render(<Home />);
    expect(await screen.findByText("Saved to this device")).toBeInTheDocument();

    const reviewStep = screen.getByRole("button", { name: /review your month/i });
    const setupStep = screen.getByRole("button", { name: /month & office days/i });
    const planStep = screen.getByRole("button", { name: /choose how to plan/i });
    expect(reviewStep).not.toBeDisabled();
    expect(setupStep).toBeDisabled();
    expect(planStep).toBeDisabled();

    await user.click(reviewStep);
    expect(screen.getByText("Review & fine-tune")).toBeInTheDocument();
    expect(screen.queryByText("Which month and how many office days?")).not.toBeInTheDocument();
  });
});