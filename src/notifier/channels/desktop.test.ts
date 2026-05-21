import { describe, it, expect, vi, beforeEach } from "vitest";
import { urgencyFromStatus, sendDesktopNotification } from "./desktop";

vi.mock("child_process", () => ({
  execFile: vi.fn((_cmd, _args, cb) => cb(null, "", "")),
}));

vi.mock("os", () => ({
  platform: vi.fn(() => "linux"),
}));

const { execFile } = await import("child_process");
const { platform } = await import("os");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("urgencyFromStatus", () => {
  it("returns critical for failure", () => {
    expect(urgencyFromStatus("failure")).toBe("critical");
  });

  it("returns critical for error", () => {
    expect(urgencyFromStatus("error")).toBe("critical");
  });

  it("returns normal for success", () => {
    expect(urgencyFromStatus("success")).toBe("normal");
  });

  it("returns low for other statuses", () => {
    expect(urgencyFromStatus("pending")).toBe("low");
    expect(urgencyFromStatus("running")).toBe("low");
    expect(urgencyFromStatus("queued")).toBe("low");
  });
});

describe("sendDesktopNotification", () => {
  it("calls notify-send on linux with correct args", async () => {
    vi.mocked(platform).mockReturnValue("linux");
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) =>
      cb(null, "", "")
    );

    await sendDesktopNotification({
      title: "Deploy Success",
      message: "main deployed to production",
      urgency: "normal",
    });

    expect(execFile).toHaveBeenCalledWith(
      "notify-send",
      ["--urgency=normal", "Deploy Success", "main deployed to production"],
      expect.any(Function)
    );
  });

  it("throws a descriptive error when execFile fails", async () => {
    vi.mocked(platform).mockReturnValue("linux");
    vi.mocked(execFile).mockImplementation((_cmd, _args, cb: any) =>
      cb(new Error("command not found"), "", "")
    );

    await expect(
      sendDesktopNotification({ title: "Test", message: "msg" })
    ).rejects.toThrow("Failed to send desktop notification");
  });

  it("throws for unsupported platform", async () => {
    vi.mocked(platform).mockReturnValue("freebsd" as any);

    await expect(
      sendDesktopNotification({ title: "Test", message: "msg" })
    ).rejects.toThrow("Unsupported platform");
  });
});
