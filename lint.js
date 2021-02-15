#!/usr/bin/env node
/**
 * @fileoverview
 * Linters for the package that can't easily be implemented in the existing
 * linters (e.g. jsonlint/svglint).
 */

const fs = require("fs");
const path = require("path");

const { diffLinesUnified } = require("jest-diff");

const UTF8 = "utf8";

const dataFile = path.resolve( __dirname, "..", "_data", "simple-icons.json");
const data = require(dataFile);

/**
 * Contains our tests so they can be isolated from each other.
 * @type {{[k:string]: () => (string|undefined)}}
 */
const TESTS = {
  /* Tests whether our icons are in alphabetical order */
  alphabetical: function() {
    const collector = (invalidEntries, icon, index, array) => {
      if (index > 0) {
        const prev = array[index - 1];
        if (icon.title.localeCompare(prev.title) < 0) {
          invalidEntries.push(icon);
        }
      }
      return invalidEntries;
    };

    const invalids = data.icons.reduce(collector, []);
    if (invalids.length) {
      return `Some icons aren't in alphabetical order:
        ${invalids.map(icon => icon.title).join(", ")}`;
    }
  },

  /* Check the formatting of the data file */
  prettified: function() {
    const dataString = fs.readFileSync(dataFile, UTF8).replace(/\r\n/g, '\n');
    const dataPretty = `${JSON.stringify(data, null, "    ")}\n`;
    if (dataString !== dataPretty) {
      const dataDiff = diffLinesUnified(
        dataString.split("\n"),
        dataPretty.split("\n"),
        {
          expand: false,
          omitAnnotationLines: true
        },
      );

      return `Data file is formatted incorrectly:\n\n${dataDiff}`;
    }
  }
};

// execute all tests and log all errors
const errors = Object.keys(TESTS)
  .map(k => TESTS[k]())
  .filter(Boolean);

if (errors.length > 0) {
  errors.forEach(error => console.error(`\u001b[31m${error}\u001b[0m`));
  process.exit(1);
}
