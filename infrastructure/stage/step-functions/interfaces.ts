import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { LambdaName, LambdaObject } from '../lambdas/interfaces';

export type SfnName =
  // Draft
  | 'handleBclconvertSucceeded'
  // Validation
  | 'validateDraftToReady'
  // Running
  | 'runBsshFastqCopyService';

export const sfnNameList: Array<SfnName> = [
  // Draft
  'handleBclconvertSucceeded',
  // Validation
  'validateDraftToReady',
  // Running
  'runBsshFastqCopyService',
];

export const stepFunctionToLambdasMap: Record<SfnName, LambdaName[]> = {
  // Draft
  handleBclconvertSucceeded: ['createNewWorkflowRunObject'],
  // Validation
  validateDraftToReady: ['validateDraftDataCompleteSchema'],
  // Running
  runBsshFastqCopyService: [
    // RUNNING
    'getWorkflowRunObject',
    'getIcav2CopyJobList',
    // POST COPY
    'runFilemanagerSync',
    'addPortalRunIdAttributes',
    'filemanagerSyncCheck',
  ],
};

export interface SfnRequirementsProps {
  /* Event stuff */
  needsPutEvents?: boolean;
}

export const SfnRequirementsMapType: { [key in SfnName]: SfnRequirementsProps } = {
  // Draft
  handleBclconvertSucceeded: {
    needsPutEvents: true,
  },
  validateDraftToReady: {
    needsPutEvents: true,
  },
  runBsshFastqCopyService: {
    needsPutEvents: true,
  },
};

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;

  /* New workflow manager deployed */
  isNewWorkflowManagerDeployed: boolean;
}

export interface BuildSfnProps extends BuildSfnsProps {
  /* State Machine Name */
  stateMachineName: SfnName;
}

export interface SfnObject {
  /* State Machine Name */
  stateMachineName: SfnName;
  /* State Machine Object */
  stateMachineObj: StateMachine;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}
