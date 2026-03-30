import { describe, it, expect, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import SmartTeleprompter from "../src/App";

const SCRIPTS_KEY = "tp_scripts_v1";
const SETTINGS_KEY = "tp_settings_v1";

describe("Script library", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("seeds the demo script on first load", async () => {
    render(<SmartTeleprompter />);
    await waitFor(() => {
      const raw = localStorage.getItem(SCRIPTS_KEY);
      expect(raw).not.toBeNull();
    });
    const scripts = JSON.parse(localStorage.getItem(SCRIPTS_KEY));
    expect(scripts.length).toBeGreaterThanOrEqual(1);
    const demo = scripts.find((s) => s.id === "demo");
    expect(demo).toBeDefined();
    expect(demo.name).toBe("Demo Script");
    expect(demo.language).toBe("en-US");
    expect(demo.text).toContain("Welcome to Smart Teleprompter");
  });

  it("migrates existing text from settings on first load", async () => {
    const existingSettings = {
      fontSize: 32,
      text: "My existing script content",
      language: "el-GR",
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(existingSettings));

    render(<SmartTeleprompter />);
    await waitFor(() => {
      const raw = localStorage.getItem(SCRIPTS_KEY);
      expect(raw).not.toBeNull();
    });
    const scripts = JSON.parse(localStorage.getItem(SCRIPTS_KEY));
    const migrated = scripts.find((s) => s.id === "migrated");
    expect(migrated).toBeDefined();
    expect(migrated.name).toBe("My Script");
    expect(migrated.text).toBe("My existing script content");
    expect(migrated.language).toBe("el-GR");
  });

  it("preserves existing scripts and does not re-seed", async () => {
    const existing = [
      { id: "1", name: "Test", text: "Hello", language: "en-US", savedAt: new Date().toISOString() },
    ];
    localStorage.setItem(SCRIPTS_KEY, JSON.stringify(existing));

    render(<SmartTeleprompter />);
    await waitFor(() => {
      const scripts = JSON.parse(localStorage.getItem(SCRIPTS_KEY));
      expect(scripts.length).toBe(1);
    });
    const scripts = JSON.parse(localStorage.getItem(SCRIPTS_KEY));
    expect(scripts[0].name).toBe("Test");
    expect(scripts.find((s) => s.id === "demo")).toBeUndefined();
  });
});
