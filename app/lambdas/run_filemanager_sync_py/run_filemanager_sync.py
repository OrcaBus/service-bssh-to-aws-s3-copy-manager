#!/usr/bin/env python3

"""
Run filemanager sync command
"""
# Standard library imports
from pathlib import Path
from urllib.parse import urlparse

# Layer imports
from orcabus_api_tools.filemanager.file_helpers import crawl_filemanager_sync


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
    output_prefix = str(Path(output_uri_parsed.path)).lstrip('/') + "/"

    # Add the portal run id attribute to the output uri
    crawl_filemanager_sync(
        bucket=output_bucket,
        prefix=output_prefix
    )
