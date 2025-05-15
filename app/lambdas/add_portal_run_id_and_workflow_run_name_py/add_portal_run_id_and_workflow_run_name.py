#!/usr/bin/env python3

"""
Given the workflow name, and workflow version (as env vars)
Generate a portal run id, and a workflow run name
"""

# Imports
from typing import Dict
from datetime import datetime, timezone
from uuid import uuid4
from os import environ

# Globals
WORKFLOW_RUN_PREFIX = 'umccr--automated'
BSSH_WORKFLOW_NAME_ENV_VAR = 'BSSH_WORKFLOW_NAME'
BSSH_WORKFLOW_VERSION_ENV_VAR = 'BSSH_WORKFLOW_VERSION'


def generate_portal_run_id() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%d") + uuid4()[0:8]


def generate_workflow_run_name(
        workflow_name: str,
        workflow_version: str,
        portal_run_id: str
) -> str:
    return '--'.join([
        WORKFLOW_RUN_PREFIX,
        workflow_name.lower(),
        workflow_version.replace(".", "-"),
        portal_run_id
    ])


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
    portal_run_id = generate_portal_run_id()

    # Generate the workflow run name
    workflow_run_name = generate_workflow_run_name(
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
