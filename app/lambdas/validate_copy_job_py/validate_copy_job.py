#!/usr/bin/env python3

"""
Validate copy job

Given an input of sourceUri and destinationUri, confirm that the sourceUri has been copied over to the destinationUri,
If sourceUri ends with a '/', then its a directory and will be placed as a subfolder underneath the destinationUri,
If sourceUri does not end with a '/', then its a file and will be placed directly under the destinationUri,

We then confirm that the file size in bytes matches between the two locations
For directories, we need to perform this recursively.
"""

# Standard Imports
from pathlib import Path
from typing import cast

# Wrapica imports
from wrapica.literals import DataType
from wrapica.project_data import (
    convert_uri_to_project_data_obj,
    get_project_data_obj_from_project_id_and_path,
    find_project_data_bulk
)

# Layer imports
from icav2_tools import set_icav2_env_vars

def handler(event, context):
    """
    Given the inputs sourceUri and destinationUri, confirm that the copies have been made correctly.
    """
    # Set env vars
    set_icav2_env_vars()

    # Get the source and destination uris
    source_uri = event.get("sourceUri")
    destination_uri = event.get("destinationUri")

    # Confirm that the source and destination uris are not None
    if source_uri is None:
        raise ValueError("The sourceUri is required")
    if destination_uri is None:
        raise ValueError("The destinationUri is required")

    # If the source uri ends with a '/', then its a directory and will be placed as a subfolder underneath the destination uri
    source_data_obj = convert_uri_to_project_data_obj(source_uri)
    parent_destination_data_obj = convert_uri_to_project_data_obj(destination_uri)
    destination_data_obj = get_project_data_obj_from_project_id_and_path(
        project_id=parent_destination_data_obj.project_id,
        data_path=Path(parent_destination_data_obj.data.details.path) / source_data_obj.data.details.name,
        data_type=cast(DataType, source_data_obj.data.details.data_type)
    )

    # Separate tests for files and folders

    # If a folder, we need to find all files within the folder and confirm that they have been copied over
    # correctly, and that the number of files matches between the source and destination
    if source_data_obj.data.details.data_type == "FOLDER":
        all_source_objects = list(filter(
            lambda project_data_iter_: not (
                project_data_iter_.data.details.name == ".iap_upload_test.tmp"
            ),
            find_project_data_bulk(
                project_id=source_data_obj.project_id,
                parent_folder_id=source_data_obj.data.id,
                data_type="FILE"
            )
        ))

        all_destination_object = list(filter(
            lambda project_data_iter_: not (
                project_data_iter_.data.details.name == ".iap_upload_test.tmp"
            ),
            find_project_data_bulk(
            project_id=destination_data_obj.project_id,
            parent_folder_id=destination_data_obj.data.id,
            data_type="FILE"
            )
        ))

        if len(all_source_objects) != len(all_destination_object):
            raise ValueError(
                f"The number of files in the source and destination directories do not match. "
                f"Source: {len(all_source_objects)}, Destination: {len(all_destination_object)}"
            )

    # Check that the file size in bytes matches between the source and destination
    else:
        # Confirm that the file size in bytes matches between the source and destination
        if source_data_obj.data.details.file_size_in_bytes != destination_data_obj.data.details.file_size_in_bytes:
            raise ValueError(
                f"The file size in bytes does not match between the source and destination. "
                f"Source: {source_data_obj.data.details.file_size_in_bytes}, Destination: {destination_data_obj.data.details.file_size_in_bytes}"
            )
        if source_data_obj.data.details.object_e_tag != destination_data_obj.data.details.object_e_tag:
            raise ValueError(
                f"File sizes match but the file e-tags do not match between the source and destination. This suggests that the contents of the files may be different. "
                f"The file e-tags do not match between the source and destination. "
                f"Source: {source_data_obj.data.details.object_e_tag}, Destination: {destination_data_obj.data.details.object_e_tag}"
            )
