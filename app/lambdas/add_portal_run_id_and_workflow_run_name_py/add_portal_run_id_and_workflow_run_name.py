#!/usr/bin/env python3

"""
Given the workflow name, and workflow version (as env vars)
Generate a portal run id, and a workflow run name
"""

# Imports
from typing import Dict
from os import environ
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id
)

# Globals
WORKFLOW_RUN_PREFIX = 'umccr--automated'
BSSH_WORKFLOW_NAME_ENV_VAR = 'BSSH_WORKFLOW_NAME'
BSSH_WORKFLOW_VERSION_ENV_VAR = 'BSSH_WORKFLOW_VERSION'


def handler(event, context) -> Dict[str, str]:
    """
    Generate the workflow run name and portal run id
    :param event:
    :param context:
    :return:
    """

    # Get the workflow name and version from the environment
    workflow_name = environ[BSSH_WORKFLOW_NAME_ENV_VAR]
    workflow_version = environ[BSSH_WORKFLOW_VERSION_ENV_VAR]

    # Generate the portal run id
    portal_run_id = create_portal_run_id()

    # Generate the workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id
    )

    return {
        "portalRunId": portal_run_id,
        "workflowName": workflow_name,
        "workflowVersion": workflow_version,
        "workflowRunName": workflow_run_name
    }


# if __name__ == "__main__":
#     from os import environ
#     import json
#     environ['BSSH_WORKFLOW_NAME'] = 'bssh-fastq-to-aws-copy'
#     environ['BSSH_WORKFLOW_VERSION'] = '2025.05.14'
#     print(json.dumps(handler({}, None), indent=4))
#
#     # {
#     #     "portalRunId": "20250611dae12bc8",  # pragma: allowlist secret
#     #     "workflowName": "bssh-fastq-to-aws-copy",
#     #     "workflowVersion": "2025.05.14",
#     #     "workflowRunName": "umccr--automated--bssh-fastq-to-aws-copy--2025-05-14--20250611dae12bc8"
#     # }
