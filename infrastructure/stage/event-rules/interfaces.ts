import { IEventBus, Rule } from 'aws-cdk-lib/aws-events';

export type EventBridgeNameList = 'listenBclconvertSucceededRule' | 'listenBsshFastqCopyReadyRule';

export const eventBridgeNameList: EventBridgeNameList[] = [
  /* Listen to bclconvert workflow status changes */
  'listenBclconvertSucceededRule',
  /* Listen to bssh Fastq Copy Ready rule */
  'listenBsshFastqCopyReadyRule',
];

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
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}
