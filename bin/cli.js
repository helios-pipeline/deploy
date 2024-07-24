#!/usr/bin/env node
const process = require('process');
const { outputValidArguments } = require("../src/utils/valid-arguments");
const { setProfile } = require("../src/utils/set-profile");
const { runDeploy } = require("../src/utils/run-deploy");
const { runDestroy } = require("../src/utils/run-destroy.js");
const { heliosArt } = require("../src/ascii/heliosAscii.js");


let profile;

async function setup() {
  // heliosArt();
  profile = await setProfile();
  await runDeploy(profile);
}

async function main() {
  const arg = process.argv[2];
  if (arg === undefined) {
    setup();
    // outputValidArguments();
  } else if ( arg === 'deploy') {
    heliosArt();
    setup();
  } else if (arg === 'destroy') {
    if (!profile) {
      profile = await setProfile();
    }
    runDestroy(profile);
  } else {
    console.log('Invalid argument.');
    outputValidArguments();
  }
}

main();