import {
  BuildSfnProps,
  BuildSfnsProps,
  sfnNameList,
  SfnObject,
  SfnRequirementsMapType,
  stepFunctionToLambdasMap,
  WirePermissionsProps,
} from './interfaces';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import path from 'path';
import {
  PAYLOAD_VERSION,
  ICAV2_DATA_COPY_DETAIL_TYPE,
  STACK_PREFIX,
  STACK_SOURCE,
  STEP_FUNCTIONS_DIR,
  WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE,
  WORKFLOW_RUN_UPDATE_DETAIL_TYPE,
  READY_STATUS,
} from '../constants';
import { camelCaseToSnakeCase } from '../utils';
import { Construct } from 'constructs';

function createStateMachineDefinitionSubstitutions(props: BuildSfnProps): {
  [key: string]: string;
} {
  const definitionSubstitutions: { [key: string]: string } = {};
  // Get lambda functions
  const lambdaFunctionNamesInSfn = stepFunctionToLambdasMap[props.stateMachineName];
  const lambdaFunctions = props.lambdas.filter((lambdaObject) =>
    lambdaFunctionNamesInSfn.includes(lambdaObject.lambdaName)
  );

  /* Substitute lambdas in the state machine definition */
  for (const lambdaObject of lambdaFunctions) {
    const sfnSubtitutionKey = `__${camelCaseToSnakeCase(lambdaObject.lambdaName)}_lambda_function_arn__`;
    definitionSubstitutions[sfnSubtitutionKey] =
      lambdaObject.lambdaFunction.currentVersion.functionArn;
  }

  /* General substitutions */
  definitionSubstitutions['__ready_event_status__'] = READY_STATUS;

  /* Substitute the event bus in the state machine definition */
  if (props.eventBus) {
    definitionSubstitutions['__event_bus_name__'] = props.eventBus.eventBusName;

    /* Substitute the event detail type in the state machine definition */
    definitionSubstitutions['__workflow_run_state_change_event_detail_type__'] =
      WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE;
    definitionSubstitutions['__workflow_run_update_detail_type__'] =
      WORKFLOW_RUN_UPDATE_DETAIL_TYPE;
    /* Substitute the event bridge rule name in the state machine definition */
    definitionSubstitutions['__icav2_data_copy_detail_type__'] = ICAV2_DATA_COPY_DETAIL_TYPE;

    /* Substitute the event source in the state machine definition */
    definitionSubstitutions['__stack_source__'] = STACK_SOURCE;
  }

  /* Substitute the bssh payload version in the state machine definition */
  definitionSubstitutions['__bssh_payload_version__'] = PAYLOAD_VERSION;

  return definitionSubstitutions;
}

function wireUpStateMachinePermissions(props: WirePermissionsProps): void {
  /* Wire up lambda permissions */
  const sfnRequirements = SfnRequirementsMapType[props.stateMachineName];

  // Get lambda functions
  const lambdaFunctionNamesInSfn = stepFunctionToLambdasMap[props.stateMachineName];
  const lambdaFunctions = props.lambdas.filter((lambdaObject) =>
    lambdaFunctionNamesInSfn.includes(lambdaObject.lambdaName)
  );
  for (const lambdaObject of lambdaFunctions) {
    lambdaObject.lambdaFunction.currentVersion.grantInvoke(props.stateMachineObj);
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
    stateMachineName: `${STACK_PREFIX}${props.stateMachineName}`,
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
