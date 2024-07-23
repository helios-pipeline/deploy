const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const ora = require ('ora');

// import { promisify } from 'util';
// import { exec as baseExec } from 'child_process';

// const exec = promisify(baseExec);
// import ora from 'ora';


async function runDestroy(profile) {
  try {
    const spinner = ora('Destroying deployment...').start();
    await exec(`cdk destroy --all --force --profile ${profile}`);
    
    // console.log('CDK destroyed');
    spinner.succeed('CDK destroy complete').stop();

  } catch (e) {
    console.log('CDK unable to destroy');
    // process.fail('CDK unable to initialise');
    console.log(e); 
  }
}

exports.runDestroy = runDestroy;