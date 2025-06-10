# BSSH to AWS S3 Copy Manager

## Overview

Application to copy primary data from BSSH ([BaseSpace Sequencing Hub](https://www.illumina.com/products/by-type/informatics-products/basespace-sequence-hub.html)) to AWS S3

We perform a direct copy of the instrument run id, along with the InterOp files from the BCL directory.

This project is a stateless-only application meaning there are no stateful resources (e.g., DynamoDB, RDS) in the application.

## Event Bus / Events Targets Overview

The application listens to the Workflow Run State Change event from the Workflow Manager
where the with the workflowName is set to 'BclConvert' and the status is set to 'SUCCEEDED'.

From the SUCCEEDED event, the application creates a 'READY' bsshFastqCopy event (for itself),
by taking the ICAv2 Analysis ID to determine the workflow outputs and using the SRM to determine the libraries in the instrument run.

The READY event is then sent to the Workflow Manager and then listened to by this Application.

The application then performs the following tasks through AWS Step Functions:

1. Push a 'RUNNING' event to inform the Workflow Manager that the copy is in progress.
2. Generate two ICAv2DataCopySync events.
   * Copy the InterOp files from the raw BCL Directory under the directory 'InterOp' under the output directory.
   * Copy the Samples and Reports from the BCLConvert directory and place them under the output directory with the name 'Samples' and 'Reports' respectively.
3. Push a 'SUCCEEDED' event to inform the Workflow Manager that the copy is complete.


![Event Bus Overview](./docs/drawio-exports/bssh-to-aws-s3-copy.drawio.svg)


## Example Events

### BCLConvert

#### SUCCEEDED Event

```json5
{
  "EventBusName": "OrcaBusMain",  // Name of the event bus
  "DetailType": "WorkflowRunStateChange",  // This is the workflow manager event type
  "Source": "orcabus.workflowmanager",  // The workflow manager relays all workflow events
  "Detail": {
    "portalRunId": "202505110d99b042",  // The run ID of the BCLConvert workflow
    "timestamp": "2025-05-11T02:25:57+00:00",  // The time the event was created
    "status": "SUCCEEDED",  // The status of the workflow
    "workflowName": "BclConvert",  // The name of the workflow
    "workflowVersion": "4.2.7",  // The version of the workflow
    "workflowRunName": "Tsqn-STRL250505-Tothill_9May25_79dcdf_e3b59a",  // The instrument run name  // pragma: allowlist secret
    "payload": {
      "refId": "30c5821e-03ca-47da-98c3-d3799129d97e",  // The reference ID of the workflow event id
      "version": "0.1.0",  // The workflow payload event version
      "data": {
        "projectId": "9ec02c1f-53ba-47a5-854d-e6b53101adb7",  // The ICAv2 BSSH Project ID
        "analysisId": "e2788dee-b151-4376-9659-171106b9cdbd",  // The ICAv2 Analysis ID for BCLConvert
        "userReference": "Tsqn-STRL250505-Tothill_9May25_79dcdf_e3b59a",  // The User Reference ID for the Analysis  // pragma: allowlist secret
        "timeCreated": "2025-05-11T00:11:53Z",  // The time the analysis was created
        "timeModified": "2025-05-11T02:25:37Z",  // The time the analysis was completed
        "pipelineId": "bf93b5cf-cb27-4dfa-846e-acd6eb081aca",  // The pipeline ID for BCLConvert
        "pipelineCode": "BclConvert v4_2_7",  // The pipeline code for BCLConvert
        "pipelineDescription": "This is an autolaunch BclConvert pipeline for use by the metaworkflow",
        "pipelineUrn": "urn:ilmn:ica:pipeline:bf93b5cf-cb27-4dfa-846e-acd6eb081aca#BclConvert_v4_2_7",  // The pipeline URN as specified in the SampleSheet
        "instrumentRunId": "250509_A01052_0262_BHFGJWDSXF",  // The instrument run ID
        "basespaceRunId": 5088093,  // The Basespace run ID
        "samplesheetB64gz": "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"  // The SampleSheet in JSON B64 GZIP Compressed Format  // pragma: allowlist secret
      }
    }
  }
}
```

### BSSH Fastq to AWS Copy Manager

#### READY Event

```json5
{
  // Name of the event bus
  "EventBusName": "OrcaBusMain",
  // This is the workflow manager event type
  "DetailType": "WorkflowRunStateChange",
  // The workflow manager relays all workflow events
  "Source": "orcabus.workflowmanager",
  "Detail": {
    // The run ID of the BCLConvert workflow
    "portalRunId": "202505110d99b042",
    // The time the event was created
    "timestamp": "2025-05-11T02:25:57+00:00",
    // The status of the workflow
    "status": "READY",
    // The name of the workflow
    "workflowName": "bssh-fastq-to-aws-copy",
    // The version of the workflow
    "workflowVersion": "2025.05.14",
    /*
      The workflow run name takes the following format
        - umccr--automated (is hard coded)
        - bssh-fastq-to-aws-copy (is the workflow name in lower case (hard-coded)
        - 2025-05-14 (is the workflow version (hard-coded))
        - 202504179cac7411 (is the portal run id (generated by the BCLConvert Succeeded Event to Ready Event SFN))
    */
    "workflowRunName": "umccr--automated--bssh-fastq-to-aws-copy--2025-05-14--202504179cac7411",
    "payload": {
      "refId": "4eddde15-284c-4633-a77b-bc584875478b",
      // The reference ID of the workflow event id
      "version": "2025.05.14",
      // The workflow payload event version
      "data": {
        "inputs": {
          // The ICAv2 Analysis ID for BCLConvert
          "bsshAnalysisId": "33aca803-6bd4-48ec-8443-150e52852053",
          // The ICAv2 Project ID
          "bsshProjectId": "a7c67a80-c8f2-4348-adec-3a5a073d1d55",
          // The instrument run id
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        },
        "engineParameters": {
          // Specifies the output directory for the copy
          "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/20231010_pi1-07_0329_A222N7LTD3/202504179cac7411/"
        },
        "tags": {
          // We add in a tag for this workflow to help with tracking
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        }
      }
    }
  }
}
```

#### SUCCEEDED Event

```json5
{
  // Name of the event bus
  "EventBusName": "OrcaBusMain",
  // Workflow Manager event type
  "DetailType": "WorkflowRunStateChange",
  // Event relayed by the workflow manager
  "Source": "orcabus.workflowmanager",
  "Detail": {
    // Workflow run status
    "status": "SUCCEEDED",
    // Timestamp of the event
    "timestamp": "2025-04-22T00:09:07.220Z",
    // Portal Run ID For the BSSH Fastq Copy Manager
    "portalRunId": "202504179cac7411",  // pragma: allowlist secret
    // Workflow name
    "workflowName": "bssh-fastq-to-aws-copy",
    // Workflow version
    "workflowVersion": "2025.05.14",
    // Workflow run name
    "workflowRunName": "umccr--automated--bssh-fastq-to-aws-copy--2024-05-24--202504179cac7411",
    // Linked libraries in the instrument run
    "linkedLibraries": [
      {
        "orcabusId": "lib.12345",
        "libraryId": "L20202020"
      }
    ],
    "payload": {
      "refId": "workflowmanagerrefid",
      "version": "2024.07.01",
      "data": {
        // Original inputs from READY State
        "inputs": {
          "bsshAnalysisId": "33aca803-6bd4-48ec-8443-150e52852053",
          "bsshProjectId": "a7c67a80-c8f2-4348-adec-3a5a073d1d55",
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        },
        // Original outputs from READY state
        "engineParameters": {
          "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/20231010_pi1-07_0329_A222N7LTD3/202504179cac7411/"
        },
        // Added by the bssh fastq copy manager
        // And needed by downstream 'glues'
        // Hoping to delete the fastqListRowsB64gz attribute from the event
        // As soon as the clag glues can instead listen to the fastq glues
        "outputs": {
          "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/20231010_pi1-07_0329_A222N7LTD3/202504179cac7411/",
          "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3",
          "fastqListRowsB64gz": "H4sIAJPdBmgC/92U0WvCMBDG/xXps2lyFzXWt1gxDDoZNnsaI0TNZqFqZp3gxv73pSCMjWL33Kd83H1H7oMf9/QZLdXdLJr0ojRVqVJax6mWQaU6hqjfC+38vm7r/GFOFhJwLMYE2JQsnb8asulNQ2b3Lhig9jq7gXlRusdjUc9UfEKpL7wri70jG3cma7veOjJkPBECxXAEI2I9qQ7vp62z1YkgXV0OK1Ks7RlpGHDlwe/c/kT9sdjZ44UiQw4MmPEFECYM45gYiYgLkekZr/tDNgCRhJ/EAIDmdudLV9F6TQO0MUZz1eRgMsbALMGEJ34JC77Frx/RNSl2MCn+TvrV7/0QJAM9qVQq1qkOMohWgrCNIOwGQdhcNTl2jaDWpLcI0lJqGRCKlVa1/McN4m0E8W4QxJurJuddI6g16V+Cnr8Bp+MZ4cYGAAA="  // pragma: allowlist secret
        },
        // Original tags from READY State
        "tags": {
         "instrumentRunId": "20231010_pi1-07_0329_A222N7LTD3"
        }
      }
    }
  }
}
```

## Step Functions Diagrams

### BCLConvert Succeeded Event to Ready Event

![BCLConvert Succeeded Event to Ready Event Step Function](./docs/workflow-studio-exports/bclconvert-succeeded-to-bssh-ready-sfn.svg)

### BSSH Fastq Copy Step Function

![BSSH Fastq Copy Step Function](./docs/workflow-studio-exports/bssh-fastq-copy-sfn.svg)

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

#### Stateless Stacks

This CDK project manages multiple stacks. The root stack (the only one that does not include `DeploymentPipeline` in its stack ID) is deployed in the toolchain account and sets up a CodePipeline for cross-environment deployments to `beta`, `gamma`, and `prod`.

To list all available stacks, run:

```sh
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

And the PORTAL_RUN_ID is the PORTAL_RUN_ID for the BSSH Fastq Copy event (not the BCLConvert event).
