const { promisify } = require('util');
const baseExec = require('child_process').exec;
const exec = promisify(baseExec);
const { spawn } = require('child_process');
const ora = require ('ora');



async function runDeploy(profile) {
  const spinner = ora('Initializing deployment...').start();

  // Spawn the CDK deploy process
  // const deployProcess = spawn('cdk', ['deploy', '--profile', profile, 'VpcStack', '--require-approval', 'never'], { stdio: ['pipe', 'pipe', 'pipe'] });
  const deployProcess = spawn('sh', ['setup.sh', profile], { stdio: ['pipe', 'pipe', 'pipe'] });

  // Handle stdout
  deployProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(output); // Print stdout data

    // if (output.includes('Enter the IAM profile name:')) {
    //   deployProcess.stdin.write(`${profile}\n`); // Respond to the prompt
    // }
  });
  

  // Handle stderr
  deployProcess.stderr.on('data', (data) => {
    console.error(data.toString()); // Print stderr data
  });

  deployProcess.on('close', (code) => {
    if (code === 0) {
      spinner.succeed('CDK deployment complete');
    } else {
      spinner.fail('CDK deployment failed');
    }
  });

  deployProcess.on('error', (err) => {
    spinner.fail('Error occurred during CDK deployment');
    console.error(err.message);
  });
}

// async function runDeploy(profile) {
//   try {
//     const spinner = ora('Initializing deployment...').start();
//     // await exec(`cdk deploy --profile ${profile} VpcStack --require-approval never`);
//     await exec(`sh setup.sh`);

//     // console.log('CDK initialised');
//     spinner.succeed('CDK initialization complete').stop()
//   } catch (e) {
//     console.log('CDK unable to initialise');
//     console.log(e); 
//   }
// }

exports.runDeploy = runDeploy;