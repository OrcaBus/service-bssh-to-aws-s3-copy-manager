/**
Interfaces for the bssh to aws s3 application
*/

import * as cdk from 'aws-cdk-lib';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';

/** Application Interfaces **/

export interface StatelessApplicationStackConfig extends cdk.StackProps {
  /* Stack Name */
  stageName: StageName;

  /* Event stuff */
  eventBusName: string;

  /* AWS S3 stuff */
  awsS3CacheBucketName: string;
  awsS3PrimaryDataPrefix: string;
}
