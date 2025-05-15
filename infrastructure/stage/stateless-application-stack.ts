// Standard cdk imports
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as secretsManager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

// Application imports
import {
  AddSfnAsEventBridgeTargetProps,
  BuildLambdaProps,
  BuildLambdasProps,
  BuildSfnProps,
  BuildSfnsProps,
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRuleProps,
  EventBridgeRulesProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
  sfnNameList,
  SfnObject,
  SfnRequirementsMapType,
  StatelessApplicationStackConfig,
  WirePermissionsProps,
} from './interfaces';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import path from 'path';

import { PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import { Duration } from 'aws-cdk-lib';
import { LAMBDA_DIR, LAYERS_DIR, STEP_FUNCTIONS_DIR } from './constants';
import { EventField, Rule, RuleTargetInput } from 'aws-cdk-lib/aws-events';

export type StatelessApplicationStackProps = StatelessApplicationStackConfig & cdk.StackProps;

// Stateless Application Stack
export class StatelessApplicationStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StatelessApplicationStackProps) {
    super(scope, id, props);

    // Collect secrets and requirements
    const icav2AccessTokenSecretObj = secretsManager.Secret.fromSecretNameV2(
      this,
      'icav2AccessTokenSecret',
      props.icav2AccessTokenSecretId
    );

    const eventBus = events.EventBus.fromEventBusName(this, 'eventBus', props.eventBusName);

    // Build BSSH Tools Layer
    const bsshToolsLayer = this.buildBSSHToolsLayer();

    // Build Lambdas
    const lambdas = this.buildAllLambdaFunctions({
      bsshToolsLayer: bsshToolsLayer,
      icav2AccessTokenSecretObj: icav2AccessTokenSecretObj,
      awsEnvVars: {
        AWS_S3_CACHE_BUCKET_NAME: props.awsS3CacheBucketName,
        AWS_S3_PRIMARY_DATA_PREFIX: props.awsS3PrimaryDataPrefix,
      },
      bsshWorkflowEnvVars: {
        BSSH_WORKFLOW_NAME: props.bsshWorkflowName,
        BSSH_WORKFLOW_VERSION: props.bsshWorkflowVersion,
      },
    });

    // Build Step Functions
    const stepFunctionObjects = this.buildAllStepFunctions({
      lambdas: lambdas,
      eventBus: eventBus,
      workflowRunStateChangeEventType: props.workflowRunStateChangeDetailType,
      stackEventSource: props.stackEventSource,
      icav2DataCopyDetailType: props.icav2DataCopyDetailType,
    });

    // Build Event Rules
    const eventBridgeRuleObjects = this.buildAllEventRules({
      eventBus: eventBus,
      workflowRunStateChangeDetailType: props.workflowRunStateChangeDetailType,
      workflowManagerEventSource: props.workflowManagerEventSource,
      bclconvertWorkflowName: props.bclconvertWorkflowName,
      bsshFastqCopyWorkflowName: props.bsshWorkflowName,
    });

