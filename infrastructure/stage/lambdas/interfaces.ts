import { PythonFunction, PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { SsmParameterPaths } from '../ssm/interfaces';

/** Lambda Interfaces **/
export type LambdaName =
  // DRAFT
  | 'createNewWorkflowRunObject'
  // Validation
  | 'validateDraftDataCompleteSchema'
  // RUNNING
  | 'getWorkflowRunObject'
  | 'getIcav2CopyJobList'
  // POST COPY
  | 'runFilemanagerSync'
  | 'addPortalRunIdAttributes'
  | 'filemanagerSyncCheck';

export const lambdaNameList: Array<LambdaName> = [
  // DRAFT
  'createNewWorkflowRunObject',
  // Validation
  'validateDraftDataCompleteSchema',
  // RUNNING
  'getWorkflowRunObject',
  'getIcav2CopyJobList',
  // POST COPY
  'runFilemanagerSync',
  'addPortalRunIdAttributes',
  'filemanagerSyncCheck',
];

export interface LambdaRequirementProps {
  /* Does the lambda needs a token */
  needsIcav2AccessToken?: boolean;

  /* Does the lambda needs the bssh lambda layer */
  needsBsshLambdaLayer?: boolean;

  /* Needs orcabus api tools layer */
  needsOrcabusApiToolsLayer?: boolean;

  /* Needs access to the ssm parameters */
  needsSsmParametersAccess?: boolean;

  /* Event schema registry */
  needsSchemaRegistryAccess?: boolean;

  /* Needs BSSH Workflow env vars */
  needsBsshWorkflowEnvVars?: boolean;

  /* Some lambdas may need an extended timeout */
  needsExtendedTimeout?: boolean;
}

export interface BuildLambdasProps {
  /* Optional requirements */
  /* Custom Layers */
  bsshToolsLayer: PythonLayerVersion;

  /* SSM Parameter paths */
  ssmParameterPaths: SsmParameterPaths;
}

export interface BuildLambdaProps extends BuildLambdasProps {
  /* Naming formation */
  lambdaName: LambdaName;
}

export interface LambdaObject {
  /* Naming formation */
  lambdaName: LambdaName;
  /* Lambda function object */
  lambdaFunction: PythonFunction;
}

export type LambdaToRequirementsMapType = { [key in LambdaName]: LambdaRequirementProps };

export const lambdaToRequirementsMap: LambdaToRequirementsMapType = {
  // DRAFT
  createNewWorkflowRunObject: {
    needsSsmParametersAccess: true,
    needsBsshWorkflowEnvVars: true,
    needsOrcabusApiToolsLayer: true,
  },
  // Validation
  validateDraftDataCompleteSchema: {
    needsSsmParametersAccess: true,
    needsSchemaRegistryAccess: true,
  },
  // RUNNING
  getWorkflowRunObject: {
    needsOrcabusApiToolsLayer: true,
  },
  getIcav2CopyJobList: {
    needsBsshLambdaLayer: true,
    needsIcav2AccessToken: true,
  },
  // POST COPY
  runFilemanagerSync: {
    needsOrcabusApiToolsLayer: true,
  },
  addPortalRunIdAttributes: {
    needsOrcabusApiToolsLayer: true,
  },
  filemanagerSyncCheck: {
    needsOrcabusApiToolsLayer: true,
    needsIcav2AccessToken: true,
    needsExtendedTimeout: true,
  },
};
