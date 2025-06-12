#!/usr/bin/env python3

"""
Large hacky script to get the copy manifest AND the fastq list rows

At a later stage, once the 'clag' glue services instead listen to fastq manager events,
We can instead remove the fastq list row gz generation
"""

#!/usr/bin/env python3

"""
Handle the workflow session object

The BCLConversion complete object looks something like this:

{
  "project_id": "a1234567-1234-1234-1234-1234567890ab",  // The output project id
  "analysis_id": "b1234567-1234-1234-1234-1234567890ab", // The analysis id
  "instrument_run_id": "231116_A01052_0172_BHVLM5DSX7",    // The instrument run id
  "output_uri": "icav2://7595e8f2-32d3-4c76-a324-c6a85dae87b5/ilmn_primary/231116_A01052_0172_BHVLM5DSX7/abcd1234/"  // A prefix to where the output should be stored
}

While the outputs will look something like this:

{
    "instrument_run_id": "231116_A01052_0172_BHVLM5DSX7",
    "output_uri": "icav2://7595e8f2-32d3-4c76-a324-c6a85dae87b5/ilmn_primary/231116_A01052_0172_BHVLM5DSX7/20240207abcduuid/",
    "fastq_list_rows_b64gz": "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",  // pragma: allowlist secret
}

"""


# Imports
import json
from pathlib import Path
from urllib.parse import urlparse
import logging

# Set ICAv2 environment variables
from icav2_tools import set_icav2_env_vars

# Wrapica imports
from wrapica.enums import DataType, UriType
from wrapica.libica_models import ProjectData
from wrapica.project_data import (
    get_project_data_obj_by_id,
    read_icav2_file_contents_to_string,
    get_project_data_folder_id_from_project_id_and_path,
    convert_project_id_and_data_path_to_uri,
    convert_uri_to_project_data_obj
)

# Local imports
from bssh_manager_tools.utils.icav2_analysis_helpers import (
    get_bssh_json_file_id_from_analysis_output_list,
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
                    data_type=DataType.FILE
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
            data_type=DataType.FILE
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
                        data_type=DataType.FOLDER,
                    ),
                    # Reports
                    convert_project_id_and_data_path_to_uri(
                        project_id=bcl_convert_output_obj.project_id,
                        data_path=bcl_convert_output_obj.data.details.path + "Reports",
                        data_type=DataType.FOLDER,
                    )
                ],
                "destinationUri": convert_project_id_and_data_path_to_uri(
                    project_id=dest_project_data_obj.project_id,
                    data_path=Path(dest_project_data_obj.data.details.path),
                    data_type=DataType.FOLDER,
                    uri_type=UriType.ICAV2
                ),
            },
            # InterOp Directory (copied on a per-file level)
            {
                "sourceUriList": interops_as_uri + ([index_metrics_uri] if index_metrics_uri else []),
                "destinationUri": convert_project_id_and_data_path_to_uri(
                    project_id=dest_project_data_obj.project_id,
                    data_path=dest_project_data_obj.data.details.path + "InterOp",
                    data_type=DataType.FOLDER,
                    uri_type=UriType.ICAV2
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
