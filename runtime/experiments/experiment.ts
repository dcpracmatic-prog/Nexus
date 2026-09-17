import fs from "fs";
import path from "path";
import { traceId, hashText } from "../audit/trace";

export function createExperiment(baseDir: string, baselinePath: string) {
  const id = traceId();
  const root = path.join(baseDir, id);
  for (const d of ["workspace", "baseline", "candidate", "datasets", "tests", "artifacts", "metrics", "patches", "logs"]) fs.mkdirSync(path.join(root, d), { recursive: true });
  const baselineHash = fs.existsSync(baselinePath) && fs.statSync(baselinePath).isFile() ? hashText(fs.readFileSync(baselinePath, "utf8")) : "UNAVAILABLE";
  fs.writeFileSync(path.join(root, "experiment.json"), JSON.stringify({ id, baselineHash, createdAt: new Date().toISOString(), status: "OPEN" }, null, 2));
  return { id, root, baselineHash };
}
