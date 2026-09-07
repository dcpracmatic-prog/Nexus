import crypto from "crypto";

export function traceId(prefix = "exp") { return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`; }
export function hashText(text: string) { return crypto.createHash("sha256").update(text).digest("hex"); }
