# BSSH to AWS S3 Copy Manager

## Table of Contents <!-- omit in toc -->

- [Description](#description)
  - [Ready Event Creation](#ready-event-creation)
  - [Workflow](#workflow)
  - [Consumed Events](#consumed-events)
  - [Published Events](#published-events)
  - [Release management](#release-management)
  - [Related Services](#related-services)
    - [Upstream Pipelines](#upstream-pipelines)
    - [Downstream Pipelines](#downstream-pipelines)
    - [Primary Services](#primary-services)
  - [BaseSpace Directory Overview](#basespace-directory-overview)
  - [AWS S3 Directory Overview](#aws-s3-directory-overview)
- [Infrastructure \& Deployment](#infrastructure--deployment)
  - [Stateful](#stateful)
  - [Stateless](#stateless)
  - [CDK Commands](#cdk-commands)
  - [Stacks](#stacks)
- [Development](#development)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
    - [Requirements](#requirements)
    - [Install Dependencies](#install-dependencies)
  - [Conventions](#conventions)
  - [Linting and Formatting](#linting-and-formatting)
  - [Run Checks](#run-checks)
  - [Fix Issues](#fix-issues)


## Description

Application to copy primary data from BSSH ([BaseSpace Sequencing Hub](https://www.illumina.com/products/by-type/informatics-products/basespace-sequence-hub.html)) to AWS S3

We perform a direct copy of the instrument run id, along with the InterOp files from the BCL directory.

### Ready Event Creation

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

![BSSH-TO-AWS-S3 Pipeline Manager Architecture](./docs/drawio-exports/draft-to-ready.drawio.svg)

### Workflow

The READY event is then sent to the Workflow Manager and then listened to by this application.

The application then performs the following tasks through AWS Step Functions:

1. Push a 'RUNNING' event to inform the Workflow Manager that the copy is in progress.
2. Generate two ICAv2DataCopySync events.
   * Copy the InterOp files from the raw BCL Directory under the directory 'InterOp' under the output directory.
   * Copy the Samples and Reports from the BCLConvert directory and
     place them under the output directory with the name 'Samples' and 'Reports' respectively.
3. Push a 'SUCCEEDED' event to inform the Workflow Manager that the copy is complete.

![BSSH-TO-AWS-S3 Pipeline Manager Architecture](./docs/drawio-exports/workflow-export.drawio.svg)


### Consumed Events

| Name / DetailType             | Source                    | Schema Link                                                                                                                                | Description                           |
|-------------------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------|
| `WorkflowRunStateChange`      | `orcabus.workflowmanager` | [WorkflowRunStateChange](https://github.com/OrcaBus/wiki/tree/main/orcabus-platform#workflowrunstatechange)                                | Source of updates on WorkflowRuns     |
| `Icav2WesAnalysisStateChange` | `orcabus.icav2wes`        | [Icav2WesAnalysisStateChange](https://github.com/OrcaBus/service-icav2-wes-manager/blob/main/app/event-schemas/analysis-state-change.json) | ICAv2 WES Analysis State Change event |


### Published Events

| Name / DetailType   | Source                  | Schema Link                                                                                                                                    | Description                    |
|---------------------|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------|
| `WorkflowRunUpdate` | `orcabus.bsshtoawss3` | [WorkflowRunUpdate](https://github.com/OrcaBus/service-workflow-manager/blob/main/docs/events/WorkflowRunUpdate/WorkflowRunUpdate.schema.json) | Announces Workflow Run Updates |


### Release management

The service employs a fully automated CI/CD pipeline that
automatically builds and releases all changes to the `main` code branch.

### Related Services

#### Upstream Pipelines

- [BCLConvert Manager](https://github.com/OrcaBus/service-bclconvert-manager)

#### Downstream Pipelines

- [Fastq Glue](https://github.com/OrcaBus/service-fastq-glue)

#### Primary Services

- [Workflow Manager](https://github.com/OrcaBus/service-workflow-manager)
- [ICAv2 Data Copy Manager](https://github.com/OrcaBus/service-icav2-data-copy-manager/)


### BaseSpace Directory Overview

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

### AWS S3 Directory Overview

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

## Infrastructure & Deployment

> Deployment settings / configuration (e.g. CodePipeline(s) / automated builds).

Infrastructure and deployment are managed via CDK.
This template provides two types of CDK entry points: `cdk-stateless` and `cdk-stateful`.

### Stateful

- SSM Parameters
- Event Schemas

### Stateless

- Lambdas
- Step Functions
- Event Rules
- Event Targets (connecting event rules to StepFunctions)

### CDK Commands

You can access CDK commands using the `pnpm` wrapper script.

- **`cdk-stateless`**: Used to deploy stacks containing stateless resources (e.g., AWS Lambda), which can be easily
  redeployed without side effects.
- **`cdk-stateful`**: Used to deploy stacks containing stateful resources (e.g., AWS DynamoDB, AWS RDS), where
  redeployment may not be ideal due to potential side effects.

The type of stack to deploy is determined by the context set in the `./bin/deploy.ts` file. This ensures the correct
stack is executed based on the provided context.

For example:

```sh
# Deploy a stateless stack
pnpm cdk-stateless <command>

# Deploy a stateful stack
pnpm cdk-stateful <command>
```

### Stacks

This CDK project manages multiple stacks. The root stack (the only one that does not include `DeploymentPipeline` in its
stack ID) is deployed in the toolchain account and sets up a CodePipeline for cross-environment deployments to `beta`,
`gamma`, and `prod`.

To list all available stacks, run:

```sh
pnpm cdk-stateful ls
pnpm cdk-stateless ls
```

Output

```sh
# Stateful
BSSHStatefulPipeline
BSSHStatefulPipeline/BSSHStatefulPipeline/OrcaBusBeta/BSSHToAWSS3CopyStatefulDeployStack (OrcaBusBeta-BSSHToAWSS3CopyStatefulDeployStack)
BSSHStatefulPipeline/BSSHStatefulPipeline/OrcaBusGamma/BSSHToAWSS3CopyStatefulDeployStack (OrcaBusGamma-BSSHToAWSS3CopyStatefulDeployStack)
BSSHStatefulPipeline/BSSHStatefulPipeline/OrcaBusProd/BSSHToAWSS3CopyStatefulDeployStack (OrcaBusProd-BSSHToAWSS3CopyStatefulDeployStack)
# Stateless
BSSHStatelessPipeline
BSSHStatelessPipeline/BSSHStatelessPipeline/OrcaBusBeta/BSSHToAWSS3CopyStatelessDeployStack (OrcaBusBeta-BSSHToAWSS3CopyStatelessDeployStack)
BSSHStatelessPipeline/BSSHStatelessPipeline/OrcaBusGamma/BSSHToAWSS3CopyStatelessDeployStack (OrcaBusGamma-BSSHToAWSS3CopyStatelessDeployStack)
BSSHStatelessPipeline/BSSHStatelessPipeline/OrcaBusProd/BSSHToAWSS3CopyStatelessDeployStack (OrcaBusProd-BSSHToAWSS3CopyStatelessDeployStack)
```

## Development

### Project Structure

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

### Setup

#### Requirements

```sh
node --version
v22.9.0

# Update Corepack (if necessary, as per pnpm documentation)
npm install --global corepack@latest

# Enable Corepack to use pnpm
corepack enable pnpm
```

#### Install Dependencies

To install all required dependencies, run:

```sh
make install
```

### Conventions

### Linting and Formatting

### Run Checks

Automated checks are enforced via pre-commit hooks, ensuring only checked code is committed. For details consult the
`.pre-commit-config.yaml` file.

Manual, on-demand checking is also available via `make` targets (see below). For details consult the `Makefile` in the
root of the project.

To run linting and formatting checks on the root project, use:

```sh
make check
```

### Fix Issues

To automatically fix issues with ESLint and Prettier, run:

```sh
make fix
```
