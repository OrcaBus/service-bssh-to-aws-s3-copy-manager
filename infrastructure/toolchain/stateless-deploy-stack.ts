import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentStackPipeline } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { getStatelessStackProps } from '../stage/config';
import { REPO_NAME } from './constants';
import { StatelessApplicationStack } from '../stage/stateless-application-stack';

export class StatelessDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentStackPipeline(this, 'BSSHStatelessPipeline', {
      githubBranch: 'main',
      githubRepo: REPO_NAME,
      stack: StatelessApplicationStack,
      stackName: 'BSSHToAWSS3CopyStatelessDeployStack',
      stackConfig: {
        beta: getStatelessStackProps('BETA'),
        gamma: getStatelessStackProps('GAMMA'),
        prod: getStatelessStackProps('PROD'),
      },
      pipelineName: 'OrcaBus-BsshToAwsS3CopyStatelessMicroserviceDeploymentPipeline',
      cdkSynthCmd: ['pnpm install --frozen-lockfile --ignore-scripts', 'pnpm cdk-stateless synth'],
      enableSlackNotification: false,
    });
  }
}
