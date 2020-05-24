import { describe, it } from "mocha";
import { expect } from "chai";
import { generate } from "../src/index";
import * as path from "path";
import * as fs from "fs";
import { sync as rmrf } from "rimraf";
import { compare } from "dir-compare";
import ncp from "ncp";
import * as Rx from "rxjs";

const examples = fs.readdirSync(path.join(__dirname, "examples"));

describe("generate", () => {
  examples
    .filter((f) => !f.startsWith("_"))
    .forEach((example) => {
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

  it("works with context", (done) => {
    const inDir = path.join(__dirname, "examples/_context-test/in");
    const genDir = path.join(__dirname, "examples/_context-test/gen");
    const outDir = path.join(__dirname, "examples/_context-test/out");

    rmrf(genDir);

    generate(inDir, genDir, {
      context: {
        value: "secret",
      },
    })
      .then(() => compare(genDir, outDir, { compareContent: true }))
      .then((r) => {
        expect(r.same).to.equal(true);
        done();
      })
      .catch(done);
  });
});
