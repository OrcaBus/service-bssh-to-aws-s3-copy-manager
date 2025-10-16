/* Constants for the stack */

import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { PIPELINE_CACHE_PREFIX } from '@orcabus/platform-cdk-constructs/shared-config/s3';
import { DATA_SCHEMA_REGISTRY_NAME } from '@orcabus/platform-cdk-constructs/shared-config/event-bridge';

/* Directory constants */
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-function-templates');
export const LAYERS_DIR = path.join(APP_ROOT, 'layers');
export const EVENT_SCHEMAS_DIR = path.join(APP_ROOT, 'event-schemas');

export const EVENT_BUS_NAME = 'OrcaBusMain';
export const WORKFLOW_RUN_STATE_CHANGE_DETAIL_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const ICAV2_DATA_COPY_DETAIL_TYPE = 'ICAv2DataCopySync';

/* Stack constants */
export const STACK_EVENT_SOURCE = 'orcabus.bsshfastqcopy';
export const STACK_PREFIX = 'orca-bssh-to-s3-';

/* Event rule stuff */
export const BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE = 'SUCCEEDED';
export const BCLCONVERT_WORKFLOW_NAME = 'BclConvert';

/* BSSH Workflow stuff */
export const WORKFLOW_NAME = 'bssh-fastq-to-aws-copy';
export const WORKFLOW_VERSION = '2025.10.16';
export const PAYLOAD_VERSION = '2025.10.16';

/* SSM Parameter Paths */
export const SSM_PARAMETER_PATH_PREFIX = path.join(`/orcabus/workflows/${WORKFLOW_NAME}/`);
// Workflow Parameters
export const SSM_PARAMETER_PATH_WORKFLOW_NAME = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'workflow-name'
);
export const SSM_PARAMETER_PATH_DEFAULT_WORKFLOW_VERSION = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'workflow-version'
);
// Engine Parameters
export const SSM_PARAMETER_PATH_PAYLOAD_VERSION = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'payload-version'
);
export const SSM_PARAMETER_PATH_OUTPUT_PREFIX = path.join(
  SSM_PARAMETER_PATH_PREFIX,
  'output-prefix'
);

/* Status constants */
export const DRAFT_STATUS = 'DRAFT';
export const READY_STATUS = 'READY';
export const SUCCEEDED_STATUS = 'SUCCEEDED';

/* Schema constants */
export const SCHEMA_REGISTRY_NAME = DATA_SCHEMA_REGISTRY_NAME;
export const SSM_SCHEMA_ROOT = path.join(SSM_PARAMETER_PATH_PREFIX, 'schemas');

/* S3 bucket constants */
export const AWS_S3_PRIMARY_DATA_PREFIX: Record<StageName, string> = {
  ['BETA']: PIPELINE_CACHE_PREFIX['BETA'] + 'primary/',
  ['GAMMA']: PIPELINE_CACHE_PREFIX['GAMMA'] + 'primary/',
  ['PROD']: PIPELINE_CACHE_PREFIX['PROD'] + 'primary/',
};
