import { App, Aspects, Stack } from 'aws-cdk-lib';
import { Annotations, Match } from 'aws-cdk-lib/assertions';
import { SynthesisMessage } from 'aws-cdk-lib/cx-api';
import { AwsSolutionsChecks, NagSuppressions } from 'cdk-nag';
import { StatelessApplicationStack } from '../infrastructure/stage/stateless-application-stack';
import { getStatelessStackProps } from '../infrastructure/stage/config';

function synthesisMessageToString(sm: SynthesisMessage): string {
  return `${sm.entry.data} [${sm.id}]`;
}

describe('cdk-nag-stateless-stage-stack', () => {
  const app = new App({});

  // You should configure all stack (stateless) to be tested
  const deployStack = new StatelessApplicationStack(app, 'ApplicationStack', {
    // Pick the prod environment to test as it is the most strict
    ...getStatelessStackProps('PROD'),
  });

  Aspects.of(deployStack).add(new AwsSolutionsChecks());
  applyNagSuppression(deployStack);

  test(`cdk-nag AwsSolutions Pack errors`, () => {
    const errors = Annotations.fromStack(deployStack)
      .findError('*', Match.stringLikeRegexp('AwsSolutions-.*'))
      .map(synthesisMessageToString);
    expect(errors).toHaveLength(0);
  });

  test(`cdk-nag AwsSolutions Pack warnings`, () => {
    const warnings = Annotations.fromStack(deployStack)
      .findWarning('*', Match.stringLikeRegexp('AwsSolutions-.*'))
      .map(synthesisMessageToString);
    expect(warnings).toHaveLength(0);
  });
});

/**
 * apply nag suppression
 * @param stack
 */
function applyNagSuppression(stack: Stack) {
  NagSuppressions.addStackSuppressions(
    stack,
    [{ id: 'AwsSolutions-S10', reason: 'not require requests to use SSL' }],
    true
  );
}
