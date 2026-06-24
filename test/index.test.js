const test = require("node:test");
const assert = require("node:assert/strict");
const { hello } = require("../src/index");

test("hello uses default value", () => {
  assert.equal(hello(), "Hello, AA-CQ reports are ready.");
});

test("hello accepts custom name", () => {
  assert.equal(hello("Team"), "Hello, Team reports are ready.");
});
