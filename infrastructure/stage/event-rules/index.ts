import {
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRuleProps,
  EventBridgeRulesProps,
} from './interfaces';
import { Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  BCLCONVERT_WORKFLOW_NAME,
  BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE,
  BSSH_WORKFLOW_NAME,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
} from '../constants';

function buildWorkflowRunStateChangeEventRule(scope: Construct, props: EventBridgeRuleProps): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: props.ruleName,
    eventPattern: {
      source: [props.eventSource],
      detailType: [props.eventDetailType],
      detail: {
        status: [{ 'equals-ignore-case': props.eventStatus }],
        workflowName: [{ 'equals-ignore-case': props.workflowName }],
      },
    },
    eventBus: props.eventBus,
  });
}

export function buildAllEventRules(
  scope: Construct,
  props: EventBridgeRulesProps
): EventBridgeRuleObject[] {
  const eventBridgeRuleObjects: EventBridgeRuleObject[] = [];

  // Iterate over the eventBridgeNameList and create the event rules
  for (const ruleName of eventBridgeNameList) {
    switch (ruleName) {
      case 'listenBclconvertSucceededRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: WORKFLOW_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
            eventStatus: BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE,
            workflowName: BCLCONVERT_WORKFLOW_NAME,
          }),
        });
        break;
      }
      case 'listenBsshFastqCopyReadyRule': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeEventRule(scope, {
            ruleName: ruleName,
            eventSource: WORKFLOW_MANAGER_EVENT_SOURCE,
            eventBus: props.eventBus,
            eventDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
            eventStatus: 'READY',
            workflowName: BSSH_WORKFLOW_NAME,
          }),
        });
        break;
      }
    }
  }

  // Return the event bridge rule objects
  return eventBridgeRuleObjects;
}
