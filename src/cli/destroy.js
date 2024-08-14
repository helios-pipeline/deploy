const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const ora = require ('ora');

async function destroy(profile) {
  try {
    const spinner = ora('Destroying deployment...').start();
    await exec(`cdk destroy --all --force --profile ${profile}`);
    
    spinner.succeed('CDK destroy complete').stop();

  } catch (e) {
    console.log('CDK unable to destroy');
    console.log(e); 
  }
}

exports.destroy = destroy;