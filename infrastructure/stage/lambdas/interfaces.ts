import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';

/** Lambda Interfaces **/
export type LambdaNameList =
  | 'addEngineParameters'
  | 'addPortalRunIdAndWorkflowRunName'
  | 'addTags'
  | 'getLibraryObjectsFromSamplesheet'
  | 'getManifestAndFastqListRows'
  | 'filemanagerSync';

export const lambdaNameList: Array<LambdaNameList> = [
  'addEngineParameters',
  'addPortalRunIdAndWorkflowRunName',
  'addTags',
  'getLibraryObjectsFromSamplesheet',
  'getManifestAndFastqListRows',
  'filemanagerSync',
];

export interface AwsEnvVars {
  AWS_S3_CACHE_BUCKET_NAME: string;
  AWS_S3_PRIMARY_DATA_PREFIX: string;
}

export interface BsshWorkflowEnvVars {
  BSSH_WORKFLOW_NAME: string;
  BSSH_WORKFLOW_VERSION: string;
}

export interface LambdaRequirementProps {
  /* Does the lambda needs a token */
  needsIcav2AccessToken?: boolean;

  /* Does the lambda needs the bssh lambda layer */
  needsBsshLambdaLayer?: boolean;

  /* Needs orcabus api tools layer */
  needsOrcabusApiToolsLayer?: boolean;

  /* Needs AWS Env vars */
  needsAwsEnvVars?: boolean;

  /* Needs BSSH Workflow env vars */
  needsBsshWorkflowEnvVars?: boolean;

  /* Needs Cache Bucket Read Access */
  needsCacheBucketReadAccess?: boolean;
}

export interface BuildLambdasProps {
  /* Optional requirements */
  /* Custom Layers */
  bsshToolsLayer: PythonLayerVersion;

  /* AWS S3 Environment Variables */
  awsS3PrimaryDataPrefix: string;
  awsS3CacheBucketName: string;
}

export interface BuildLambdaProps extends BuildLambdasProps {
  /* Naming formation */
  lambdaName: LambdaNameList;
}

export interface LambdaObject {
  /* Naming formation */
  lambdaName: LambdaNameList;
  /* Lambda function object */
  lambdaFunction: PythonFunction;
}

export type LambdaToRequirementsMapType = { [key in LambdaNameList]: LambdaRequirementProps };

export const lambdaToRequirementsMap: LambdaToRequirementsMapType = {
  addEngineParameters: {
    needsAwsEnvVars: true,
  },
  addPortalRunIdAndWorkflowRunName: {
    needsBsshWorkflowEnvVars: true,
  },
  addTags: {},
  getLibraryObjectsFromSamplesheet: {
    needsOrcabusApiToolsLayer: true,
  },
  getManifestAndFastqListRows: {
    needsBsshLambdaLayer: true,
    needsIcav2AccessToken: true,
  },
  filemanagerSync: {
    needsOrcabusApiToolsLayer: true,
    needsCacheBucketReadAccess: true,
  },
};
