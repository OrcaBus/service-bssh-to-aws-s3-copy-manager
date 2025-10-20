// Standard cdk imports
import * as cdk from 'aws-cdk-lib';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

// Application imports
import { StatelessApplicationStackConfig } from './interfaces';
import { buildAllLambdaFunctions, buildBsshToolsLayer } from './lambdas';
import { buildAllStepFunctions } from './step-functions';
import { buildAllEventRules } from './event-rules';
import { buildAllEventBridgeTargets } from './event-targets';
import { NagSuppressions } from 'cdk-nag';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

export type StatelessApplicationStackProps = StatelessApplicationStackConfig & cdk.StackProps;

// Stateless Application Stack
export class StatelessApplicationStack extends cdk.Stack {
  public readonly stageName: StageName;

  constructor(scope: Construct, id: string, props: StatelessApplicationStackProps) {
    super(scope, id, props);
    // Set the stage name
    this.stageName = props.stageName;

    // Get the event bus
    const eventBus = events.EventBus.fromEventBusName(this, 'eventBus', props.eventBusName);

    // Build BSSH Tools Layer
    const bsshToolsLayer = buildBsshToolsLayer(this);

    // Build Lambdas
    const lambdas = buildAllLambdaFunctions(this, {
      bsshToolsLayer: bsshToolsLayer,
      ...props,
    });

    // Build Step Functions
    const stepFunctionObjects = buildAllStepFunctions(this, {
      lambdas: lambdas,
      eventBus: eventBus,
      isNewWorkflowManagerDeployed: props.isNewWorkflowManagerDeployed,
    });

    // Build Event Rules
    const eventBridgeRuleObjects = buildAllEventRules(this, {
      eventBus: eventBus,
    });

    // Build Event Targets
    buildAllEventBridgeTargets({
      eventBridgeRuleObjects: eventBridgeRuleObjects,
      stepFunctionObjects: stepFunctionObjects,
    });

    // Add in stack-level suppressions
    NagSuppressions.addStackSuppressions(this, [
      {
        id: 'AwsSolutions-IAM4',
        reason: 'We need to add this for the lambdas to work',
      },
      {
        id: 'AwsSolutions-SF1',
        reason: "We don't need to log all step function events to cloudwatch",
      },
      {
        id: 'AwsSolutions-SF2',
        reason: "We don't need X-Ray tracing for this stack",
      },
    ]);
  }

  /**
   * Build the BSSH Tools Layer
   */
}
