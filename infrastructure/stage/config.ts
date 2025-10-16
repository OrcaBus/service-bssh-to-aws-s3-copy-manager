import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

import {
  AWS_S3_PRIMARY_DATA_PREFIX,
  EVENT_BUS_NAME,
  PAYLOAD_VERSION,
  SSM_PARAMETER_PATH_DEFAULT_WORKFLOW_VERSION,
  SSM_PARAMETER_PATH_OUTPUT_PREFIX,
  SSM_PARAMETER_PATH_PAYLOAD_VERSION,
  SSM_PARAMETER_PATH_PREFIX,
  SSM_PARAMETER_PATH_WORKFLOW_NAME,
  WORKFLOW_NAME,
  WORKFLOW_VERSION,
} from './constants';
import { StatefulApplicationStackConfig, StatelessApplicationStackConfig } from './interfaces';
import { PIPELINE_CACHE_BUCKET } from '@orcabus/platform-cdk-constructs/shared-config/s3';
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';

export const getSsmParameterValues = (stage: StageName): SsmParameterValues => {
  return {
    // Values
    workflowName: WORKFLOW_NAME,
    workflowVersion: WORKFLOW_VERSION,

    // Payload
    payloadVersion: PAYLOAD_VERSION,

    // Engine Parameters
    outputPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],
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

    /* S3 Stuff */
    awsS3CacheBucketName: PIPELINE_CACHE_BUCKET[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],

    /* SSM Parameter paths */
    ssmParameterPaths: getSsmParameterPaths(),
  };
};
