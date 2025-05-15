/* Constants for the stack */

import { StageName } from '@orcabus/platform-cdk-constructs/utils';

import path from 'path';

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
export const BSSH_WORKFLOW_NAME = 'bsshFastqCopy';
export const BSSH_WORKFLOW_VERSION = '2025.05.14';
export const BSSH_PAYLOAD_VERSION = '2025.05.14';

/*
ICAv2 Resources
These are generated in the Infrastructure stack under
https://github.com/umccr/infrastructure/tree/master/cdk/apps/icav2_credentials
*/
export const ICAV2_ACCESS_TOKEN_SECRET_ID: Record<StageName, string> = {
  ['BETA']: 'ICAv2JWTKey-umccr-prod-service-dev', // pragma: allowlist secret
  ['GAMMA']: 'ICAv2JWTKey-umccr-prod-service-staging', // pragma: allowlist secret
  ['PROD']: 'ICAv2JWTKey-umccr-prod-service-production', // pragma: allowlist secret
};

/*
AWS S3 Resources differ between environments
*/
export const AWS_S3_CACHE_BUCKET_NAME: Record<StageName, string> = {
  ['BETA']: 'pipeline-dev-cache-503977275616-ap-southeast-2',
  ['GAMMA']: 'pipeline-stg-cache-503977275616-ap-southeast-2',
  ['PROD']: 'pipeline-prod-cache-503977275616-ap-southeast-2',
};

export const AWS_S3_PRIMARY_DATA_PREFIX: Record<StageName, string> = {
  ['BETA']: 'byob-icav2/development/primary/',
  ['GAMMA']: 'byob-icav2/staging/primary/',
  ['PROD']: 'byob-icav2/production/primary/',
};
