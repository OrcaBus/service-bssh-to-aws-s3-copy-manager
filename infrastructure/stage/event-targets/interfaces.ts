import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

/**
 * EventBridge Target Interfaces
 */
export type EventBridgeTargetName =
  // Upstream Succeeded
  | 'upstreamSucceededEventToGlueSucceededEvents'
  // Populate draft data event targets
  | 'draftToPopulateDraftDataSfnTarget'
  // Validate draft to ready
  | 'draftToValidateDraftSfnTarget'
  // Ready to BSSH Run
  | 'readyToBsshRunSfnTarget';

export const eventBridgeTargetsNameList: EventBridgeTargetName[] = [
  // Upstream Succeeded
  'upstreamSucceededEventToGlueSucceededEvents',
  // Populate draft data event targets
  'draftToPopulateDraftDataSfnTarget',
  // Validate draft to ready
  'draftToValidateDraftSfnTarget',
  // Ready to ICAv2 WES Submitted
  'readyToBsshRunSfnTarget',
];

export interface AddSfnAsEventBridgeTargetProps {
  stateMachineObj: StateMachine;
  eventBridgeRuleObj: Rule;
}

export interface EventBridgeTargetsProps {
  eventBridgeRuleObjects: EventBridgeRuleObject[];
  stepFunctionObjects: SfnObject[];
}
