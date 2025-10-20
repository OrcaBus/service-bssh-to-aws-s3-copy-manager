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

export interface SfnProps {
  /* Naming formation */
  stateMachineName: SfnName;
}

export interface SfnObject extends SfnProps {
  /* The state machine object */
  stateMachineObj: StateMachine;
}

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

export interface BuildSfnProps extends SfnProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;

  /* New workflow manager deployed */
  isNewWorkflowManagerDeployed: boolean;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;

  /* New workflow manager deployed */
  isNewWorkflowManagerDeployed: boolean;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}
