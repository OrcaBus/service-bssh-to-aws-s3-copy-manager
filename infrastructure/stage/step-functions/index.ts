import {
  BuildSfnProps,
  BuildSfnsProps,
  sfnNameList,
  SfnObject,
  SfnRequirementsMapType,
  WirePermissionsProps,
} from './interfaces';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import path from 'path';
import {
  BSSH_PAYLOAD_VERSION,
  ICAV2_DATA_COPY_DETAIL_TYPE,
  SFN_PREFIX,
  STACK_EVENT_SOURCE,
  STEP_FUNCTIONS_DIR,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
} from '../constants';
import { camelCaseToSnakeCase } from '../utils';
import { Construct } from 'constructs';

function createStateMachineDefinitionSubstitutions(props: BuildSfnProps): {
  [key: string]: string;
} {
  const definitionSubstitutions: { [key: string]: string } = {};

  /* Substitute lambdas in the state machine definition */
  for (const lambdaObject of props.lambdas) {
    const sfnSubtitutionKey = `__${camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
    definitionSubstitutions[sfnSubtitutionKey] =
      lambdaObject.lambdaFunction.currentVersion.functionArn;
  }

  /* Substitute the event bus in the state machine definition */
  if (props.eventBus) {
    definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;
  }

  /* Substitute the event bridge rule name in the state machine definition */
  definitionSubstitutions['__icav2_data_copy_detail_type__'] = ICAV2_DATA_COPY_DETAIL_TYPE;

  /* Substitute the event detail type in the state machine definition */
  definitionSubstitutions['__workflow_run_state_change_detail_type__'] =
    WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE;

  /* Substitute the event source in the state machine definition */
  definitionSubstitutions['__stack_event_source__'] = STACK_EVENT_SOURCE;

  /* Substitute the bssh payload version in the state machine definition */
  definitionSubstitutions['__bssh_payload_version__'] = BSSH_PAYLOAD_VERSION;

  return definitionSubstitutions;
}

function wireUpStateMachinePermissions(props: WirePermissionsProps): void {
  /* Wire up lambda permissions */
  const sfnRequirements = SfnRequirementsMapType[props.stateMachineName];

  /* Grant invoke on all lambdas required for this state machine */
  if (sfnRequirements.requiredLambdaNameList) {
    for (const lambdaName of sfnRequirements.requiredLambdaNameList) {
      const lambdaObject = props.lambdas.find((lambda) => lambda.lambdaName === lambdaName);
      lambdaObject?.lambdaFunction.currentVersion.grantInvoke(props.stateMachineObj);
    }
  }

  /* Wire up event bus permissions */
  if (sfnRequirements.needsPutEvents) {
    props.eventBus.grantPutEventsTo(props.stateMachineObj);
  }
}

function buildStepFunction(scope: Construct, props: BuildSfnProps): SfnObject {
  const sfnNameToSnakeCase = camelCaseToSnakeCase(props.stateMachineName);

  /* Create the state machine definition substitutions */
  const stateMachine = new sfn.StateMachine(scope, props.stateMachineName, {
    stateMachineName: `${SFN_PREFIX}${props.stateMachineName}`,
    definitionBody: sfn.DefinitionBody.fromFile(
      path.join(STEP_FUNCTIONS_DIR, sfnNameToSnakeCase + '_sfn_template.asl.json')
    ),
    definitionSubstitutions: createStateMachineDefinitionSubstitutions(props),
  });

  /* Grant the state machine permissions */
  wireUpStateMachinePermissions({
    stateMachineObj: stateMachine,
    ...props,
  });

  return {
    stateMachineName: props.stateMachineName,
    stateMachineObj: stateMachine,
  };
}

export function buildAllStepFunctions(scope: Construct, props: BuildSfnsProps): SfnObject[] {
  // Initialise the step function objects
  const sfnObjects: SfnObject[] = [];

  // Iterate over the state machine names and create the step functions
  for (const sfnName of sfnNameList) {
    sfnObjects.push(
      buildStepFunction(scope, {
        stateMachineName: sfnName,
        ...props,
      })
    );
  }

  // Return the step function objects
  return sfnObjects;
}
