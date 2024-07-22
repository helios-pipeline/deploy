# CLI

## all steps in order:

0. prereq
   - they need an AWS IAM account
   - theyve npm installed the npm package that includes all cdk directories/files (e.g. bin/, lib/, scripts/, package.json, \*.zip)
1. manual - install aws cli
   - https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html
2. CLI interaction -- they give us their profile name (that either already exists or that they plan on us creating for them)
3. manual (potential automate) - if they dont already have an access key...
   create access key and add to `~/.aws/credentials` and `~/.aws/config`
   - `aws iam create-access-key --user-name ${USERNAME}`
   - Potential to automate this process by calling using aws CLI to create access key and then use the output to create a profile with given name
   - if they dont have ability to create an access key, can get it by creating below policy with their root account and attaching to their IAM user
   ```
   {
   "Version": "2012-10-17",
   "Statement": [
       {
           "Effect": "Allow",
           "Action": [
               "iam:CreateAccessKey",
               "iam:DeleteAccessKey",
               "iam:GetAccessKeyLastUsed",
               "iam:ListAccessKeys",
               "iam:UpdateAccessKey"
           ],
           "Resource": "arn:aws:iam::*:user/test-deploy-iam"
       }
   ]
   }
   ```
4. manual - if their IAM user does not have the ability to create and attach policies ...
   from their root account, attach a policy to their IAM user, policies (most likely they already have this ability, but worth noting)

   ```
   {
       "Version": "2012-10-17",
       "Statement": [
           {
               "Effect": "Allow",
               "Action": [
                   "iam:AttachUserPolicy",
                   "iam:DetachUserPolicy",
                   "iam:ListAttachedUserPolicies",
                   "iam:ListUserPolicies",
                   "iam:PutUserPolicy",
                   "iam:DeleteUserPolicy",
                   "iam:GetUserPolicy",
                   "iam:SimulatePrincipalPolicy",
                   "iam:ListPolicies",
                   "iam:GetPolicy",
                   "iam:GetPolicyVersion",
                   "iam:ListPolicyVersions",
                   "iam:CreatePolicy",
                   "iam:DeletePolicy",
                   "iam:CreatePolicyVersion",
                   "iam:DeletePolicyVersion",
                   "iam:SetDefaultPolicyVersion",
                   "iam:GetUser"
               ],
               "Resource": "*"
           }
       ]
   }
   ```

5. CLI runs `export AWS_PROFILE=${profile_name}`
6. CLI runs `chmod +x setup.sh && . ./setup.sh`
