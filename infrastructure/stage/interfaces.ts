/**
Interfaces for the bssh to aws s3 application
*/

import * as cdk from 'aws-cdk-lib';
import { ISecret } from 'aws-cdk-lib/aws-secretsmanager';
import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';

/** Application Interfaces **/

export interface StatelessApplicationStackConfig extends cdk.StackProps {
  /* ICAv2 access token secret name */
  icav2AccessTokenSecretId: string;

  /* Event stuff */
  eventBusName: string;
  workflowRunStateChangeDetailType: string;
  workflowManagerEventSource: string;

  /* Triggers */
  bclconvertWorkflowRuleStatusValue: string;
  bclconvertWorkflowName: string;

  /* Event Output */
  bsshWorkflowName: string;
  bsshWorkflowVersion: string;

  /* Stack event stuff */
  icav2DataCopyDetailType: string;
  stackEventSource: string;

  /* S3 Stuff */
  awsS3CacheBucketName: string;
  awsS3PrimaryDataPrefix: string;
}

/** Lambda Interfaces **/
export type LambdaNameList =
  | 'addEngineParameters'
  | 'addPortalRunIdAndWorkflowRunName'
  | 'addTags'
  | 'getLibraryObjectsFromSamplesheet'
  | 'getManifestAndFastqListRows';

export const lambdaNameList: Array<LambdaNameList> = [
  'addEngineParameters',
  'addPortalRunIdAndWorkflowRunName',
  'addTags',
  'getLibraryObjectsFromSamplesheet',
  'getManifestAndFastqListRows',
];

export interface AwsEnvVars {
  AWS_S3_CACHE_BUCKET_NAME: string;
  AWS_S3_PRIMARY_DATA_PREFIX: string;
}

export interface BsshWorkflowEnvVars {
  BSSH_WORKFLOW_NAME: string;
  BSSH_WORKFLOW_VERSION: string;
}

export interface LambdaRequirementProps {
  /* Does the lambda needs a token */
  needsIcav2AccessToken?: boolean;

  /* Does the lambda needs the bssh lambda layer */
  needsBsshLambdaLayer?: boolean;

  /* Needs orcabus api tools layer */
  needsOrcabusApiToolsLayer?: boolean;

  /* Needs AWS Env vars */
  needsAwsEnvVars?: boolean;

  /* Needs BSSH Workflow env vars */
  needsBsshWorkflowEnvVars?: boolean;
}

export interface BuildLambdasProps {
  /* Optional requirements */
  /* Custom Layers */
  bsshToolsLayer: PythonLayerVersion;

  /* Secrets */
  icav2AccessTokenSecretObj: ISecret;

  /* Specific env vars */
  awsEnvVars: AwsEnvVars;
  bsshWorkflowEnvVars: BsshWorkflowEnvVars;
}

export interface BuildLambdaProps extends BuildLambdasProps {
  /* Naming formation */
  lambdaName: LambdaNameList;
}

export interface LambdaObject {
  /* Naming formation */
  lambdaName: LambdaNameList;
  /* Lambda function object */
  lambdaFunction: PythonFunction;
}

export type LambdaToRequirementsMapType = { [key in LambdaNameList]: LambdaRequirementProps };

export const lambdaToRequirementsMap: LambdaToRequirementsMapType = {
  addEngineParameters: {
    needsAwsEnvVars: true,
  },
  addPortalRunIdAndWorkflowRunName: {
    needsBsshWorkflowEnvVars: true,
  },
  addTags: {},
  getLibraryObjectsFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  getManifestAndFastqListRows: {
    needsBsshLambdaLayer: true,
  },
};

/* Step Function interfaces */
export type SfnNameList = 'bclconvertSucceededToBsshFastqCopyReady' | 'runBsshFastqCopyService';

export const sfnNameList: Array<SfnNameList> = [
  'bclconvertSucceededToBsshFastqCopyReady',
  'runBsshFastqCopyService',
];

export interface SfnProps {
  /* Naming formation */
  stateMachineName: SfnNameList;
}

export interface SfnObject extends SfnProps {
  /* The state machine object */
  stateMachineObj: StateMachine;
}

export const bclconvertSucceededToBsshFastqCopyReadyLambdaList: Array<LambdaNameList> = [
  'addEngineParameters',
  'addPortalRunIdAndWorkflowRunName',
  'addTags',
  'getLibraryObjectsFromSamplesheet',
];

export const runBsshFastqCopyServiceLambdaList: Array<LambdaNameList> = [
  'getManifestAndFastqListRows',
];

export interface SfnRequirementsProps {
  /* Lambdas */
  requiredLambdaNameList?: LambdaNameList[];

  /* Event stuff */
  needsPutEvents?: boolean;
}

export const SfnRequirementsMapType: { [key in SfnNameList]: SfnRequirementsProps } = {
  // Handle copy jobs
  bclconvertSucceededToBsshFastqCopyReady: {
    /* Lambdas */
    requiredLambdaNameList: bclconvertSucceededToBsshFastqCopyReadyLambdaList,

    /* Event stuff */
    needsPutEvents: true,
  },
  // Save job and internal task token
  runBsshFastqCopyService: {
    /* Lambdas */
    requiredLambdaNameList: runBsshFastqCopyServiceLambdaList,

    /* Event stuff */
    needsPutEvents: true,
  },
};

export interface BuildSfnProps extends SfnProps {
  /* Lambdas */
  lambdas?: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
  icav2DataCopyDetailType: string;
  workflowRunStateChangeEventType: string;
  stackEventSource: string;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas?: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
  icav2DataCopyDetailType: string;
  workflowRunStateChangeEventType: string;
  stackEventSource: string;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}

export type EventBridgeNameList = 'listenBclconvertSucceededRule' | 'listenBsshFastqCopyReadyRule';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to bclconvert workflow status changes */
  'listenBclconvertSucceededRule',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopyReadyRule',
];

/* EventBridge Interfaces */
export interface EventBridgeRuleProps {
  /* Rule name */
  ruleName: string;

  /* Event bus */
  eventBus: IEventBus;

  /* Event Detail Type */
  eventDetailType: string;
  eventSource: string;

  /* Event Status */
  eventStatus: string;

  /* We also require the workflow name for both rules */
  workflowName: string;
}

export interface EventBridgeRulesProps {
  /* EventBridge Rules */
  eventBus: IEventBus;

  /* Workflow Manager Events */
  workflowRunStateChangeDetailType: string;
  workflowManagerEventSource: string;

  /* Workflow names */
  bclconvertWorkflowName: string;
  bsshFastqCopyWorkflowName: string;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}

export type EventBridgeTargetsNameList =
  | 'bclconvertSucceededToBsshFastqCopyReadySfn'
  | 'bsshFastqCopyReadyToBsshFastqCopyServiceSfn';

export const eventBridgeTargetsNameList: Array<EventBridgeTargetsNameList> = [
  'bclconvertSucceededToBsshFastqCopyReadySfn',
  'bsshFastqCopyReadyToBsshFastqCopyServiceSfn',
];

export interface AddSfnAsEventBridgeTargetProps {
  stateMachineObj: StateMachine;
  eventBridgeRuleObj: Rule;
}

export interface EventBridgeTargetsProps {
  eventBridgeRuleObjects: EventBridgeRuleObject[];
  stepFunctionObjects: SfnObject[];
}
