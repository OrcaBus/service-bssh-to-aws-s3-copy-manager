#!/usr/bin/env python3

"""
Handle the bclconvert object object

The BCLConversion complete object looks something like this:

{
  "projectId": "a1234567-1234-1234-1234-1234567890ab",  // The output project id
  "analysisId": "b1234567-1234-1234-1234-1234567890ab", // The analysis id
  "instrumentRunId": "231116_A01052_0172_BHVLM5DSX7",    // The instrument run id
  "outputUri": "icav2://7595e8f2-32d3-4c76-a324-c6a85dae87b5/ilmn_primary/231116_A01052_0172_BHVLM5DSX7/abcd1234/"  // A prefix to where the output should be stored
}

While the outputs will look something like this:

{
    "instrument_run_id": "231116_A01052_0172_BHVLM5DSX7",
    "output_uri": "icav2://7595e8f2-32d3-4c76-a324-c6a85dae87b5/ilmn_primary/231116_A01052_0172_BHVLM5DSX7/20240207abcduuid/",
}

"""


# Imports
from pathlib import Path
from urllib.parse import urlparse
import logging

# Set ICAv2 environment variables
from icav2_tools import set_icav2_env_vars

# Wrapica imports
from wrapica.libica_models import ProjectData
from wrapica.project_data import (
    get_project_data_obj_by_id,
    get_project_data_folder_id_from_project_id_and_path,
    convert_project_id_and_data_path_to_uri,
    convert_uri_to_project_data_obj
)
from wrapica.utils.globals import FILE_DATA_TYPE, FOLDER_DATA_TYPE, ICAV2_URI_SCHEME

# Local imports
from bssh_manager_tools.utils.icav2_analysis_helpers import (
    get_run_folder_obj_from_analysis_id,
    get_interop_files_from_run_folder, get_bclconvert_outputs_from_analysis_id,
)
from bssh_manager_tools.utils.logger import set_basic_logger

# Set logger
logger = set_basic_logger()
logger.setLevel(logging.INFO)


def handler(event, context):
    """
    Read in the event and collect the workflow session details
    """
    # Set ICAv2 configuration from secrets
    logger.info("Setting icav2 env vars from secrets manager")
    set_icav2_env_vars()

    # Get the BCLConvert analysis ID
    logger.info("Collecting the analysis id and project context")
    project_id = event['projectId']
    analysis_id = event['analysisId']

    logger.info("Collect the output uri prefix")
    output_uri = event['outputUri']
    dest_project_data_obj = convert_uri_to_project_data_obj(
        output_uri,
        create_data_if_not_found=True
    )

    # Get the input run inputs
    logger.info("Collecting input run data objects")
    input_run_folder_obj: ProjectData = get_run_folder_obj_from_analysis_id(
        project_id=project_id,
        analysis_id=analysis_id
    )

    # Get the analysis output path
    logger.info("Collecting output data objects")
    bclconvert_output_folder_id, bclconvert_output_data_list = get_bclconvert_outputs_from_analysis_id(
        project_id=project_id,
        analysis_id=analysis_id
    )

    # Get the output folder object
    logger.info("Get bclconvert output folder object")
    bclconvert_output_folder_obj = get_project_data_obj_by_id(
        project_id=project_id,
        data_id=bclconvert_output_folder_id
    )

    # Now we have the bsshoutput.json, we can filter the output_data_list to just be those under 'output/'
    # We also collect the bcl convert output object to get relative files from this directory
    # Such as the IndexMetricsOut.bin file in the Reports Directory
    # Which we also copy over to the interops directory
    bcl_convert_output_path = Path(bclconvert_output_folder_obj.data.details.path) / "output"
    bcl_convert_output_fol_id = get_project_data_folder_id_from_project_id_and_path(
        project_id,
        bcl_convert_output_path,
        create_folder_if_not_found=False
    )
    bcl_convert_output_obj = get_project_data_obj_by_id(
        project_id=project_id,
        data_id=bcl_convert_output_fol_id
    )

    # Get the interop files
    interop_files = get_interop_files_from_run_folder(
        input_run_folder_obj
    )

    # Convert interop files to uris and add to the run manifest
    interops_as_uri = list(
        map(
            lambda interop_iter: (
                convert_project_id_and_data_path_to_uri(
                    project_id,
                    Path(interop_iter.data.details.path),
                    data_type=FILE_DATA_TYPE
                )
            ),
            interop_files
        )
    )

    # Check IndexMetricsOut.bin exists in the Interop files
    # Otherwise copy across from Reports output from BCLConvert
    index_metrics_uri = None
    try:
        _ = next(
            filter(
                lambda interop_uri_iter: Path(urlparse(interop_uri_iter).path).name == 'IndexMetricsOut.bin',
                interops_as_uri
            )
        )
    except StopIteration:
        # Add 'IndexMetricsOut.bin' from reports directory to the interop files
        index_metrics_uri = convert_project_id_and_data_path_to_uri(
            project_id,
            Path(bcl_convert_output_obj.data.details.path) / "Reports" / "IndexMetricsOut.bin",
            data_type="FILE"
        )

    logger.info("Outputting the manifest and fastq list rows")

    return {
        "icav2CopyJobList": [
            # Samples and Report directories
            {
                "sourceUriList": [
                    # Samples
                    convert_project_id_and_data_path_to_uri(
                        project_id=bcl_convert_output_obj.project_id,
                        data_path=bcl_convert_output_obj.data.details.path + "Samples",
                        data_type=FOLDER_DATA_TYPE,
                    ),
                    # Reports
                    convert_project_id_and_data_path_to_uri(
                        project_id=bcl_convert_output_obj.project_id,
                        data_path=bcl_convert_output_obj.data.details.path + "Reports",
                        data_type="FOLDER",
                    )
                ],
                "destinationUri": convert_project_id_and_data_path_to_uri(
                    project_id=dest_project_data_obj.project_id,
                    data_path=Path(dest_project_data_obj.data.details.path),
                    data_type="FOLDER",
                    uri_type=ICAV2_URI_SCHEME
                ),
            },
            # InterOp Directory (copied on a per-file level)
            {
                "sourceUriList": interops_as_uri + ([index_metrics_uri] if index_metrics_uri else []),
                "destinationUri": convert_project_id_and_data_path_to_uri(
                    project_id=dest_project_data_obj.project_id,
                    data_path=dest_project_data_obj.data.details.path + "InterOp",
                    data_type="FOLDER",
                    uri_type=ICAV2_URI_SCHEME
                )
            }
        ]
    }


