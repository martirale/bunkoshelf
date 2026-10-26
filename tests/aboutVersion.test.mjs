import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { runInNewContext } from "node:vm";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

const source = readFileSync(new URL("../src/components/settings/AboutVersion.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
const exports = {};
runInNewContext(compiled, { exports, require: createRequire(import.meta.url) });
const AboutVersion = exports.default;
const versionData = { currentVersion: "1.21.2", versionUrl: "https://github.com/martirale/bunkoshelf/releases/tag/1.21.2", gitSha: "abcdef1234567890abcdef1234567890abcdef12" };

test("only the short SHA links to the version tag in both languages", () => {
  for (const label of ["Versión", "Version"]) {
    const html = renderToStaticMarkup(createElement(AboutVersion, { versionData, label }));
    assert.ok(html.startsWith(`<p>${label} 1.21.2`));
    assert.ok(html.includes(`href="${versionData.versionUrl}"`));
    assert.ok(html.includes(`title="${versionData.gitSha}"`));
    assert.ok(html.includes(">abcdef1</a>"));
    assert.equal((html.match(/<a /g) ?? []).length, 1);
    assert.ok(!html.includes(">1.21.2</a>"));
  }
});

test("a build without a SHA keeps the version as plain text", () => {
  const html = renderToStaticMarkup(createElement(AboutVersion, { versionData: { ...versionData, gitSha: null }, label: "Versión" }));
  assert.ok(html.includes("Versión 1.21.2"));
  assert.ok(!html.includes("<a"));
  assert.ok(!html.includes(" · "));
});
