/**
 * DATABASE_URL as it arrives from a hosting panel: the forms that broke the
 * staging deploy with "Invalid URL", and that the error never leaks a password.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { connectionOptions } from "./db.ts";

const parts = { host: "localhost", port: 3306, user: "u1_fra", database: "u1_stage" };

describe("database connection settings", () => {
  it("an ordinary URL gives its parts; one with options goes to mysql2 as it is", () => {
    assert.deepEqual(connectionOptions({ DATABASE_URL: "mysql://u1_fra:Abc123@localhost:3306/u1_stage" }), { ...parts, password: "Abc123" });
    const withOptions = "mysql://u1_fra:Abc123@db.example.com:3306/u1_stage?ssl=true";
    assert.deepEqual(connectionOptions({ DATABASE_URL: withOptions }), { uri: withOptions });
  });

  it("forgives quotes, spaces and a pasted DATABASE_URL= prefix", () => {
    for (const typed of [
      '"mysql://u1_fra:Abc123@localhost:3306/u1_stage"',
      "  mysql://u1_fra:Abc123@localhost:3306/u1_stage ",
      "DATABASE_URL=mysql://u1_fra:Abc123@localhost:3306/u1_stage",
    ]) {
      assert.deepEqual(connectionOptions({ DATABASE_URL: typed }), { ...parts, password: "Abc123" }, typed);
    }
  });

  it("keeps a password with unencoded @ # / ? whole", () => {
    for (const password of ["Ab@12", "Ab#12", "Ab/12", "Ab?12", "a@b#c/d?e"]) {
      assert.deepEqual(connectionOptions({ DATABASE_URL: `mysql://u1_fra:${password}@localhost:3306/u1_stage` }), { ...parts, password }, password);
    }
  });

  it("decodes a percent-encoded password, and a port-less URL defaults to 3306", () => {
    assert.deepEqual(connectionOptions({ DATABASE_URL: "mysql://u1_fra:Ab%4012%23x@localhost/u1_stage" }), { ...parts, password: "Ab@12#x" });
  });

  it("separate DB_* settings need no encoding", () => {
    assert.deepEqual(
      connectionOptions({ DB_HOST: "localhost", DB_USER: "u1_fra", DB_PASSWORD: "p@ss#/?", DB_NAME: "u1_stage" }),
      { ...parts, password: "p@ss#/?" },
    );
  });

  it("an unreadable value says what is wrong, never the password", () => {
    const cases: [string, RegExp][] = [
      ["mysq://u1_fra:Secret9@localhost:3306/u1_stage", /must start with mysql:\/\//],
      ["mysql://u1_fra Secret9@localhost:3306/u1_stage", /contains a space/],
      ["mysql://u1_fra:Secret9localhost:3306/u1_stage", /no @/],
      ["mysql://u1_fra:Secret9@localhost:3306", /no \/databasename/],
      ["mysql://u1_fra:Secret9@localhost:PORT/u1_stage", /port .* not a number/],
    ];
    for (const [value, expected] of cases) {
      assert.throws(() => connectionOptions({ DATABASE_URL: value }), (error: Error) => {
        assert.match(error.message, expected, value);
        assert.doesNotMatch(error.message, /Secret9/);
        return true;
      });
    }
    assert.throws(() => connectionOptions({}), /not configured/);
  });
});
