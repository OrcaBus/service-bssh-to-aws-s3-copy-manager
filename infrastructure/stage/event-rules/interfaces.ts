import { EventPattern, IEventBus, Rule } from 'aws-cdk-lib/aws-events';

export type EventBridgeNameList =
  // Glue succeeded
  | 'upstreamSucceededEvent'
  // Draft Events
  | 'wrscDraft'
  // Pre-ready
  | 'wrscReady';

export const eventBridgeNameList: EventBridgeNameList[] = [
  // Glue succeeded
  'upstreamSucceededEvent',
  // Draft Events
  'wrscDraft',
  // Pre-ready
  'wrscReady',
];

export interface EventBridgeRuleProps {
  /* Rule name */
  ruleName: string;

  /* Event bus */
  eventBus: IEventBus;

  /* Event Pattern */
  eventPattern: EventPattern;
}

export interface EventBridgeRulesProps {
  /* EventBridge Rules */
  eventBus: IEventBus;
}

export interface EventBridgeRuleObject {
  ruleName: EventBridgeNameList;
  ruleObject: Rule;
}

export type BuildDraftRuleProps = Omit<EventBridgeRuleProps, 'eventPattern'>;
export type BuildReadyRuleProps = Omit<EventBridgeRuleProps, 'eventPattern'>;
