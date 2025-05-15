import { StageName } from '@orcabus/platform-cdk-constructs/utils';
import {
  AWS_S3_CACHE_BUCKET_NAME,
  AWS_S3_PRIMARY_DATA_PREFIX,
  BCLCONVERT_WORKFLOW_NAME,
  BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE,
  BSSH_WORKFLOW_NAME,
  BSSH_WORKFLOW_VERSION,
  EVENT_BUS_NAME,
  ICAV2_ACCESS_TOKEN_SECRET_ID,
  ICAV2_DATA_COPY_DETAIL_TYPE,
  STACK_EVENT_SOURCE,
  WORKFLOW_MANAGER_EVENT_SOURCE,
  WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
} from './constants';
import { StatelessApplicationStackConfig } from './interfaces';

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    /* ICAv2 access token secret name */
    icav2AccessTokenSecretId: ICAV2_ACCESS_TOKEN_SECRET_ID[stage],

    /* Event stuff */
    eventBusName: EVENT_BUS_NAME,
    workflowRunStateChangeDetailType: WORKFLOW_RUN_STATE_CHANGE_EVENT_TYPE,
    workflowManagerEventSource: WORKFLOW_MANAGER_EVENT_SOURCE,

    /* Triggers */
    bclconvertWorkflowRuleStatusValue: BCLCONVERT_WORKFLOW_RULE_STATUS_VALUE,
    bclconvertWorkflowName: BCLCONVERT_WORKFLOW_NAME,

    /* Event Output */
    bsshWorkflowName: BSSH_WORKFLOW_NAME,
    bsshWorkflowVersion: BSSH_WORKFLOW_VERSION,

    /* Miscell event */
    icav2DataCopyDetailType: ICAV2_DATA_COPY_DETAIL_TYPE,

    /* Stack event stuff */
    stackEventSource: STACK_EVENT_SOURCE,

    /* S3 Stuff */
    awsS3CacheBucketName: AWS_S3_CACHE_BUCKET_NAME[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],
  };
};
