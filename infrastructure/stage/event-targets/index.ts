import {
  AddSfnAsEventBridgeTargetProps,
  eventBridgeTargetsNameList,
  EventBridgeTargetsProps,
} from './interfaces';
import * as eventsTargets from 'aws-cdk-lib/aws-events-targets';
import { EventField, RuleTargetInput } from 'aws-cdk-lib/aws-events';
import * as events from 'aws-cdk-lib/aws-events';

function buildBclConvertSucceededToSfnTarget(props: AddSfnAsEventBridgeTargetProps): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: RuleTargetInput.fromObject({
        instrumentRunId: EventField.fromPath('$.detail.payload.data.instrumentRunId'),
        bsshAnalysisId: EventField.fromPath('$.detail.payload.data.analysisId'),
        bsshProjectId: EventField.fromPath('$.detail.payload.data.projectId'),
      }),
    })
  );
}

function buildBsshFastqCopyReadyToSfnTarget(props: AddSfnAsEventBridgeTargetProps): void {
  props.eventBridgeRuleObj.addTarget(
    new eventsTargets.SfnStateMachine(props.stateMachineObj, {
      input: events.RuleTargetInput.fromEventPath('$.detail'),
    })
  );
}

export function buildAllEventBridgeTargets(props: EventBridgeTargetsProps) {
  for (const eventBridgeTargetsName of eventBridgeTargetsNameList) {
    switch (eventBridgeTargetsName) {
      case 'bclconvertSucceededToBsshFastqCopyReadySfn': {
        buildBclConvertSucceededToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenBclconvertSucceededRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) =>
              eventBridgeObject.stateMachineName === 'bclconvertSucceededToBsshFastqCopyReady'
          )?.stateMachineObj,
        });
        break;
      }
      case 'bsshFastqCopyReadyToBsshFastqCopyServiceSfn': {
        buildBsshFastqCopyReadyToSfnTarget(<AddSfnAsEventBridgeTargetProps>{
          eventBridgeRuleObj: props.eventBridgeRuleObjects.find(
            (eventBridgeObject) => eventBridgeObject.ruleName === 'listenBsshFastqCopyReadyRule'
          )?.ruleObject,
          stateMachineObj: props.stepFunctionObjects.find(
            (eventBridgeObject) => eventBridgeObject.stateMachineName === 'runBsshFastqCopyService'
          )?.stateMachineObj,
        });
        break;
      }
    }
  }
}
