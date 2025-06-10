import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { IEventBus } from 'aws-cdk-lib/aws-events';
import { LambdaNameList, LambdaObject } from '../lambdas/interfaces';

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
  'filemanagerSync',
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
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
}

export interface BuildSfnsProps {
  /* Lambdas */
  lambdas: LambdaObject[];

  /* Event Stuff */
  eventBus: IEventBus;
}

export interface WirePermissionsProps extends BuildSfnProps {
  stateMachineObj: StateMachine;
}
