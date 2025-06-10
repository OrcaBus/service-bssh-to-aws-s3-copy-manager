import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

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
