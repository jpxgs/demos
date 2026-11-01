import test from "node:test";
import assert from "node:assert/strict";
import { records } from "./records.js";

test("catalogue has unique, stable identifiers", () => {
  const ids = records.map(({ id }) => id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(ids.every((id) => /^[a-z0-9-]+$/.test(id)));
});

test("every record has a supported discipline and useful destination", () => {
  for (const record of records) {
    assert.ok(["talk", "opsec", "value"].includes(record.type), record.id);
    assert.ok(record.title && record.creator && record.description, record.id);
    assert.ok(record.videoId || (record.links && record.links.length > 0), record.id);
    for (const link of record.links || []) {
      assert.doesNotThrow(() => new URL(link.url), record.id);
      assert.match(link.url, /^https:\/\//, record.id);
    }
  }
});

test("video identifiers are not duplicated", () => {
  const ids = records.filter((record) => record.videoId).map((record) => record.videoId);
  assert.equal(new Set(ids).size, ids.length);
});

test("the catalogue represents all three disciplines", () => {
  for (const type of ["talk", "opsec", "value"]) {
    assert.ok(records.some((record) => record.type === type), type);
  }
});
