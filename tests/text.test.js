import test from "node:test";
import assert from "node:assert/strict";
import { parseSelection, stripHtml, slugify } from "../src/lib/text.js";

test("stripHtml removes tags and entities", () => {
  assert.equal(stripHtml("<p>Hello &amp; <strong>world</strong></p>"), "Hello & world");
});

test("slugify creates safe folder names", () => {
  assert.equal(slugify("Senior Product Designer @ ACME"), "senior-product-designer-acme");
});

test("parseSelection expands ranges", () => {
  assert.deepEqual(parseSelection("1,3-4", 5), [0, 2, 3]);
});
