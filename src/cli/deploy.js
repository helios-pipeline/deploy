const { spawn } = require("child_process");
const ora = require("ora");
const chalk = require("chalk");

const steps = [
  { name: "Setup", color: "blue", spinner: "bouncingBar" },
  { name: "CDK Setup", color: "magenta", spinner: "bouncingBar" },
  { name: "IamStack", color: "yellow", spinner: "bouncingBar" },
  { name: "VpcStack", color: "green", spinner: "bouncingBar" },
  { name: "ClickhouseEc2Stack", color: "cyan", spinner: "arrow3" },
  { name: "FlaskEc2Stack", color: "cyan", spinner: "arrow3" },
  { name: "DynamoDbStack", color: "blue", spinner: "arrow3" },
  { name: "LambdaStack", color: "magenta", spinner: "arrow3" },
  { name: "S3Stack", color: "yellow", spinner: "arrow3" },
  // if add more stacks to CDK, add them here
];

async function deploy(profile) {
  let currentSpinner = null;
  let currentStep = null;
  let buffer = "";
  let lastPrintedMessages = {};
  let flaskIpAddress = null;

  const updateSpinner = (stepName, text, isError = false) => {
    let step = steps.find((s) => s.name === stepName);
    if (!step) {
      step = { name: stepName, color: "white", spinner: "bouncingBar" };
      steps.push(step);
    }

    if (currentSpinner && currentStep !== stepName) {
      currentSpinner.stop();
      const cleanedText = currentSpinner.text.replace(/}$/, "").trim();
      if (cleanedText && cleanedText !== lastPrintedMessages[currentStep]) {
        process.stdout.write(
          `\r${chalk.green(`✔ [${currentStep}]`)} ${cleanedText}\n`,
        );
        lastPrintedMessages[currentStep] = cleanedText;
      }
      currentSpinner = null;
    }

    if (!currentSpinner || currentStep !== stepName) {
      currentStep = stepName;
      currentSpinner = ora({
        text: chalk[step.color](text),
        prefixText: chalk.bold[step.color](`[${step.name}]`),
        spinner: step.spinner,
        color: step.color,
      }).start();
    } else {
      currentSpinner.text = chalk[step.color](text);
    }

    if (isError) {
      currentSpinner.fail(chalk.red(text));
      lastPrintedMessages[currentStep] = text;
    }
  };

  const processLine = (line) => {
    if (line.trim()) {
      let handled = false;
      let isError = false;

      line = line.replace(/\s+/g, " ").trim();

      const flaskIpMatch = line.match(
        /FlaskEc2Stack\.FlaskInstancePublicIp\s*=\s*(\d+\.\d+\.\d+\.\d+)/,
      );
      if (flaskIpMatch) {
        flaskIpAddress = flaskIpMatch[1];
        return;
      }

      const updateSpinnerAndHandle = (stepName, text, isComplete = false) => {
        updateSpinner(stepName, isComplete ? `${stepName} deployed` : text);
        return true;
      };

      const cases = {
        "Starting Helios infrastructure setup...": () =>
          updateSpinnerAndHandle("Setup", "Initializing..."),
        "Using profile:": () => updateSpinnerAndHandle("Setup", "Profile set"),
        "Running setup_cdk.sh...": () =>
          updateSpinnerAndHandle("CDK Setup", "Starting CDK setup..."),
        "CDKDeploymentPolicy already exists": () =>
          updateSpinnerAndHandle("CDK Setup", "CDKDeploymentPolicy checked"),
        "Policy is already attached": () =>
          updateSpinnerAndHandle("CDK Setup", "Policy attachment checked"),
        "Installing AWS CDK globally...": () =>
          updateSpinnerAndHandle("CDK Setup", "Installing AWS CDK..."),
        "changed 1 package": () =>
          updateSpinnerAndHandle("CDK Setup", "AWS CDK installed"),
        "Bootstrapping CDK...": () =>
          updateSpinnerAndHandle("CDK Setup", "Bootstrapping CDK..."),
        "Bootstrapping environment": () =>
          updateSpinnerAndHandle("CDK Setup", "Bootstrapping environment..."),
        "Environment aws://": () =>
          updateSpinnerAndHandle("CDK Setup", "Environment bootstrapped"),
        "CDK setup complete!": () =>
          updateSpinnerAndHandle("CDK Setup", "CDK Setup complete"),
        "Assuming deployment role...": () =>
          updateSpinnerAndHandle("Assume Role", "Assuming role..."),
        "Deploying all stacks...": () =>
          updateSpinnerAndHandle("Assume Role", "Role assumed"),
        "Deployment completed successfully!": () => {
          if (currentSpinner) {
            currentSpinner.succeed(
              chalk.green("Deployment completed successfully!"),
            );
          }
          return true;
        },
      };

      const stacks = [
        "IamStack",
        "VpcStack",
        "ClickhouseEc2Stack",
        "FlaskEc2Stack",
        "DynamoDbStack",
        "LambdaStack",
        "S3Stack",
      ];
      stacks.forEach((stack) => {
        cases[`Deploying ${stack}...`] = () =>
          updateSpinnerAndHandle(stack, "Deploying...");
        cases[`✅  ${stack}`] = () =>
          updateSpinnerAndHandle(stack, "Deploying...", true);
      });

      for (const [key, handler] of Object.entries(cases)) {
        if (line.includes(key)) {
          handled = handler();
          break;
        }
      }

      if (!handled) {
        const stackMatch = line.match(/^(\w+Stack)/);
        if (stackMatch) {
          const stackName = stackMatch[1];
          let step = steps.find((s) => s.name === stackName);
          if (!step) {
            step = { name: stackName, color: "white", spinner: "bouncingBar" };
            steps.push(step);
          }
          updateSpinner(stackName, line.replace(stackName, "").trim());
          handled = true;
        } else if (currentSpinner) {
          currentSpinner.text = line;
          handled = true;
        }
      }

      if (!handled) {
        if (currentSpinner) {
          currentSpinner.text = chalk.dim.italic(line);
        } else {
          console.log(chalk.dim.italic(line));
        }
      }

      if (line.toLowerCase().includes("error")) {
        isError = true;
        updateSpinner(currentStep, line, true);
      }
    }
  };

  const handleOutput = (data) => {
    const output = data.toString();
    buffer += output;

    if (output.includes("\n")) {
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      lines.forEach(processLine);
    }
  };

  const deployProcess = spawn("sh", ["./scripts/setup.sh", profile], {
    stdio: ["pipe", "pipe", "pipe"],
    shell: true,
  });

  deployProcess.stdout.on("data", handleOutput);
  deployProcess.stderr.on("data", handleOutput);

  return new Promise((resolve, reject) => {
    deployProcess.on("close", (code) => {
      if (buffer.trim()) {
        processLine(buffer.trim());
      }
      if (currentSpinner) {
        currentSpinner.stop();
      }
      if (code === 0) {
        console.log(
          chalk.bold.green(
            "Helios infrastructure setup completed successfully",
          ),
        );
        if (flaskIpAddress) {
          console.log(
            chalk.bold.blue(
              `You can access your Flask application at: http://${flaskIpAddress}:5000`,
            ),
          );
        }
        resolve();
      } else {
        console.error(chalk.bold.red(`Deployment failed with code ${code}`));
        if (currentSpinner) {
          currentSpinner.fail(chalk.red("Deployment failed"));
        }
        reject(new Error(`Deployment failed with code ${code}`));
      }
    });
  });
}

module.exports = { deploy };
