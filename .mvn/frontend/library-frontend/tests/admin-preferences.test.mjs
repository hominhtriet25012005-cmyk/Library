import assert from "node:assert/strict";
import test from "node:test";
import { readAdminDensity, saveAdminDensity } from "../src/pages/AdminLayout/adminPreferences.js";

test("AD8 display density is local-only and falls back safely", () => {
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(readAdminDensity(storage), "comfortable");
  saveAdminDensity("compact", storage);
  assert.equal(readAdminDensity(storage), "compact");
  values.set("library.admin.density", "invalid");
  assert.equal(readAdminDensity(storage), "comfortable");
  assert.throws(() => saveAdminDensity("invalid", storage), /Mật độ/);
});
