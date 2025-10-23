import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

import {
  EVENT_BUS_NAME,
  NEW_WORKFLOW_MANAGER_IS_DEPLOYED,
  PAYLOAD_VERSION,
  SSM_PARAMETER_PATH_DEFAULT_WORKFLOW_VERSION,
  SSM_PARAMETER_PATH_OUTPUT_PREFIX,
  SSM_PARAMETER_PATH_PAYLOAD_VERSION,
  SSM_PARAMETER_PATH_PREFIX,
  SSM_PARAMETER_PATH_WORKFLOW_NAME,
  WORKFLOW_NAME,
  WORKFLOW_OUTPUT_PREFIX,
  WORKFLOW_VERSION,
} from './constants';
import { StatefulApplicationStackConfig, StatelessApplicationStackConfig } from './interfaces';
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';
import { substituteBucketConstants } from './utils';

export const getSsmParameterValues = (stage: StageName): SsmParameterValues => {
  return {
    // Values
    workflowName: WORKFLOW_NAME,
    workflowVersion: WORKFLOW_VERSION,

    // Payload
    payloadVersion: PAYLOAD_VERSION,

    // Engine Parameters
    outputPrefix: substituteBucketConstants(WORKFLOW_OUTPUT_PREFIX, stage),
  };
};

export const getSsmParameterPaths = (): SsmParameterPaths => {
  return {
    // Top level prefix
    ssmRootPrefix: SSM_PARAMETER_PATH_PREFIX,

    // Detail
    workflowName: SSM_PARAMETER_PATH_WORKFLOW_NAME,
    workflowVersion: SSM_PARAMETER_PATH_DEFAULT_WORKFLOW_VERSION,

    // Payload
    payloadVersion: SSM_PARAMETER_PATH_PAYLOAD_VERSION,

    // Engine Parameters
    outputPrefix: SSM_PARAMETER_PATH_OUTPUT_PREFIX,
  };
};

export const getStatefulStackProps = (stage: StageName): StatefulApplicationStackConfig => {
  return {
    /* SSM Parameter values and paths */
    ssmParameterValues: getSsmParameterValues(stage),
    ssmParameterPaths: getSsmParameterPaths(),
  };
};

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    /* Stage */
    stageName: stage,

    /* Event stuff */
    eventBusName: EVENT_BUS_NAME,

    /* Is new workflow manager deployed */
    isNewWorkflowManagerDeployed: NEW_WORKFLOW_MANAGER_IS_DEPLOYED[stage],

    /* SSM Parameter paths */
    ssmParameterPaths: getSsmParameterPaths(),
  };
};
