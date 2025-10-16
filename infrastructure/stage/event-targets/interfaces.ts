import { StateMachine } from 'aws-cdk-lib/aws-stepfunctions';
import { Rule } from 'aws-cdk-lib/aws-events';
import { EventBridgeRuleObject } from '../event-rules/interfaces';
import { SfnObject } from '../step-functions/interfaces';

/**
 * EventBridge Target Interfaces
 */
export type EventBridgeTargetName =
  // Upstream Succeeded
  | 'upstreamSucceededEventLegacyToGlueSucceededEvents'
  | 'upstreamSucceededEventToGlueSucceededEvents'
  // Populate draft data event targets
  | 'draftLegacyToPopulateDraftDataSfnTarget'
  | 'draftToPopulateDraftDataSfnTarget'
  // Validate draft to ready
  | 'draftLegacyToValidateDraftSfnTarget'
  | 'draftToValidateDraftSfnTarget'
  // Ready to ICAv2 WES Submitted
  | 'readyLegacyToBsshRunSfnTarget'
  | 'readyToBsshRunSfnTarget';

export const eventBridgeTargetsNameList: EventBridgeTargetName[] = [
  // Upstream Succeeded
  'upstreamSucceededEventLegacyToGlueSucceededEvents',
  'upstreamSucceededEventToGlueSucceededEvents',
  // Populate draft data event targets
  'draftLegacyToPopulateDraftDataSfnTarget',
  'draftToPopulateDraftDataSfnTarget',
  // Validate draft to ready
  'draftLegacyToValidateDraftSfnTarget',
  'draftToValidateDraftSfnTarget',
  // Ready to ICAv2 WES Submitted
  'readyLegacyToBsshRunSfnTarget',
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
