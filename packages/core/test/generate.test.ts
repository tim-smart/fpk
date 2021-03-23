import { describe, it } from "mocha";
import { expect } from "chai";
import { generate } from "../src/index";
import * as path from "path";
import * as fs from "fs";
import { sync as rmrf } from "rimraf";
import { compare } from "dir-compare";
import ncp from "ncp";

const examples = fs.readdirSync(path.join(__dirname, "examples"));

interface ITestCase {
  inDir: string;
  outDir: string;
  genDir: string;
  context?: any;
  format?: string;
  ignore?: string;
}

function testCase(
  itString: string,
  { genDir, inDir, outDir, context, format, ignore }: ITestCase,
) {
  it(itString, (done) => {
    rmrf(genDir);

    generate(inDir, genDir, { format, context, ignore })
      .then(() => compare(genDir, outDir, { compareContent: true }))
      .then((r) => {
        if (!r.same) console.error(r.diffSet);
        expect(r.same).to.equal(true);
        done();
      })
      .catch(done);
  });
}

describe("generate", () => {
  examples
    .filter((f) => !f.startsWith("_"))
    .forEach((example) => {
      const inDir = path.join(__dirname, "examples", example, "in");
      const genDir = path.join(__dirname, "examples", example, "gen");
      const outDir = path.join(__dirname, "examples", example, "out");

      testCase(`generates ${example} correctly`, {
        inDir,
        genDir,
        outDir,
      });
    });

  it("removes configuration correctly", (done) => {
    const basicOutDir = path.join(__dirname, "examples/01-index-files/out");
    const inDir = path.join(__dirname, "examples/_remove-test/in");
    const genDir = path.join(__dirname, "examples/_remove-test/gen");
    const outDir = path.join(__dirname, "examples/_remove-test/out");

    rmrf(genDir);
    ncp(basicOutDir, genDir, (err) => {
      if (err) throw err;

      generate(inDir, genDir)
        .then(() => compare(genDir, outDir, { compareContent: true }))
        .then((r) => {
          expect(r.same).to.equal(true);
          done();
        })
        .catch(done);
    });
  });

  testCase("works with context", {
    context: { value: "secret" },
    inDir: path.join(__dirname, "examples/_context-test/in"),
    genDir: path.join(__dirname, "examples/_context-test/gen"),
    outDir: path.join(__dirname, "examples/_context-test/out"),
  });

  testCase("works with json", {
    format: "json",
    context: { value: "secret" },
    inDir: path.join(__dirname, "examples/_json-test/in"),
    genDir: path.join(__dirname, "examples/_json-test/gen"),
    outDir: path.join(__dirname, "examples/_json-test/out"),
  });

  testCase("works with ignore", {
    ignore: "*.ts",
    inDir: path.join(__dirname, "examples/_ignore-test/in"),
    genDir: path.join(__dirname, "examples/_ignore-test/gen"),
    outDir: path.join(__dirname, "examples/_ignore-test/out"),
  });
});
