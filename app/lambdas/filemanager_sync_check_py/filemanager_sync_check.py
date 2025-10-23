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

    # List files via icav2
    icav2_project_data_obj = convert_uri_to_project_data_obj(s3_prefix)
    icav2_project_data_list = find_project_data_bulk(
        project_id=icav2_project_data_obj.project_id,
        parent_folder_id=icav2_project_data_obj.data.id,
        data_type='FILE'
    )

    # We try again in a few minutes
    if len(filemanager_files) != len(icav2_project_data_list):
        logger.info(
            f"Filemanager has {len(filemanager_files)} files, "
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



# if __name__ == "__main__":
#     from os import environ
#     import json
#
#     environ['AWS_PROFILE'] = 'umccr-production'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(json.dumps(
#         handler(
#             {
#                 "s3Prefix": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/primary/250606_A01052_0266_BHFHHJDSXF/20250607eb351de0/"
#             },
#             None
#         ),
#         indent=4
#     ))
#
#     # {
#     #     "isSynced": true
#     # }


# if __name__ == "__main__":
#     from os import environ
#     import json
#
#     environ['AWS_PROFILE'] = 'umccr-production'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(json.dumps(
#         handler(
#             {
#                 "s3Prefix": "s3://pipeline-prod-cache-503977275616-ap-southeast-2/byob-icav2/production/primary/250613_A00130_0370_AHFK32DSXF/202506153a0ee250/"
#             },
#             None
#         ),
#         indent=4
#     ))
#
#     # {
#     #     "isSynced": true
#     # }
