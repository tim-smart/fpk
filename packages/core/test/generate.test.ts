import { describe, it } from "mocha";
import { expect } from "chai";
import { generate } from "../src/index";
import * as path from "path";
import * as fs from "fs";
import { sync as rmrf } from "rimraf";
import { compare } from "dir-compare";

const examples = fs.readdirSync(path.join(__dirname, "examples"));

describe("generate", () => {
  examples.forEach((example) => {
    const inDir = path.join(__dirname, "examples", example, "in");
    const genDir = path.join(__dirname, "examples", example, "gen");
    const outDir = path.join(__dirname, "examples", example, "out");

    it(`generates ${example} correctly`, (done) => {
      rmrf(genDir);
      generate(inDir, genDir)
        .then(() =>
          compare(genDir, outDir, {
            compareContent: true,
          }),
        )
        .then((r) => {
          expect(r.same).to.equal(true);
          done();
        })
        .catch(done);
    });
  });
});
