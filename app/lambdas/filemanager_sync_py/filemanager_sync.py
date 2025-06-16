#!/usr/bin/env python3

"""
Filemanager sync script

Check if the filemanager has the same number of files as the aws s3 api command returns
"""

from orcabus_api_tools.filemanager import list_files_recursively
import typing
import boto3
from urllib.parse import urlparse

if typing.TYPE_CHECKING:
    from mypy_boto3_s3 import S3Client


def handler(event, context):
    """
    List the files in the filemanaegr recursively
    :param event:
    :param context:
    :return:
    """

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

    # List files in the S3 bucket using boto3
    s3_client: S3Client = boto3.client('s3')

    s3_list = s3_client.list_objects_v2(
        Bucket=s3_bucket,
        Prefix=s3_path
    )['Contents']

    # We try again in a few seconds
    if len(filemanager_files) != len(s3_list):
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
