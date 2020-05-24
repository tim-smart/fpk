import "ts-node/register";

import { availableFormats, generate } from "@fpk/core";
import { Command, flags } from "@oclif/command";
import * as fs from "fs/promises";
import { safeLoad } from "js-yaml";

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
      description: "yaml file to load context configuration from",
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
      context = safeLoad(contextBlob.toString("utf8"));
    }

    await generate(flags.source, flags.output, {
      context,
      format: flags.format,
    });
  }
}

export = FpkCli;
