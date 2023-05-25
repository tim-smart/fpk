import { availableFormats, generate } from "@fpk/core";
import { Command, flags } from "@oclif/command";
import { watch } from "chokidar";
import { promises as fs } from "fs";
import * as Yaml from "js-yaml";
import * as path from "path";
import * as CB from "strict-callbag-basics";
import * as TSNode from "ts-node";

TSNode.register({ transpileOnly: true });

export default class FpkCli extends Command {
  static description = "Generate configuration from an fpk config tree";

  static flags = {
    // add --version flag to show CLI version
    version: flags.version({ char: "v" }),
    help: flags.help({ char: "h" }),
    source: flags.string({
      char: "d",
      description: "source directory",
      required: true,
    }),
    ignore: flags.string({
      char: "i",
      description: "pattern of files to ignore in the source directory",
    }),
    output: flags.string({
      char: "o",
      description: "output directory",
      required: true,
    }),
    context: flags.string({
      char: "c",
      description: "yaml/json/js file to load context configuration from",
    }),
    format: flags.enum({
      char: "f",
      options: availableFormats(),
      default: "yaml",
    }),
    watch: flags.boolean({
      char: "w",
      description: "watch for changes",
      default: false,
    }),
  };

  static args = [];

  async run() {
    const { flags } = this.parse(FpkCli);
    let context = {};

    if (flags.context) {
      const contextBlob = await fs.readFile(flags.context);

      switch (path.extname(flags.context)) {
        case ".json":
          context = JSON.parse(contextBlob.toString("utf8"));
          break;

        case ".yaml":
        case ".yml":
          context = Yaml.load(contextBlob.toString("utf8")) as object;
          break;

        default:
          const x = require(path.resolve(flags.context));
          context = x.default || x;
      }
    }

    const generator = () => {
      const start = Date.now();
      console.log("BUILD", "Running...");

      return generate(flags.source, flags.output, {
        context,
        format: flags.format,
        ignore: flags.ignore,
      }).then(() => {
        const diff = Date.now() - start;
        console.log("BUILD", `Completed in ${diff}ms`);
      });
    };

    function resetCache() {
      Object.keys(require.cache).forEach((key) => {
        delete require.cache[key];
      });
    }

    await generator();

    if (flags.watch) {
      CB.pipe(
        CB.fromEventP(watch(flags.source, { ignoreInitial: true }), "all"),
        CB.tap((e) => console.log("WATCH", e)),
        CB.auditTimeP(200),
        CB.tap(resetCache),
        CB.chain(() => CB.fromPromise_(generator, (e) => e)),
        CB.run_,
      );

      console.log("WATCH", "Started");
    }
  }
}
