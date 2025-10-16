# BSSH to AWS S3 Copy Manager

## Overview

Application to copy primary data from BSSH ([BaseSpace Sequencing Hub](https://www.illumina.com/products/by-type/informatics-products/basespace-sequence-hub.html)) to AWS S3

We perform a direct copy of the instrument run id, along with the InterOp files from the BCL directory.

This project is a stateless-only application meaning there are no stateful resources (e.g., DynamoDB, RDS) in the application.


## Event Bus / Events Targets Overview

The application listens to the Workflow Run State Change event from the Workflow Manager
where the with the workflowName is set to 'BclConvert' and the status is set to 'SUCCEEDED'.

From the SUCCEEDED event, the application creates a 'DRAFT' BSSH-to-AWS-S3 event (for itself),
by taking the ICAv2 Analysis ID to determine the workflow inputs + outputs.

We then validate the DRAFT event for the 'bssh-to-aws-s3-copy' workflow by confirming the following data attributes:

* tags - copied from BCLConvert Manager, comprising:
  * instrumentRunId
  * basespaceRunId
  * experimentRunName
* inputs:
  * bsshProjectId - the ICAv2 Project ID for BCLConvert
  * bsshAnalysisId - the ICAv2 Analysis ID for BCLConvert
  * instrumentRunId - the instrument run id
* engineParameters:
  * outputUri - the S3 URI to copy the data over to

The READY event is then sent to the Workflow Manager and then listened to by this Application.

The application then performs the following tasks through AWS Step Functions:

1. Push a 'RUNNING' event to inform the Workflow Manager that the copy is in progress.
2. Generate two ICAv2DataCopySync events.
   * Copy the InterOp files from the raw BCL Directory under the directory 'InterOp' under the output directory.
   * Copy the Samples and Reports from the BCLConvert directory and place them under the output directory with the name 'Samples' and 'Reports' respectively.
3. Push a 'SUCCEEDED' event to inform the Workflow Manager that the copy is complete.


![Event Bus Overview](./docs/drawio-exports/bssh-to-aws-s3-copy.drawio.svg)


## Step Functions Diagrams

### BCLConvert Succeeded To Draft

![BCLConvert Succeeded Event to Draft](./docs/workflow-studio-exports/handle-bclconvert-succeeded.svg)

### Draft Validation

![Draft Validation](./docs/workflow-studio-exports/validate-draft-to-ready.svg)

### BSSH To AWS S3 Copy Step Function

![BSSH Fastq Copy Step Function](./docs/workflow-studio-exports/run-bssh-fastq-copy-service.svg)

## BaseSpace Directory Overview

Raw data is stored in BSSH under the following directory structure:

```
/ilmn-runs/<INSTRUMENT_RUN_ID>_<v1Pre3Id>/
```

While the BCLConvert output is stored under the following directory structure:

```
/ilmn-analysis/<INSTRUMENT_RUN_NAME>_<WORKFLOW_SESSION_SUFFIX>_<ANALYSIS_RUN_SUFFIX>_<ANALYSIS_ID>/
```

Where:
  * INSTRUMENT_RUN_NAME is the run name in the Sample Sheet,
  * WORKFLOW_SESSION_SUFFIX is the final six random hexadecimal characters of the workflow session name
  * ANALYSIS_RUN_SUFFIX is the final six random hexadecimal characters of the analysis run name
  * ANALYSIS_ID is the analysis ID of the BCLConvert workflow in ICAv2

If you think this is excessive, ugly and unsortable, then you are not alone.

## AWS S3 Directory Overview

Data is copied into our cache bucket directory (pipeline-prod-cache-503977275616-ap-southeast-2)
under the following directory structure:

```
byob-icav2/<PROJECT_NAME>/primary/<INSTRUMENT_RUN_ID>/<PORTAL_RUN_ID>/
```

Where PROJECT_NAME is one of the following:
* development
* staging
* production

And the PORTAL_RUN_ID is the PORTAL_RUN_ID for the BSSH to AWS S3 Copy Run (not the BCLConvert Run).


## Project Structure

The project is organized into the following key directories:

- **`./app`**: Contains the main application logic and blue-prints.

- **`./bin/deploy.ts`**: Serves as the entry point of the application. It initializes the root stack: `stateless`.

- **`./infrastructure`**: Contains the infrastructure code for the project:
  - **`./infrastructure/toolchain`**: Includes stacks for the stateless resources deployed in the toolchain account. These stacks primarily set up the CodePipeline for cross-environment deployments.
  - **`./infrastructure/stage`**: Defines the stage stacks for different environments:
    - **`./infrastructure/stage/constants.ts`**: Contains constants used in the application, these can be both application globals, and organisation specific constants.
    - **`./infrastructure/stage/config.ts`**: Contains environment-specific configurations, (e.g., `beta`, `gamma`, `prod`).
    - **`./infrastructure/stage/interfaces.ts`**: These define the functional interfaces for the application, used in the application stacks.
    - **`./infrastructure/stage/stateless-application-stack.ts`**: The CDK stack entry point for provisioning resources required by the application in `./app`.

- **`.github/workflows/pr-tests.yml`**: Configures GitHub Actions to run tests for `make check` (linting and code style), tests defined in `./test`, and `make test` for the `./app` directory. Modify this file as needed to ensure the tests are properly configured for your environment.

- **`./test`**: Contains tests for CDK code compliance against `cdk-nag`. You should modify these test files to match the resources defined in the `./infrastructure` folder.

## Setup

### Requirements

```sh
node --version
v22.9.0

# Update Corepack (if necessary, as per pnpm documentation)
npm install --global corepack@latest

# Enable Corepack to use pnpm
corepack enable pnpm

```

### Install Dependencies

To install all required dependencies, run:

```sh
make install
```

### CDK Commands

You can access CDK commands using the `pnpm` wrapper script.

This template provides the CDK entry point: `cdk-stateless`.

- **`cdk-stateless`**: Used to deploy stacks containing stateless resources (e.g., AWS Lambda), which can be easily redeployed without side effects.

The type of stack to deploy is determined by the context set in the `./bin/deploy.ts` file. This ensures the correct stack is executed based on the provided context.

For example:

```sh
# Deploy a stateless stack
pnpm cdk-stateless <command>
```

## CDK Stacks

This CDK project manages multiple stacks. The root stack (the only one that does not include `DeploymentPipeline` in its stack ID) is deployed in the toolchain account and sets up a CodePipeline for cross-environment deployments to `beta`, `gamma`, and `prod`.

### Stateful stack

To list all available stateful stacks, run:

```shell
pnpm cdk-stateful list
```

```sh
OrcaBusStatefulServiceStack
OrcaBusStatefulServiceStack/BSSHToAWSS3CopyManagerStatefulDeploymentPipeline/OrcaBusBeta/BSSHToAWSS3CopyManagerStatefulDeployStack (OrcaBusBeta-BSSHToAWSS3CopyManagerStatefulDeployStack)
OrcaBusStatefulServiceStack/BSSHToAWSS3CopyManagerStatefulDeploymentPipeline/OrcaBusGamma/BSSHToAWSS3CopyManagerStatefulDeployStack (OrcaBusGamma-BSSHToAWSS3CopyManagerStatefulDeployStack)
OrcaBusStatefulServiceStack/BSSHToAWSS3CopyManagerStatefulDeploymentPipeline/OrcaBusProd/BSSHToAWSS3CopyManagerStatefulDeployStack (OrcaBusProd-BSSHToAWSS3CopyManagerStatelessDeployStack)
```

### Stateless Stack

To list all available stateless stacks, run:

```shell
pnpm cdk-stateless list
```

Example output:

```sh
OrcaBusStatelessServiceStack
OrcaBusStatelessServiceStack/BSSHToAWSS3CopyManagerStatelessDeploymentPipeline/OrcaBusBeta/BSSHToAWSS3CopyManagerStatelessDeployStack (OrcaBusBeta-BSSHToAWSS3CopyManagerStatelessDeployStack)
OrcaBusStatelessServiceStack/BSSHToAWSS3CopyManagerStatelessDeploymentPipeline/OrcaBusGamma/BSSHToAWSS3CopyManagerStatelessDeployStack (OrcaBusGamma-BSSHToAWSS3CopyManagerStatelessDeployStack)
OrcaBusStatelessServiceStack/BSSHToAWSS3CopyManagerStatelessDeploymentPipeline/OrcaBusProd/BSSHToAWSS3CopyManagerStatelessDeployStack (OrcaBusProd-BSSHToAWSS3CopyManagerStatelessDeployStack)
```

## Linting and Formatting

### Run Checks

To run linting and formatting checks on the root project, use:

```sh
make check
```

### Fix Issues

To automatically fix issues with ESLint and Prettier, run:

```sh
make fix
```
