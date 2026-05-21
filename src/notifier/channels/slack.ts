import { DeploymentChange } from "../notifier";

export interface SlackConfig {
  webhookUrl: string;
  channel?: string;
  username?: string;
}

function colorFromStatus(status: string): string {
  switch (status) {
    case "success":
    case "ready":
      return "good";
    case "failure":
    case "error":
      return "danger";
    case "cancelled":
    case "canceled":
      return "warning";
    default:
      return "#cccccc";
  }
}

export function buildSlackPayload(
  change: DeploymentChange,
  config: Partial<SlackConfig> = {}
): Record<string, unknown> {
  const { deployment, previousStatus } = change;
  const color = colorFromStatus(deployment.status);
  const title = `${deployment.provider.toUpperCase()} · ${deployment.repo}`;
  const text = previousStatus
    ? `Status changed from *${previousStatus}* → *${deployment.status}*`
    : `New deployment detected with status *${deployment.status}*`;

  return {
    username: config.username ?? "deploywatch",
    channel: config.channel,
    attachments: [
      {
        color,
        title,
        text,
        fields: [
          { title: "Branch", value: deployment.branch ?? "unknown", short: true },
          { title: "Environment", value: deployment.environment ?? "production", short: true },
        ],
        footer: "deploywatch",
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
}

export async function sendSlackNotification(
  change: DeploymentChange,
  config: SlackConfig
): Promise<void> {
  const payload = buildSlackPayload(change, config);
  const response = await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}
