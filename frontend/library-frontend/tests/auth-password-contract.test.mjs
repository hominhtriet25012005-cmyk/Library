import assert from "node:assert/strict";
import test from "node:test";

test("registration and password reset share the 8 to 72 character contract", async () => {
  const { validateNewPassword } = await import(
    "../src/pages/library/Auth/passwordRules.js"
  );

  assert.match(validateNewPassword("x".repeat(7)), /ít nhất 8 ký tự/i);
  assert.equal(validateNewPassword("x".repeat(8)), "");
  assert.equal(validateNewPassword("x".repeat(72)), "");
  assert.match(validateNewPassword("x".repeat(73)), /không quá 72 ký tự/i);
});
