import "ts-node/register";

import { availableFormats, generate } from "@fpk/core";
import { Command, flags } from "@oclif/command";
import * as fs from "fs/promises";
import { safeLoad } from "js-yaml";
import * as path from "path";

class FpkCli extends Command {
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
          context = safeLoad(contextBlob.toString("utf8"));
          break;

        default:
          const x = require(path.resolve(flags.context));
          context = x.default || x;
      }
    }

    await generate(flags.source, flags.output, {
      context,
      format: flags.format,
    });
  }
}

export = FpkCli;