# if __name__ == "__main__":
#     from os import environ
#     environ['AWS_PROFILE'] = 'umccr-development'
#     environ['AWS_REGION'] = 'ap-southeast-2'
#     environ['ICAV2_BASE_URL'] = "https://ica.illumina.com/ica/rest"
#     environ['ICAV2_ACCESS_TOKEN_SECRET_ID'] = "ICAv2JWTKey-umccr-prod-service-dev"
#
#     print(
#         json.dumps(
#             handler(
#                 {
#                     "projectId": "a7c67a80-c8f2-4348-adec-3a5a073d1d55",
#                     "analysisId": "ecb3992e-06e3-4cc9-bc1f-82bcd35600d1",
#                     "outputUri": "s3://pipeline-dev-cache-503977275616-ap-southeast-2/byob-icav2/development/primary/241024_A00130_0336_BHW7MVDSXC/202506117adb9eb7/"
#                 },
#                 None
#             ),
#             indent=4
#         )
#     )
#
#     # {
#     #     "icav2CopyJobList": [
#     #         {
#     #             "sourceUriList": [
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-analyses/241024_A00130_0336_BHW7MVDSXC_005f29_6b606d-ecb3992e-06e3-4cc9-bc1f-82bcd35600d1/output/Samples/",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-analyses/241024_A00130_0336_BHW7MVDSXC_005f29_6b606d-ecb3992e-06e3-4cc9-bc1f-82bcd35600d1/output/Reports/"
#     #             ],
#     #             "destinationUri": "icav2://ea19a3f5-ec7c-4940-a474-c31cd91dbad4/primary/241024_A00130_0336_BHW7MVDSXC/202506117adb9eb7/"
#     #         },
#     #         {
#     #             "sourceUriList": [
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/AlignmentMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/BasecallingMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/ErrorMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/CorrectedIntMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/EmpiricalPhasingMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/ExtendedTileMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/OpticalModelMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/IndexMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/PFGridMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/ExtractionMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/TileMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/QMetrics2030Out.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/QMetricsByLaneOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/SummaryRunMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/ImageMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/FWHMGridMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/QMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/EventMetricsOut.bin",
#     #                 "icav2://a7c67a80-c8f2-4348-adec-3a5a073d1d55/ilmn-runs/bssh_aps2-sh-prod_4505508/InterOp/RegistrationMetricsOut.bin"
#     #             ],
#     #             "destinationUri": "icav2://ea19a3f5-ec7c-4940-a474-c31cd91dbad4/primary/241024_A00130_0336_BHW7MVDSXC/202506117adb9eb7/InterOp/"
#     #         }
#     #     ]
#     # }
