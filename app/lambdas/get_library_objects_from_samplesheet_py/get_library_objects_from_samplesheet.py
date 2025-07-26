#!/usr/bin/env python3

"""
Get the libraries from the samplesheet
"""

# Imports
from typing import Dict, List

# Layer imports
from orcabus_api_tools.sequence import get_libraries_from_instrument_run_id
from orcabus_api_tools.metadata import get_libraries_list_from_library_id_list


def handler(event, context) -> Dict[str, List[Dict[str, str]]]:
    """
    Get library id list from the sequence run manager
    :param event:
    :param context:
    :return:
    """

    # Get the inputs
    instrument_run_id = event["instrumentRunId"]

    # Get the library id list
    library_id_list = list(sorted(set(get_libraries_from_instrument_run_id(instrument_run_id))))

    # Get the library objects
    library_objects = list(map(
        lambda library_object_iter_: {
            "libraryId": library_object_iter_['libraryId'],
            "orcabusId": library_object_iter_['orcabusId']
        },
        get_libraries_list_from_library_id_list(
            library_id_list
        )
    ))

    return {
        "libraryObjects": library_objects
    }


# if __name__ == "__main__":
#     import json
#     from os import environ
#     environ['AWS_PROFILE'] = 'umccr-production'
#     environ['AWS_REGION'] = 'ap-southeast-2'
#     environ['HOSTNAME_SSM_PARAMETER_NAME'] = '/hosted_zone/umccr/name'
#     environ['ORCABUS_TOKEN_SECRET_ID'] = 'orcabus/token-service-jwt'
#     print(json.dumps(
#         handler(
#             {
#                 "instrumentRunId": "250724_A01052_0269_AHFHWJDSXF"
#             },
#             None
#         ),
#         indent=4
#     ))
#
#     # {
#     #     "libraryObjects": [
#     #         {
#     #             "libraryId": "L2500872",
#     #             "orcabusId": "lib.01K0P4YPP6NJ5R14P75WT94JB9"
#     #         },
#     #         ... (more libraries)
#     #     ]
#     # }
