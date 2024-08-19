const { program } = require('commander');
const path = require('path');
const fs = require('fs').promises;
const { setProfile } = require('./set-profile');
const { deploy } = require('./deploy');
const { destroy } = require('./destroy');
const { heliosArt } = require('../ascii/heliosAscii');
const { input, confirm } = require('@inquirer/prompts');

async function getChatGPTApiKey() {
  const wantApiKey = await confirm({
    message: 'Would you like to provide a ChatGPT API key?',
  });

  if (wantApiKey) {
    const apiKey = await input({
      message: 'Please enter your ChatGPT API key:',
    });
    console.log('API Key received');

    const envPath = path.resolve(process.cwd(), '.env');
    await fs.appendFile(envPath, `\nchatGptApiKey=${apiKey}`);
    return apiKey;
  } else {
    return null;
  }
}

async function setup() {
  const profile = await setProfile();
  await getChatGPTApiKey();
  await deploy(profile);
}

function main() {
  program
    .version('0.1.0')
    .description('Helios CLI for managing Helios infrastructure');

  program
    .command('deploy')
    .description('Deploy Helios infrastructure')
    .action(() => {
      heliosArt();
      setup();
    });

  program
    .command('destroy')
    .description('Destroy Helios infrastructure')
    .action(async () => {
      const profile = await setProfile();
      await destroy(profile);
    });

  program
    .command('setup')
    .description('Set up Helios configuration')
    .action(setup);

  program.parse(process.argv);

  // If no arguments, run setup
  if (!process.argv.slice(2).length) {
    setup();
  }
}

module.exports = { main };