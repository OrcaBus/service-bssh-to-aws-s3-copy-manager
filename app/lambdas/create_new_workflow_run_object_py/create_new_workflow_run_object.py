#!/usr/bin/env python3

"""
Given a bclconvert portal run id, create a BSSH Copy Workflow Run Draft object:
"""

# Standard imports
from os import environ
from pathlib import Path
from urllib.parse import urlparse, urlunparse

# Layer imports
from orcabus_api_tools.utils.aws_helpers import get_ssm_value
from orcabus_api_tools.workflow import (
    create_portal_run_id,
    create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id,
    get_latest_payload_from_portal_run_id,
    list_workflows,
    get_workflow_run_from_portal_run_id
)

# Globals
BSSH_WORKFLOW_NAME_SSM_PARAMETER_ENV_VAR = 'BSSH_WORKFLOW_NAME_SSM_PARAMETER_NAME'
BSSH_WORKFLOW_VERSION_SSM_PARAMETER_ENV_VAR = 'BSSH_WORKFLOW_VERSION_SSM_PARAMETER_NAME'
BSSH_PAYLOAD_VERSION_SSM_PARAMETER_ENV_VAR = 'BSSH_PAYLOAD_VERSION_SSM_PARAMETER_NAME'
PRIMARY_DATA_OUTPUT_URI_PREFIX_SSM_PARAMETER_ENV_VAR = 'PRIMARY_DATA_OUTPUT_URI_PREFIX_SSM_PARAMETER_NAME'


def handler(event, context):
    # Get the inputs
    bclconvert_portal_run_id = event.get("bclconvertPortalRunId")

    # Get the workflow name and version from the environment
    workflow_name = get_ssm_value(environ[BSSH_WORKFLOW_NAME_SSM_PARAMETER_ENV_VAR])
    workflow_version = get_ssm_value(environ[BSSH_WORKFLOW_VERSION_SSM_PARAMETER_ENV_VAR])
    payload_version = get_ssm_value(environ[BSSH_PAYLOAD_VERSION_SSM_PARAMETER_ENV_VAR])
    output_uri_prefix = get_ssm_value(environ[PRIMARY_DATA_OUTPUT_URI_PREFIX_SSM_PARAMETER_ENV_VAR])

    # Generate the portal run id
    portal_run_id = create_portal_run_id()

    # Get the workflow, from the workflow name and version
    try:
        workflow = next(iter(list_workflows(
            workflow_name=workflow_name,
            workflow_version=workflow_version
        )))
    except StopIteration:
        raise ValueError(
            f"Workflow with name '{workflow_name}' and version '{workflow_version}' not found."
        )

    # Generate the workflow run name
    workflow_run_name = create_workflow_run_name_from_workflow_name_workflow_version_and_portal_run_id(
        workflow_name=workflow_name,
        workflow_version=workflow_version,
        portal_run_id=portal_run_id
    )

    # Get the bclconvert data object
    bclconvert_payload = get_latest_payload_from_portal_run_id(
        portal_run_id=bclconvert_portal_run_id
    )
    bclconvert_libraries = get_workflow_run_from_portal_run_id(
        portal_run_id=bclconvert_portal_run_id
    )['libraries']

    # Get values repeated through the payload
    instrument_run_id = bclconvert_payload['data']['tags']['instrumentRunId']

    output_uri_prefix_object = urlparse(
        output_uri_prefix
    )

    # Create the workflow run draft object
    payload = {
        "version": payload_version,
        "data": {
            "tags": bclconvert_payload['data']['tags'],
            "inputs": {
                "bsshProjectId": bclconvert_payload['data']['engineParameters']['projectId'],
                "bsshAnalysisId": bclconvert_payload['data']['engineParameters']['analysisId'],
                "instrumentRunId": instrument_run_id,
            },
            "engineParameters": {
                "outputUri": str(urlunparse((
                    output_uri_prefix_object.scheme,
                    output_uri_prefix_object.netloc,
                    str(Path(output_uri_prefix_object.path) / instrument_run_id / portal_run_id) + "/",
                    None, None, None
                )))
            }
        }
    }

    return {
        "workflowRunObject": {
            "status": "DRAFT",
            "portalRunId": portal_run_id,
            "workflow": workflow,
            "workflowRunName": workflow_run_name,
            "libraries": bclconvert_libraries,
            "payload": payload
        }
    }
