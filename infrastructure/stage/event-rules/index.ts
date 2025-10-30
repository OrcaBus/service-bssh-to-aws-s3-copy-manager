import {
  BuildDraftRuleProps,
  BuildReadyRuleProps,
  eventBridgeNameList,
  EventBridgeRuleObject,
  EventBridgeRuleProps,
  EventBridgeRulesProps,
} from './interfaces';
import { EventPattern, Rule } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';
import {
  BCLCONVERT_WORKFLOW_NAME,
  WORKFLOW_NAME,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE,
  SUCCEEDED_STATUS,
  DRAFT_STATUS,
  READY_STATUS,
  STACK_PREFIX,
} from '../constants';

function buildUpstreamWorkflowRunStateChangeSucceededEventPattern(): EventPattern {
  return {
    detailType: [WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE],
    source: [WORKFLOW_MANAGER_EVENT_SOURCE],
    detail: {
      workflow: {
        name: [{ 'equals-ignore-case': BCLCONVERT_WORKFLOW_NAME }],
      },
      status: [SUCCEEDED_STATUS],
    },
  };
}

function buildWorkflowManagerDraftEventPattern(): EventPattern {
  return {
    detailType: [WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE],
    source: [WORKFLOW_MANAGER_EVENT_SOURCE],
    detail: {
      workflow: {
        name: [WORKFLOW_NAME],
      },
      status: [DRAFT_STATUS],
    },
  };
}

function buildWorkflowManagerReadyEventPattern(): EventPattern {
  return {
    detailType: [WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE],
    source: [WORKFLOW_MANAGER_EVENT_SOURCE],
    detail: {
      workflow: {
        name: [WORKFLOW_NAME],
      },
      status: [READY_STATUS],
    },
  };
}

function buildEventRule(scope: Construct, props: EventBridgeRuleProps): Rule {
  return new events.Rule(scope, props.ruleName, {
    ruleName: `${STACK_PREFIX}-${props.ruleName}`,
    eventPattern: props.eventPattern,
    eventBus: props.eventBus,
  });
}

function buildUpstreamWorkflowRunStateChangeSucceededEventRule(
  scope: Construct,
  props: BuildDraftRuleProps
): Rule {
  return buildEventRule(scope, {
    ruleName: props.ruleName,
    eventPattern: buildUpstreamWorkflowRunStateChangeSucceededEventPattern(),
    eventBus: props.eventBus,
  });
}

function buildWorkflowRunStateChangeDraftEventRule(
  scope: Construct,
  props: BuildDraftRuleProps
): Rule {
  return buildEventRule(scope, {
    ruleName: props.ruleName,
    eventPattern: buildWorkflowManagerDraftEventPattern(),
    eventBus: props.eventBus,
  });
}

function buildWorkflowRunStateChangeReadyEventRule(
  scope: Construct,
  props: BuildReadyRuleProps
): Rule {
  return buildEventRule(scope, {
    ruleName: props.ruleName,
    eventPattern: buildWorkflowManagerReadyEventPattern(),
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
      // Upstream succeeded events
      case 'upstreamSucceededEvent': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildUpstreamWorkflowRunStateChangeSucceededEventRule(scope, {
            ruleName: ruleName,
            eventBus: props.eventBus,
          }),
        });
        break;
      }
      // Populate Draft Data events
      case 'wrscDraft': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeDraftEventRule(scope, {
            ruleName: ruleName,
            eventBus: props.eventBus,
          }),
        });
        break;
      }
      // Ready
      case 'wrscReady': {
        eventBridgeRuleObjects.push({
          ruleName: ruleName,
          ruleObject: buildWorkflowRunStateChangeReadyEventRule(scope, {
            ruleName: ruleName,
            eventBus: props.eventBus,
          }),
        });
        break;
      }
    }
  }

  // Return the event bridge rule objects
  return eventBridgeRuleObjects;
}
