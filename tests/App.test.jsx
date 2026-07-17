import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SmartTeleprompter from "../src/App";

describe("SmartTeleprompter", () => {
  it("renders without crashing", () => {
    const { container } = render(<SmartTeleprompter />);
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("renders the toolbar with control buttons", () => {
    render(<SmartTeleprompter />);
    expect(screen.getAllByLabelText("Microphone").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Auto Scroll").length).toBeGreaterThan(0);
    expect(screen.getAllByLabelText("Settings").length).toBeGreaterThan(0);
  });

  it("renders the default welcome text", () => {
    const { container } = render(<SmartTeleprompter />);
    expect(container.textContent).toContain("Welcome");
    expect(container.textContent).toContain("Smart");
    expect(container.textContent).toContain("Teleprompter");
  });

  it("shows the file import button in the script editor", () => {
    render(<SmartTeleprompter />);
    fireEvent.click(screen.getAllByLabelText("Script Editor")[0]);
    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
  });
});
