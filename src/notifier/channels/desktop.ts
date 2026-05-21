import { execFile } from "child_process";
import { promisify } from "util";
import { platform } from "os";

const execFileAsync = promisify(execFile);

export interface DesktopNotification {
  title: string;
  message: string;
  urgency?: "low" | "normal" | "critical";
}

export async function sendDesktopNotification(
  notification: DesktopNotification
): Promise<void> {
  const { title, message, urgency = "normal" } = notification;
  const os = platform();

  try {
    if (os === "darwin") {
      const script = `display notification "${message}" with title "${title}"`;
      await execFileAsync("osascript", ["-e", script]);
    } else if (os === "linux") {
      await execFileAsync("notify-send", [
        `--urgency=${urgency}`,
        title,
        message,
      ]);
    } else if (os === "win32") {
      const psScript = [
        "[Windows.UI.Notifications.ToastNotificationManager,",
        "Windows.UI.Notifications,ContentType=WindowsRuntime] | Out-Null;",
        `$template = [Windows.UI.Notifications.ToastTemplateType]::ToastText02;`,
        `$xml = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent($template);`,
        `$xml.GetElementsByTagName('text')[0].AppendChild($xml.CreateTextNode('${title}')) | Out-Null;`,
        `$xml.GetElementsByTagName('text')[1].AppendChild($xml.CreateTextNode('${message}')) | Out-Null;`,
        `$toast = [Windows.UI.Notifications.ToastNotification]::new($xml);`,
        `[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('DeployWatch').Show($toast);`,
      ].join(" ");
      await execFileAsync("powershell", ["-Command", psScript]);
    } else {
      throw new Error(`Unsupported platform: ${os}`);
    }
  } catch (err) {
    throw new Error(
      `Failed to send desktop notification: ${(err as Error).message}`
    );
  }
}

export function urgencyFromStatus(status: string): DesktopNotification["urgency"] {
  if (status === "failure" || status === "error") return "critical";
  if (status === "success") return "normal";
  return "low";
}
