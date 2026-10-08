import { spawn, execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";

// Nunca permite una conexión remota ni elegir otro contenedor desde Cypress.
const container = "supabase_db_Gastronimia";
const args = ["exec", "-i", container, "psql", "-X", "-U", "postgres", "-d", "postgres", "-qAt", "-v", "ON_ERROR_STOP=1", "-v", "VERBOSITY=verbose"];
export const literal = (value: string) => `'${value.replaceAll("'", "''")}'`;

export type Outcome = { ok: boolean; errorCode: string | null };

export class Session {
  private process = spawn("docker", args, { stdio: ["pipe", "pipe", "pipe"] });
  private errors = "";
  private exited = false;

  constructor() {
    // psql cierra la entrada al rechazar una operación con ON_ERROR_STOP.
    this.process.stdin.on("error", () => undefined);
    this.process.stderr.on("data", (chunk) => { this.errors += String(chunk); });
    this.process.on("exit", () => { this.exited = true; });
  }

  run(sql: string): Promise<Outcome> {
    if (this.exited) return Promise.resolve({ ok: false, errorCode: "EXITED" });
    const marker = `done_${randomUUID().replaceAll("-", "")}`;
    return new Promise((resolve, reject) => {
      let output = "";
      const timer = setTimeout(() => { cleanup(); reject(new Error("La sesión QA excedió 20 segundos.")); }, 20_000);
      const onData = (chunk: Buffer) => {
        output += String(chunk);
        if (output.includes(marker)) { cleanup(); resolve({ ok: true, errorCode: null }); }
      };
      const onExit = () => { cleanup(); resolve({ ok: false, errorCode: this.errors.match(/ERROR:\s+([A-Z0-9]{5}):/)?.[1] ?? "UNKNOWN" }); };
      const onError = () => { cleanup(); reject(new Error("No se pudo abrir la conexión QA de Docker.")); };
      const cleanup = () => {
        clearTimeout(timer);
        this.process.stdout.off("data", onData);
        this.process.off("exit", onExit);
        this.process.off("error", onError);
      };
      this.process.stdout.on("data", onData);
      this.process.once("exit", onExit);
      this.process.once("error", onError);
      this.process.stdin.write(`${sql}\n\\echo ${marker}\n`);
    });
  }

  close() { if (!this.exited && !this.process.stdin.destroyed) this.process.stdin.end("\\q\n"); }
}

export function query(sql: string): string {
  return execFileSync("docker", args, { input: sql, encoding: "utf8", timeout: 10_000 }).trim();
}

