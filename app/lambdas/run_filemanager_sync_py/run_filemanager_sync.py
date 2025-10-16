#!/usr/bin/env python3

"""
Run filemanager sync command
"""

# Standard library imports
from typing import Optional, Union, Dict, List
from urllib.parse import urlparse

# Layer imports
from orcabus_api_tools.filemanager import get_file_manager_url
from orcabus_api_tools.utils.requests_helpers import post_request


# TODO - to be a function in the platform constructs
S3_SYNC_ENDPOINT = "api/v1/s3/crawl/sync"


def file_manager_post_request(
        endpoint: str,
        json_data: Optional[Union[Dict, List]] = None,
        params: Optional[Dict] = None
):
    return post_request(
        get_file_manager_url(endpoint),
        json_data=json_data,
        params=params
    )


def handler(event, context):
    """
    Add the portal run id attributes for the output uri
    :param event:
    :param context:
    :return:
    """
    # Get the s3 input
    s3_prefix = event.get("s3Prefix")

    # Get the output uri and key
    output_uri_parsed = urlparse(s3_prefix)
    output_bucket = output_uri_parsed.netloc
    output_key = output_uri_parsed.path.lstrip('/')

    # Add the portal run id attribute to the output uri
    file_manager_post_request(
        endpoint=S3_SYNC_ENDPOINT,
        json_data={
            "bucket": output_bucket,
            "prefix": f"{output_key.rstrip('/')}/",
        }
    )
