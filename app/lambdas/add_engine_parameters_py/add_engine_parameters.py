#!/usr/bin/env python3

"""
Add engine parameters

{
    "engineParameters": {
        "outputUri": "s3://<bucket>/<prefix>/<instrument_run_id>/<portal_run_id>/",
    }
}
"""

# Imports
from typing import Dict
from os import environ
from urllib.parse import urlunparse
from pathlib import Path


# Use the environment variables to determine the appropriate engine parameters
AWS_S3_CACHE_BUCKET_NAME_ENV_VAR = "AWS_S3_CACHE_BUCKET_NAME"
AWS_S3_PRIMARY_DATA_PREFIX_ENV_VAR = "AWS_S3_PRIMARY_DATA_PREFIX"

def handler(event, context) -> Dict[str, Dict[str, str]]:
    """
    Added engine parameters to the event object.
    The engine parameters are used to determine where to store the output data.
    :param event:
    :param context:
    :return:
    """

    # Get the event inputs
    instrument_run_id = event.get("instrumentRunId")
    portal_run_id = event.get("portalRunId")

    # Get the bucket and prefix from the environment variables
    bucket = environ.get(AWS_S3_CACHE_BUCKET_NAME_ENV_VAR)
    prefix = environ.get(AWS_S3_PRIMARY_DATA_PREFIX_ENV_VAR)

    # Check if the bucket and prefix are set
    if not bucket or not prefix:
        raise ValueError("Bucket and prefix must be set in the environment variables")

    # Add the engine parameters to the event object
    return {
        "engineParameters": {
            "outputUri": str(urlunparse((
                "s3",
                bucket,
                str(Path(prefix) / instrument_run_id / portal_run_id) + "/",
            )))
        }
    }
