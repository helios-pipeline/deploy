const { input } = require('@inquirer/prompts');


async function setProfile() {
  const answer = await input({message: 'Enter your AWS Profile name:'});
  return answer;
}

exports.setProfile = setProfile;