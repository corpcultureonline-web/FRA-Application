import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

let pool: Pool | undefined;

export function getDatabase() {
  if (!pool) {
    pool = mysql.createPool(connectionOptions(process.env));
  }

  return pool;
}

type Env = Record<string, string | undefined>;

/**
 * DATABASE_URL as typed into a hosting panel: forgives surrounding quotes or
 * spaces, a pasted "DATABASE_URL=" prefix, and a password whose @ # / ? were
 * not percent-encoded. DB_HOST / DB_USER / DB_PASSWORD / DB_NAME (and DB_PORT)
 * are an alternative that needs no encoding at all. A value that still cannot
 * be read fails with what is wrong with it — never the password itself.
 */
export function connectionOptions(env: Env): PoolOptions {
  if (env.DB_HOST && env.DB_USER && env.DB_NAME) {
    return {
      host: env.DB_HOST.trim(),
      port: env.DB_PORT ? Number(env.DB_PORT.trim()) : 3306,
      user: env.DB_USER.trim(),
      password: env.DB_PASSWORD ?? "",
      database: env.DB_NAME.trim(),
    };
  }

  const raw = env.DATABASE_URL;
  if (!raw || !raw.trim()) {
    throw new Error("DATABASE_URL is not configured.");
  }
  const value = raw
    .trim()
    .replace(/^DATABASE_URL\s*=\s*/, "")
    .replace(/^(["'])(.*)\1$/, "$2")
    .trim();

  // mysql://user:password@host:port/database, splitting on the LAST @ so an
  // unencoded @ (or # / ?) in the password stays part of the password.
  const match = /^mysql:\/\/([^:@/]+):(.*)@([^@:/\s]+)(?::(\d+))?\/([^/?#\s]+)$/.exec(value);
  if (match) {
    const [, user, password, host, port, database] = match;
    return { host, port: port ? Number(port) : 3306, user: decode(user), password: decode(password), database: decode(database) };
  }
  // Anything else mysql2 reads itself (e.g. ?ssl=… options), as before.
  if (isPlainUrl(value)) return { uri: value };

  throw new Error(`DATABASE_URL cannot be read: ${describeProblem(value)}`);
}

/** True when the URL parses whole: no space, and nothing cut off as a #fragment. */
function isPlainUrl(value: string) {
  try {
    const url = new URL(value);
    return !/\s/.test(value) && url.protocol === "mysql:" && !url.hash && url.pathname.length > 1;
  } catch {
    return false;
  }
}

/** Percent-decodes when the text was encoded; leaves a raw % alone. */
function decode(text: string) {
  try {
    return decodeURIComponent(text);
  } catch {
    return text;
  }
}

function describeProblem(value: string) {
  if (!value.startsWith("mysql://")) return "it must start with mysql:// (it starts differently).";
  if (/\s/.test(value)) return "it contains a space.";
  if (/["']/.test(value)) return "it contains a quote mark.";
  const rest = value.slice("mysql://".length);
  if (!rest.includes("@")) return "there is no @ between the password and the host.";
  const afterAt = rest.slice(rest.lastIndexOf("@") + 1);
  const userPart = rest.slice(0, rest.lastIndexOf("@"));
  if (!userPart.includes(":")) return "there is no : between the user name and the password.";
  if (!afterAt.includes("/")) return "there is no /databasename after the host.";
  const hostPort = afterAt.slice(0, afterAt.indexOf("/"));
  if (hostPort.includes(":") && !/^[^:]+:\d+$/.test(hostPort)) return "the port after the host is not a number.";
  return "expected mysql://user:password@host:3306/database.";
}
