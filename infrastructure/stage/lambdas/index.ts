import {
  BuildLambdaProps,
  BuildLambdasProps,
  lambdaNameList,
  LambdaObject,
  lambdaToRequirementsMap,
} from './interfaces';
import { getPythonUvDockerImage, PythonUvFunction } from '@orcabus/platform-cdk-constructs/lambda';
import path from 'path';
import {
  LAMBDA_DIR,
  LAYERS_DIR,
  SCHEMA_REGISTRY_NAME,
  SSM_PARAMETER_PATH_PREFIX,
  SSM_SCHEMA_ROOT,
} from '../constants';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { camelCaseToKebabCase, camelCaseToSnakeCase } from '../utils';
import { PythonLayerVersion } from '@aws-cdk/aws-lambda-python-alpha';
import { NagSuppressions } from 'cdk-nag';
import { SchemaNames } from '../event-schemas/interfaces';

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
    timeout: lambdaRequirementsMap.needsExtendedTimeout
      ? Duration.seconds(900)
      : Duration.seconds(60),
    includeOrcabusApiToolsLayer: lambdaRequirementsMap.needsOrcabusApiToolsLayer,
    includeIcav2Layer: lambdaRequirementsMap.needsIcav2AccessToken,
    memorySize: lambdaRequirementsMap.needsIcav2AccessToken ? 1024 : undefined,
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
          `arn:aws:ssm:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:parameter${path.join(SSM_PARAMETER_PATH_PREFIX, '/*')}`,
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

  /*
    Special if the lambdaName is 'validateDraftCompleteSchema', we need to add in the ssm parameters
    to the REGISTRY_NAME and SCHEMA_NAME
   */
  if (props.lambdaName === 'validateDraftDataCompleteSchema') {
    const draftSchemaName: SchemaNames = 'completeDataDraft';
    lambdaFunction.addEnvironment('SSM_REGISTRY_NAME', path.join(SSM_SCHEMA_ROOT, 'registry'));
    lambdaFunction.addEnvironment(
      'SSM_SCHEMA_NAME',
      path.join(SSM_SCHEMA_ROOT, camelCaseToKebabCase(draftSchemaName), 'latest')
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
