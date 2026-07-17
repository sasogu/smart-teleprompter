import { describe, it, expect } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    const { container } = render(<SmartTeleprompter />);
    fireEvent.click(container.querySelector('button[aria-label="Script Editor"]'));
    expect(
      Array.from(container.querySelectorAll("button")).some(
        (button) => button.textContent === "Import"
      )
    ).toBe(true);
  });

  it("renders imported markdown as clean teleprompter text", async () => {
    const { container } = render(<SmartTeleprompter />);
    fireEvent.click(container.querySelector('button[aria-label="Script Editor"]'));

    const importButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent === "Import"
    );
    const input = importButton.parentElement.querySelector("input");
    const file = new File(
      ["# Scene Title\n\n- **First** item\n> Read [this line](https://example.com)"],
      "script.md",
      { type: "text/markdown" }
    );
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(container.querySelector("#line-0").textContent).toContain(
        "Scene Title"
      );
    });
    expect(container.querySelector("#line-0").textContent).not.toContain("#");
    expect(container.querySelector("#line-2").textContent).toContain(
      "- First item"
    );
    expect(container.querySelector("#line-2").textContent).not.toContain("**");
    expect(container.querySelector("#line-3").textContent).toContain(
      "Read this line"
    );
    expect(container.querySelector("#line-3").textContent).not.toContain(
      "https://example.com"
    );
  });

  it("can hide support prompts from settings", () => {
    const { container } = render(<SmartTeleprompter />);
    expect(container.querySelector('button[aria-label="Buy Me a Coffee"]')).toBeInTheDocument();

    fireEvent.click(container.querySelector('button[aria-label="Settings"]'));
    fireEvent.click(
      container.querySelector('button[aria-label="Toggle Support Prompts"]')
    );

    expect(container.querySelector('button[aria-label="Buy Me a Coffee"]')).toBeNull();
    expect(container.textContent).not.toContain("Enjoying Smart Teleprompter?");
  });

  it("can switch the prompter interface to Spanish", () => {
    const { container } = render(<SmartTeleprompter />);
    fireEvent.click(container.querySelector('button[aria-label="Settings"]'));
    fireEvent.click(
      Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === "Español"
      )
    );

    expect(container.textContent).toContain("Ajustes");
    expect(container.textContent).toContain("Idioma de la interfaz");
    expect(container.textContent).toContain("Restablecer ajustes");
  });
});
