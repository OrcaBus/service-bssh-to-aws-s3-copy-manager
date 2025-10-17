import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DeploymentStackPipeline } from '@orcabus/platform-cdk-constructs/deployment-stack-pipeline';
import { getStatefulStackProps } from '../stage/config';
import { REPO_NAME } from './constants';
import { StatefulApplicationStack } from '../stage/stateful-application-stack';

export class StatefulDeployStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    new DeploymentStackPipeline(this, 'BSSHStatefulPipeline', {
      githubBranch: 'main',
      githubRepo: REPO_NAME,
      stack: StatefulApplicationStack,
      stackName: 'BSSHToAWSS3CopyStatefulDeployStack',
      stackConfig: {
        beta: getStatefulStackProps('BETA'),
        gamma: getStatefulStackProps('GAMMA'),
        prod: getStatefulStackProps('PROD'),
      },
      pipelineName: 'OrcaBus-BsshToAwsS3CopyStatefulMicroserviceDeploymentPipeline', // pragma: allowlist secret
      cdkSynthCmd: ['pnpm install --frozen-lockfile --ignore-scripts', 'pnpm cdk-stateful synth'],
      enableSlackNotification: false,
    });
  }
}
