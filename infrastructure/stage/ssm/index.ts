import { Construct } from 'constructs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { BuildSsmParameterProps } from './interfaces';

export function buildSsmParameters(scope: Construct, props: BuildSsmParameterProps) {
  /**
   * SSM Stack here
   *
   * */

  /**
   * Detail Level SSM Parameters
   */
  // Workflow name
  new ssm.StringParameter(scope, 'workflow-name', {
    parameterName: props.ssmParameterPaths.workflowName,
    stringValue: props.ssmParameterValues.workflowName,
  });
  // Workflow version
  new ssm.StringParameter(scope, 'workflow-version', {
    parameterName: props.ssmParameterPaths.workflowVersion,
    stringValue: props.ssmParameterValues.workflowVersion,
  });

  /**
   * Payload level SSM Parameters
   */
  // Payload version
  new ssm.StringParameter(scope, 'payload-version', {
    parameterName: props.ssmParameterPaths.payloadVersion,
    stringValue: props.ssmParameterValues.payloadVersion,
  });

  /**
   * Engine Parameters
   */
  // Output prefix
  new ssm.StringParameter(scope, 'output-prefix', {
    parameterName: props.ssmParameterPaths.outputPrefix,
    stringValue: props.ssmParameterValues.outputPrefix,
  });
}
