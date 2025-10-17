/**
Interfaces for the bssh to aws s3 application
*/

import * as cdk from 'aws-cdk-lib';
import { StageName } from '@orcabus/platform-cdk-constructs/shared-config/accounts';
import { SsmParameterPaths, SsmParameterValues } from './ssm/interfaces';

/** Application Interfaces **/

/**
 * Stateful application stack interface.
 */

export interface StatefulApplicationStackConfig {
  // Values
  // Detail
  ssmParameterValues: SsmParameterValues;

  // Keys
  ssmParameterPaths: SsmParameterPaths;
}

export interface StatelessApplicationStackConfig extends cdk.StackProps {
  /* Stack Name */
  stageName: StageName;

  /* Event stuff */
  eventBusName: string;

  /* AWS S3 stuff */
  awsS3CacheBucketName: string;
  awsS3PrimaryDataPrefix: string;

  /* SSM Parameter paths */
  ssmParameterPaths: SsmParameterPaths;
}
