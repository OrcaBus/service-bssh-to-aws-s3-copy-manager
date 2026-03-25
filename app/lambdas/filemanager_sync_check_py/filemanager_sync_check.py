#!/usr/bin/env python3

"""
Filemanager sync script

Check if the filemanager has the same number of files as the aws s3 api command returns
"""

# Standard imports
import logging
from urllib.parse import urlparse

# Wrapica imports
from wrapica.project_data import find_project_data_bulk, convert_uri_to_project_data_obj

# Layer imports
from icav2_tools import set_icav2_env_vars
from orcabus_api_tools.filemanager import list_files_recursively

# Setup logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    List the files in the filemanaegr recursively
    :param event:
    :param context:
    :return:
    """
    # Set icav2 env vars
    set_icav2_env_vars()

    # Get the bucket, key from the event
    s3_prefix = event.get('s3Prefix', '')

    # Get the bucket
    s3_bucket = urlparse(s3_prefix).netloc
    s3_path = urlparse(s3_prefix).path.lstrip('/')

    # List files in the filemanager
    filemanager_files = list(filter(
        lambda x: not x['key'].endswith('.iap_xaccount_test.tmp'),
        list_files_recursively(
            bucket=s3_bucket,
            key=s3_path
        )
    ))

    # Num unique files
    filemanager_files_count = len(list(set(
        list(map(
            lambda fm_iter_: fm_iter_['ingestId'],
            filemanager_files
        ))
    )))

    # List files via icav2
    icav2_project_data_obj = convert_uri_to_project_data_obj(s3_prefix)
    icav2_project_data_list = find_project_data_bulk(
        project_id=icav2_project_data_obj.project_id,
        parent_folder_id=icav2_project_data_obj.data.id,
        data_type='FILE'
    )

    if not filemanager_files_count == len(icav2_project_data_list):
        logger.info(
            f"Filemanager has {filemanager_files_count} files, "
            f"ICAv2 has {len(icav2_project_data_list)} files"
        )
        return {
            "isSynced": False,
        }

    # If the number of files is the same, we pass the check
    else:
        return {
            "isSynced": True,
        }
