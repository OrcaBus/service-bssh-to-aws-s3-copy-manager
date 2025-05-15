#!/usr/bin/env python3

"""
Get the libraries from the samplesheet
"""

# Imports
from typing import Dict, List

# Layer imports
from orcabus_api_tools.sequence import get_library_ids_in_sequence
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
    library_id_list = get_library_ids_in_sequence(instrument_run_id)

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
