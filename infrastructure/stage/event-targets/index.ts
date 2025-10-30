import {
  AddSfnAsEventBridgeTargetProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
} from './interfaces';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import * as events from 'aws-cdk-lib/aws-events';

export function buildWrscToSfnTarget(props: AddSfnAsEventBridgeTargetProps) {
  // We take in the event detail from the sash ready event
  // And return the entire detail to the state machine
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: events.RuleTargetInput.fromEventPath('$.detail'),
    })
  );
}

export function buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
  for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
    switch (eventBridgeTargetsName) {
      // BCLConvert Succeeded to Glue
      case 'upstreamSucceededEventToGlueSucceededEvents': {
        buildWrscToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'upstreamSucceededEvent'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'handleBclconvertSucceeded'
          )?.stateMachineObj,
        });
        break;
      }

      // Validate draft data
      case 'draftToValidateDraftSfnTarget': {
        buildWrscToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'wrscDraft'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'validateDraftToReady'
          )?.stateMachineObj,
        });
        break;
      }

      // Ready to Icav2 Wes Submitted
      case 'readyToBsshRunSfnTarget': {
        buildWrscToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'wrscReady'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (sfnObject) => sfnObject.stateMachineName === 'runBsshFastqCopyService'
          )?.stateMachineObj,
        });
        break;
      }
    }
  }
}
