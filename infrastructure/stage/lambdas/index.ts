import {
  BuildLambdaProps,
  BuildLambdasProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
} from './interfaces';
import { getPythonUvDockerImage, PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import path from 'path';
import { BSSH_WORKFLOW_NAME, BSSH_WORKFLOW_VERSION, LAMBDA_DIR, LAYERS_DIR } from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { camelCaseToSnakeCase } from '../utils';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { NagSuppressions } from 'cdk-nag';

export function buildBsshToolsLayer(scope: Construct): PythonLayerVersion {
  /**
        Build the bssh tools layer, used by the get manifest lambda function
        // Use getPythonUvDockerImage once we export this as a function from the
        // platform-cdk-constructs repo
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
  });

  /* Do we need the bssh tools layer? */
  if (lambdaRequirementsMap.needsBsshLambdaLayer) {
    // Add the bssh tools layer to the lambda function
    lambdaFunction.addLayers(props.bsshToolsLayer);
  }

  /* Add AWS env vars */
  if (lambdaRequirementsMap.needsAwsEnvVars) {
    lambdaFunction.addEnvironment('AWS_S3_CACHE_BUCKET_NAME', props.awsS3CacheBucketName);
    lambdaFunction.addEnvironment('AWS_S3_PRIMARY_DATA_PREFIX', props.awsS3PrimaryDataPrefix);
  }

  /* Add bssh workflow env vars */
  if (lambdaRequirementsMap.needsBsshWorkflowEnvVars) {
    lambdaFunction.addEnvironment('BSSH_WORKFLOW_NAME', BSSH_WORKFLOW_NAME);
    lambdaFunction.addEnvironment('BSSH_WORKFLOW_VERSION', BSSH_WORKFLOW_VERSION);
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
