#!/usr/bin/env python3

"""
Get the workflow run object for a given workflow run id.

We also get the payload and drop the 'currentState' attribute
"""

# Layer imports
from orcabus_api_tools.workflow import (
    get_workflow_run_from_portal_run_id,
    get_latest_payload_from_portal_run_id
)


def handler(event, context):
    """
    Get the workflow run object for a given workflow run id.
    :param event:
    :param context:
    :return:
    """

    # Inputs
    portal_run_id = event['portalRunId']

    # Get the workflow run object
    workflow_run_object = get_workflow_run_from_portal_run_id(portal_run_id)
    payload = get_latest_payload_from_portal_run_id(portal_run_id)

    # Drop the 'currentState' attribute from the workflow run object
    if 'currentState' in workflow_run_object:
        del workflow_run_object['currentState']

    # Append the payload to the workflow run object
    workflow_run_object['payload'] = payload

    return {
        "workflowRunObject": workflow_run_object
    }
