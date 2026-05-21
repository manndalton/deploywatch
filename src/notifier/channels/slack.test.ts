import { describe, it, expect, vi, beforeEach } from "vitest";
import { buildSlackPayload, sendSlackNotification, SlackConfig } from "./slack";
import { DeploymentChange } from "../notifier";

function makeChange(overrides: Partial<DeploymentChange["deployment"]> = {}): DeploymentChange {
  return {
    deployment: {
      id: "dep-1",
      provider: "github",
      repo: "acme/api",
      branch: "main",
      status: "success",
      environment: "production",
      url: "https://github.com/acme/api/actions/runs/1",
      updatedAt: new Date().toISOString(),
      ...overrides,
    },
    previousStatus: "in_progress",
  };
}

describe("buildSlackPayload", () => {
  it("sets color to 'good' for success status", () => {
    const payload = buildSlackPayload(makeChange());
    expect(payload.attachments[0].color).toBe("good");
  });

  it("sets color to 'danger' for failure status", () => {
    const payload = buildSlackPayload(makeChange({ status: "failure" }));
    expect(payload.attachments[0].color).toBe("danger");
  });

  it("sets color to 'warning' for cancelled status", () => {
    const payload = buildSlackPayload(makeChange({ status: "cancelled" }));
    expect(payload.attachments[0].color).toBe("warning");
  });

  it("includes previous status in text when provided", () => {
    const payload = buildSlackPayload(makeChange());
    expect(payload.attachments[0].text).toContain("in_progress");
    expect(payload.attachments[0].text).toContain("success");
  });

  it("uses default username when not configured", () => {
    const payload = buildSlackPayload(makeChange());
    expect(payload.username).toBe("deploywatch");
  });

  it("uses custom username from config", () => {
    const payload = buildSlackPayload(makeChange(), { username: "mybot" });
    expect(payload.username).toBe("mybot");
  });

  it("includes branch and environment fields", () => {
    const payload = buildSlackPayload(makeChange());
    const fields = payload.attachments[0].fields as Array<{ title: string; value: string }>;
    expect(fields.find((f) => f.title === "Branch")?.value).toBe("main");
    expect(fields.find((f) => f.title === "Environment")?.value).toBe("production");
  });
});

describe("sendSlackNotification", () => {
  const config: SlackConfig = { webhookUrl: "https://hooks.slack.com/test", channel: "#deploys" };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("posts JSON payload to webhook URL", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await sendSlackNotification(makeChange(), config);
    expect(fetch).toHaveBeenCalledWith(
      config.webhookUrl,
      expect.objectContaining({ method: "POST" })
    );
  });

  it("throws when webhook returns non-ok response", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 400, statusText: "Bad Request" } as Response);
    await expect(sendSlackNotification(makeChange(), config)).rejects.toThrow("Slack webhook failed");
  });
});
