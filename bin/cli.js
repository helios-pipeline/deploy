#!/usr/bin/env node
const process = require('process');
const { outputValidArguments } = require("../src/utils/valid-arguments");
const { setProfile } = require("../src/utils/set-profile");
const { runDeploy } = require("../src/utils/run-deploy");
const { runDestroy } = require("../src/utils/run-destroy.js");

 
async function setup() {
  // heliosArt();
  const profile = await setProfile();
  await runDeploy(profile);
}

function main() {
  const arg = process.argv[2];
  if (arg === undefined) {
    setup();
    // outputValidArguments();
  } else if ( arg === 'deploy') {
    setup();
  } else if (arg === 'destroy') {
    runDestroy();
  } else {
    console.log('Invalid argument.');
    outputValidArguments();
  }
}

main();