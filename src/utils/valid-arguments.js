function outputValidArguments() {
  console.log('Usage: helios <subcommand> \n');
  console.log('Please see available subcommands below. \n');
  console.log('deploy     Initialise Helios. This will setup a Helios and its infrastructure');
  console.log('destroy    Will destroy all infrastructure');
}

exports.outputValidArguments = outputValidArguments;