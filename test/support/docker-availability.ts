import { execFileSync } from "node:child_process";

export function isDockerAvailable(): boolean {
  try {
    execFileSync("docker", ["version"], { stdio: "ignore" });

    return true;
  } catch {
    return false;
  }
}
