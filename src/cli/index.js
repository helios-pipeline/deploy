const process = require("process");
const readline = require("readline/promises");
const path = require("path");
const fs = require("fs/promises");
const { outputValidArguments } = require("../utils/valid-arguments");
const { setProfile } = require("./set-profile");
const { deploy } = require("./deploy");
const { destroy } = require("./destroy.js");
const { heliosArt } = require("../ascii/heliosAscii.js");
const { input, confirm } = require("@inquirer/prompts");

async function getChatGPTApiKey() {
  const wantApiKey = await confirm({
    message: "Would you like to provide a ChatGPT API key?",
  });

  if (wantApiKey) {
    const apiKey = await input({
      message: "Please enter your ChatGPT API key:",
    });
    console.log(apiKey);

    const envPath = path.resolve(process.cwd(), ".env");
    await fs.appendFile(envPath, `\nchatGptApiKey=${apiKey}`);
    return apiKey;
  } else {
    return null;
  }
}

let profile;

async function setup() {
  profile = await setProfile();
  await getChatGPTApiKey();
  await deploy(profile);
}

async function main() {
  const arg = process.argv[2];
  if (arg === undefined) {
    setup();
  } else if (arg === "deploy") {
    heliosArt();
    setup();
  } else if (arg === "destroy") {
    if (!profile) {
      profile = await setProfile();
    }
    destroy(profile);
  } else {
    console.log("Invalid argument.");
    outputValidArguments();
  }
}

exports.main = main;