import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

import { AWS_S3_PRIMARY_DATA_PREFIX, EVENT_BUS_NAME } from './constants';
import { StatelessApplicationStackConfig } from './interfaces';
import { pipelineCacheBucket } from '@orcabus/platform-cdk-constructs/shared-config/s3';

export const getStatelessStackProps = (stage: StageName): StatelessApplicationStackConfig => {
  return {
    /* Stage */
    stageName: stage,

    /* Event stuff */
    eventBusName: EVENT_BUS_NAME,

    /* S3 Stuff */
    awsS3CacheBucketName: pipelineCacheBucket[stage],
    awsS3PrimaryDataPrefix: AWS_S3_PRIMARY_DATA_PREFIX[stage],
  };
};
