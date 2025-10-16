import {
  BuildLambdaProps,
  BuildLambdasProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
} from './interfaces';
import { getPythonUvDockerImage, PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import path from 'path';
import { LAMBDA_DIR, LAYERS_DIR, SCHEMA_REGISTRY_NAME, SSM_SCHEMA_ROOT } from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { camelCaseToSnakeCase } from '../utils';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { NagSuppressions } from 'cdk-nag';

export function buildBsshToolsLayer(scope: Construct): PythonLayerVersion {
  /**
        Build the bssh tools layer, used by the get manifest lambda function
    */
  return new PythonLayerVersion(scope, 'bssh-lambda-layer', {
    entry: path.join(LAYERS_DIR, 'bssh_manager_tools_layer'),
    compatibleRuntimes: [lambda.Runtime.PYTHON_3_12],
    compatibleArchitectures: [lambda.Architecture.ARM_64],
    bundling: {
      image: getPythonUvDockerImage(),
      commandHooks: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        beforeBundling(inputDir: string, outputDir: string): string[] {
          return [];
        },
        afterBundling(inputDir: string, outputDir: string): string[] {
          return [
            `pip install ${inputDir} --target ${outputDir}`,
            `find ${outputDir} -name 'pandas' -exec rm -rf {}/tests/ \\;`,
          ];
        },
      },
    },
  });
}

function buildLambdaFunction(scope: Construct, props: BuildLambdaProps): LambdaObject {
  const lambdaNameToSnakeCase = camelCaseToSnakeCase(props.lambdaName);
  const lambdaRequirementsMap = lambdaToRequirementsMap[props.lambdaName];

  /* Build the lambda function */
  const lambdaFunction = new PythonUvFunction(scope, props.lambdaName, {
    entry: path.join(LAMBDA_DIR, lambdaNameToSnakeCase + '_py'),
    runtime: lambda.Runtime.PYTHON_3_12,
    architecture: lambda.Architecture.ARM_64,
    index: lambdaNameToSnakeCase + '.py',
    handler: 'handler',
    timeout: Duration.seconds(60),
    includeOrcabusApiToolsLayer: lambdaRequirementsMap.needsOrcabusApiToolsLayer,
    includeIcav2Layer: lambdaRequirementsMap.needsIcav2AccessToken,
    memorySize: props.lambdaName === 'getIcav2CopyJobList' ? 1024 : undefined,
  });

  /* Do we need the bssh tools layer? */
  if (lambdaRequirementsMap.needsBsshLambdaLayer) {
    // Add the bssh tools layer to the lambda function
    lambdaFunction.addLayers(props.bsshToolsLayer);
  }

  /*
    Add in SSM permissions for the lambda function
    */
  if (lambdaRequirementsMap.needsSsmParametersAccess) {
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${path.join(SSM_SCHEMA_ROOT, '/*')}`,
        ],
      })
    );
    /* Since we dont ask which schema, we give the lambda access to all schemas in the registry */
    /* As such we need to add the wildcard to the resource */
    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'We need to give the lambda access to all schemas in the registry',
        },
      ],
      true
    );
  }

  /*
    For the schema validation lambdas we need to give them the access to the schema
    */
  if (lambdaRequirementsMap.needsSchemaRegistryAccess) {
    // Add the schema registry access to the lambda function
    lambdaFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['schemas:DescribeRegistry', 'schemas:DescribeSchema'],
        resources: [
          `arn:aws:schemas:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:registry/${SCHEMA_REGISTRY_NAME}`,
          `arn:aws:schemas:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:schema/${path.join(SCHEMA_REGISTRY_NAME, '/*')}`,
        ],
      })
    );

    /* Since we dont ask which schema, we give the lambda access to all schemas in the registry */
    /* As such we need to add the wildcard to the resource */
    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'We need to give the lambda access to all schemas in the registry',
        },
      ],
      true
    );
  }

  /* Add bssh workflow env vars */
  if (lambdaRequirementsMap.needsBsshWorkflowEnvVars) {
    lambdaFunction.addEnvironment(
      'BSSH_WORKFLOW_NAME_SSM_PARAMETER_NAME',
      props.ssmParameterPaths.workflowName
    );
    lambdaFunction.addEnvironment(
      'BSSH_WORKFLOW_VERSION_SSM_PARAMETER_NAME',
      props.ssmParameterPaths.workflowVersion
    );
    lambdaFunction.addEnvironment(
      'BSSH_PAYLOAD_VERSION_SSM_PARAMETER_NAME',
      props.ssmParameterPaths.payloadVersion
    );
    lambdaFunction.addEnvironment(
      'PRIMARY_DATA_OUTPUT_URI_PREFIX_SSM_PARAMETER_NAME',
      props.ssmParameterPaths.outputPrefix
    );
  }

  /* Add in the file system access */
  if (lambdaRequirementsMap.needsCacheBucketReadAccess) {
    const s3CacheBucketObj = s3.Bucket.fromBucketName(
      scope,
      props.lambdaName + 'CacheBucket',
      props.awsS3CacheBucketName
    );
    s3CacheBucketObj.grantRead(lambdaFunction, `${props.awsS3PrimaryDataPrefix}*`);

    // Add in Nag suppressions for the S3 bucket access with * access
    NagSuppressions.addResourceSuppressions(
      lambdaFunction,
      [
        {
          id: 'AwsSolutions-IAM5',
          reason: 'We need to access all objects in the cache bucket with the prefix',
        },
      ],
      true
    );
  }

  // AwsSolutions-L1 - We'll migrate to PYTHON_3_13 ASAP, soz
  // AwsSolutions-IAM4 - We need to add this for the lambda to work
  NagSuppressions.addResourceSuppressions(
    lambdaFunction,
    [
      {
        id: 'AwsSolutions-L1',
        reason: 'Will migrate to PYTHON_3_13 ASAP, soz',
      },
    ],
    true
  );

  /* Return the lambda object */
  return {
    lambdaName: props.lambdaName,
    lambdaFunction: lambdaFunction,
  };
}

export function buildAllLambdaFunctions(
  scope: Construct,
  props: BuildLambdasProps
): LambdaObject[] {
  // Iterate over lambdaNameList and create the lambda functions
  const lambdaObjects: LambdaObject[] = [];
  for (const lambdaName of lambdaNameList) {
    lambdaObjects.push(
      buildLambdaFunction(scope, {
        lambdaName: lambdaName,
        ...props,
      })
    );
  }

  // Return the lambda objects
  return lambdaObjects;
}