    // Build Event Targets
    this.buildAllEventBridgeTargets({
      eventBridgeRuleObjects: eventBridgeRuleObjects,
      stepFunctionObjects: stepFunctionObjects,
    });
  }

  /**
   * Build the BSSH Tools Layer
   */
  private buildBSSHToolsLayer(): PythonLayerVersion {
    /*
            Build the bssh tools layer, used by the get manifest lambda function
            // Use getPythonUvDockerImage once we export this as a function from the
            // platform-cdk-constructs repo
        */
    return new PythonLayerVersion(this, 'bssh-lambda-layer', {
      entry: path.join(LAYERS_DIR, 'bssh_manager_tools_layer'),
      compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      bundling: {
        image: lambda.Runtime.PYTHON_3_12.bundlingImage,
        commandHooks: {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          beforeBundling(inputDir: string, outputDir: string): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [
              `pip install ${inputDir} --target ${outputDir}`,
              `find ${outputDir} -name 'pandas' -exec rm -rf {}/tests/ \\;`,
            ];
          },
        },
      },
    });
  }

  /**
   * Lambda functions
   */
  private buildLambdaFunction(props: BuildLambdaProps): LambdaObject {
    const lambdaNameToSnakeCase = this.camelCaseToSnakeCase(props.lambdaName);
    const lambdaRequirementsMap = lambdaToRequirementsMap[props.lambdaName];

    /* Build the lambda function */
    const lambdaFunction = new PythonUvFunction(this, props.lambdaName, {
      entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
      runtime: lambda.Runtime.PYTHON_3_12,
      architecture: lambda.Architecture.ARM_64,
      index: lambdaNameToSnakeCase + '.py',
      handler: 'handler',
      timeout: Duration.seconds(60),
      includeOrcabusApiToolsLayer: lambdaRequirementsMap.needsOrcabusApiToolsLayer,
    });

    /* Do we need the icav2 access token? */
    if (lambdaRequirementsMap.needsIcav2AccessToken) {
      // Add the env var to the lambda function
      lambdaFunction.addEnvironment(
        /* Add the env var to the lambda function */
        'ICAV2_ACCESS_TOKEN_SECRET_ID',
        props.icav2AccessTokenSecretObj.secretName
      );

      // Grant the lambda function read access to the secret
      props.icav2AccessTokenSecretObj.grantRead(lambdaFunction);
    }

    /* Do we need the bssh tools layer? */
    if (lambdaRequirementsMap.needsBsshLambdaLayer) {
      // Add the bssh tools layer to the lambda function
      lambdaFunction.addLayers(props.bsshToolsLayer);
    }

    /* Add AWS env vars */
    if (lambdaRequirementsMap.needsAwsEnvVars) {
      for (const [key, value] of Object.entries(props.awsEnvVars)) {
        lambdaFunction.addEnvironment(key, value);
      }
    }

    /* Add bssh workflow env vars */
    if (lambdaRequirementsMap.needsBsshWorkflowEnvVars) {
      for (const [key, value] of Object.entries(props.bsshWorkflowEnvVars)) {
        lambdaFunction.addEnvironment(key, value);
      }
    }

    /* Return the lambda object */
    return {
      lambdaName: props.lambdaName,
      lambdaFunction: lambdaFunction,
    };
  }

  private buildAllLambdaFunctions(props: BuildLambdasProps): LambdaObject[] {
    // Iterate over lambdaNameList and create the lambda functions
    const lambdaObjects: LambdaObject[] = [];
    for (const lambdaName of lambdaNameList) {
      lambdaObjects.push(
        this.buildLambdaFunction({
          lambdaName: lambdaName,
          ...props,
        })
      );
    }

    // Return the lambda objects
    return lambdaObjects;
  }

  /**
   * Step functions
   */

  private createStateMachineDefinitionSubstitutions(props: BuildSfnProps): {
    [key: string]: string;
  } {
    const definitionSubstitutions: { [key: string]: string } = {};

    /* Substitute lambdas in the state machine definition */
    if (props.lambdas) {
      for (const lambdaObject of props.lambdas) {
        const sfnSubtitutionKey = `__${this.camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
        definitionSubstitutions[sfnSubtitutionKey] =
          lambdaObject.lambdaFunction.currentVersion.functionArn;
      }
    }

    /* Substitute the event bus in the state machine definition */
    if (props.eventBus) {
      definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;
    }

    /* Substitute the event bridge rule name in the state machine definition */
    if (props.icav2DataCopyDetailType) {
      definitionSubstitutions['__icav2_copy_service_detail_type__'] = props.icav2DataCopyDetailType;
    }

    /* Substitute the event detail type in the state machine definition */
    if (props.workflowRunStateChangeEventType) {
      definitionSubstitutions['__workflow_run_state_change_detail_type__'] =
        props.workflowRunStateChangeEventType;
    }

    /* Substitute the event source in the state machine definition */
    if (props.stackEventSource) {
      definitionSubstitutions['__stack_event_source__'] = props.stackEventSource;
    }

    return definitionSubstitutions;
  }

  private wireUpStateMachinePermissions(props: WirePermissionsProps): void {
    /* Wire up lambda permissions */
    const sfnRequirements = SfnRequirementsMapType[props.stateMachineName];

    /* Grant invoke on all lambdas required for this state machine */
    if (sfnRequirements.requiredLambdaNameList) {
      for (const lambdaName of sfnRequirements.requiredLambdaNameList) {
        if (!props.lambdas) {
          throw new Error(
            `Lambdas are not defined for state machine that requires them: ${props.stateMachineName}`
          );
        }
        const lambdaObject = props.lambdas.find((lambda) => lambda.lambdaName === lambdaName);
        lambdaObject?.lambdaFunction.currentVersion.grantInvoke(props.stateMachineObj);
      }
    }

    /* Wire up event bus permissions */
    if (sfnRequirements.needsPutEvents) {
      if (!props.eventBus) {
        throw new Error(
          `Event bus is not defined for state machine that requires it: ${props.stateMachineName}`
        );
      }
      props.eventBus.grantPutEventsTo(props.stateMachineObj);
    }
  }

  private buildStepFunction(props: BuildSfnProps): SfnObject {
    const sfnNameToSnakeCase = this.camelCaseToSnakeCase(props.stateMachineName);

    /* Create the state machine definition substitutions */
    const stateMachine = new sfn.StateMachine(this, props.stateMachineName, {
      stateMachineName: props.stateMachineName,
      definitionBody: sfn.DefinitionBody.fromFile(
        path.join(STEP_FUNCTIONS_DIR, sfnNameToSnakeCase + '_sfn_template.asl.json')
      ),
      definitionSubstitutions: this.createStateMachineDefinitionSubstitutions(props),
    });

    /* Grant the state machine permissions */
    this.wireUpStateMachinePermissions({
      stateMachineObj: stateMachine,
      ...props,
    });

    return {
      stateMachineName: props.stateMachineName,
      stateMachineObj: stateMachine,
    };
  }

  private buildAllStepFunctions(props: BuildSfnsProps): SfnObject[] {
    // Initialise the step function objects
    const sfnObjects: SfnObject[] = [];

    // Iterate over the state machine names and create the step functions
    for (const sfnName of sfnNameList) {
      sfnObjects.push(
        this.buildStepFunction({
          stateMachineName: sfnName,
          ...props,
        })
      );
    }

    // Return the step function objects
    return sfnObjects;
  }

  /**
   * Event Bridge Rules
   */
  private buildWorkflowRunStateChangeEventRule(props: EventBridgeRuleProps): Rule {
    return new events.Rule(this, props.ruleName, {
      ruleName: props.ruleName,
      eventPattern: {
        source: [props.eventSource],
        detailType: [props.eventDetailType],
        detail: {
          payload: {
            destinationUri: [{ exists: true }],
            sourceUriList: [{ exists: true }],
          },
        },
      },
      eventBus: props.eventBus,
    });
  }

  private buildAllEventRules(props: EventBridgeRulesProps): EventBridgeRuleObject[] {
    const eventBridgeRuleObjects: EventBridgeRuleObject[] = [];

    // Iterate over the eventBridgeNameList and create the event rules
    for (const ruleName of eventBridgeNameList) {
      switch (ruleName) {
        case 'listenBclconvertSucceededRule': {
          eventBridgeRuleObjects.push({
            ruleName: ruleName,
            ruleObject: this.buildWorkflowRunStateChangeEventRule({
              ruleName: ruleName,
              eventSource: props.workflowManagerEventSource,
              eventBus: props.eventBus,
              eventDetailType: props.workflowRunStateChangeDetailType,
              eventStatus: 'SUCCEEDED',
              workflowName: props.bclconvertWorkflowName,
            }),
          });
          break;
        }
        case 'listenBsshFastqCopyReadyRule': {
          eventBridgeRuleObjects.push({
            ruleName: ruleName,
            ruleObject: this.buildWorkflowRunStateChangeEventRule({
              ruleName: ruleName,
              eventSource: props.workflowManagerEventSource,
              eventBus: props.eventBus,
              eventDetailType: props.workflowRunStateChangeDetailType,
              eventStatus: 'READY',
              workflowName: props.bsshFastqCopyWorkflowName,
            }),
          });
          break;
        }
      }
    }

    // Return the event bridge rule objects
    return eventBridgeRuleObjects;
  }

  /**
   * Event bridge targets
   */
  private buildBclConvertSucceededToSfnTarget(props: AddSfnAsEventBridgeTargetProps): void {
    props.eventBridgeRuleObj.addTarget(
      new eventsTargets.SfnStateMachine(props.stateMachineObj, {
        input: RuleTargetInput.fromObject({
          instrumentRunId: EventField.fromPath('$.detail.payload.data.instrumentRunId'),
          bsshAnalysisId: EventField.fromPath('$.detail.payload.data.analysisId'),
          bsshProjectId: EventField.fromPath('$.detail.payload.data.projectId'),
        }),
      })
    );
  }

  private buildBsshFastqCopyReadyToSfnTarget(props: AddSfnAsEventBridgeTargetProps): void {
    props.eventBridgeRuleObj.addTarget(
      new eventsTargets.SfnStateMachine(props.stateMachineObj, {
        input: events.RuleTargetInput.fromEventPath('$.detail'),
      })
    );
  }

  private buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
    for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
      switch (eventBridgeTargetsName) {
        case 'bclconvertSucceededToBsshFastqCopyReadySfn': {
          this.buildBclConvertSucceededToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
            eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
              (eventBridgeObject) => eventBridgeObject.ruleName === 'listenBclconvertSucceededRule'
            )?.ruleObject,
            stateMachineObj: props.stepFunctionObjects.find(
              (eventBridgeObject) =>
                eventBridgeObject.stateMachineName === 'bclconvertSucceededToBsshFastqCopyReady'
            )?.stateMachineObj,
          });
          break;
        }
        case 'bsshFastqCopyReadyToBsshFastqCopyServiceSfn': {
          this.buildBsshFastqCopyReadyToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
            eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
              (eventBridgeObject) => eventBridgeObject.ruleName === 'listenBsshFastqCopyReadyRule'
            )?.ruleObject,
            stateMachineObj: props.stepFunctionObjects.find(
              (eventBridgeObject) =>
                eventBridgeObject.stateMachineName === 'runBsshFastqCopyService'
            )?.stateMachineObj,
          });
          break;
        }
      }
    }
  }

  /**
   * Random utils
   */
  private camelCaseToSnakeCase(camelCase: string): string {
    return camelCase.replace(/([A-Z])/g, '_$1').toLowerCase();
  }
}
