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
export const WORKFLOW_RUN_UPDATE_DETAIL_TYPE = 'WorkflowRunUpdate';
export const WORKFLOW_MANAGER_EVENT_SOURCE = 'orcabus.workflowmanager';
export const ICAV2_DATA_COPY_DETAIL_TYPE = 'ICAv2DataCopySync';

/* Stack constants */
export const STACK_SOURCE = 'orcabus.bsshtoawss3';
export const STACK_PREFIX = 'orca-bssh-to-s3-';

/* Event rule stuff */
export const BCLCONVERT_WORKFLOW_NAME = 'BclConvert';

/* BSSH Workflow stuff */
export const WORKFLOW_NAME = 'bssh-to-aws-s3';
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

/* Future proofing */
export const NEW_WORKFLOW_MANAGER_IS_DEPLOYED: Record<StageName, boolean> = {
  BETA: true,
  GAMMA: true,
  PROD: false,
};

/* Engine parameters */
export const WORKFLOW_OUTPUT_PREFIX = `s3://{__CACHE_BUCKET__}/{__CACHE_PREFIX__}primary/`;
