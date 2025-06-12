#!/usr/bin/env python3

"""
Get the libraries from the samplesheet
"""

# Imports
from typing import Dict, List

# Layer imports
from orcabus_api_tools.sequence import get_library_ids_in_sequence, get_sequence_object_from_instrument_run_id
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

    # Get the sequence object orcabus id from the instrument run id
    sequence_orcabus_id = get_sequence_object_from_instrument_run_id(instrument_run_id)['orcabusId']

    # Get the library id list
    library_id_list = list(set(get_library_ids_in_sequence(sequence_orcabus_id)))

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
