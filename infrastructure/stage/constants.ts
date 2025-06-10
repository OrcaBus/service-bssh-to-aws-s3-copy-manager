/* Constants for the stack */

import path from 'path';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { pipelineCachePrefix } from '@orcabus/platform-cdk-constructs/shared-config/s3';

/* Directory constants */
export const APP_ROOT = path.join(__dirname, '../../app');
export const LAMBDA_DIR = path.join(APP_ROOT, 'lambdas');
export const STEP_FUNCTIONS_DIR = path.join(APP_ROOT, 'step-function-templates');
export const LAYERS_DIR = path.join(APP_ROOT, 'layers');

export const EVENT_BUS_NAME = 'OrcaBusMain';
export const WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE = 'WorkflowRunStateChange';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const ICAV2_DATA_COPY_DETAIL_TYPE = 'ICAv2DataCopySync';
export const STACK_EVENT_SOURCE = 'orcabus.bsshfastqcopy';

/* Event rule stuff */
export const BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE = 'SUCCEEDED';
export const BCLCONVERT_WORKFLOW_NAME = 'BclConvert';

/* BSSH Workflow stuff */
export const BSSH_WORKFLOW_NAME = 'bssh-fastq-to-aws-copy';
export const BSSH_WORKFLOW_VERSION = '2025.05.14';
export const BSSH_PAYLOAD_VERSION = '2025.05.14';

export const AWS_S3_PRIMARY_DATA_PREFIX: Record<StageName, string> = {
  ['BETA']: pipelineCachePrefix['BETA'] + 'primary/',
  ['GAMMA']: pipelineCachePrefix['GAMMA'] + 'primary/',
  ['PROD']: pipelineCachePrefix['PROD'] + 'primary/',
};
