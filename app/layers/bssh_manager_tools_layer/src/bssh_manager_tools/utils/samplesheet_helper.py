#!/usr/bin/env python3

"""
Reads in a v2 samplesheet object from a file
"""
# Standard imports
from io import StringIO
from typing import Dict

# UMCCR Libraries
from v2_samplesheet_maker.functions.v2_samplesheet_reader import v2_samplesheet_reader
from wrapica.project_data import read_icav2_file_contents_to_string

# Logger
from ..utils.logger import get_logger

# Set logger
logger = get_logger()


def read_v2_samplesheet(project_id: str, data_id: str) -> Dict:
    """
    Given a v2 samplesheet path, read in the file as a v2 samplesheet (we first convert to json)

    :param project_id:
    :param data_id:

    :return: A dictionary

    :Example:
    /home/alexiswl/UMCCR/GitHub/v2-bclconvert-samplesheet-maker/venv/bin/python -m v2_samplesheet_maker.modules.v2_samplesheet_reader
    {
        "Header": {
            "FileFormatVersion": "2",
            "RunName": "Tsqn-NebRNA231113-MLeeSTR_16Nov23",
            "InstrumentType": "NovaSeq"
        },
        "Reads": {
            "Read1Cycles": "151",
            "Read2Cycles": "151",
            "Index1Cycles": "10",
            "Index2Cycles": "10"
        },
        "BCLConvert_Settings": {
            "MinimumTrimmedReadLength": "35",
            "MinimumAdapterOverlap": "3",
            "MaskShortReads": "35"
        },
        "BCLConvert_Data": [
            {
                "Lane": 1,
                "Sample_ID": "L2301368",
                "index": "GACTGAGTAG",
                "index2": "CACTATCAAC",
                "OverrideCycles": "U7N1Y143;I10;I10;U7N1Y143",
                "AdapterRead1": "AGATCGGAAGAGCACACGTCTGAACTCCAGTCA",
                "AdapterRead2": "AGATCGGAAGAGCGTCGTGTAGGGAAAGAGTGT",
                "AdapterBehavior": "trim"
            },
            {
                "Lane": 1,
                "Sample_ID": "L2301369",
                "index": "AGTCAGACGA",
                "index2": "TGTCGCTGGT",
                "OverrideCycles": "U7N1Y143;I10;I10;U7N1Y143",
                "AdapterRead1": "AGATCGGAAGAGCACACGTCTGAACTCCAGTCA",
                "AdapterRead2": "AGATCGGAAGAGCGTCGTGTAGGGAAAGAGTGT",
                "AdapterBehavior": "trim"
            },
           ...
        ],
        "Cloud_Settings": {
            "GeneratedVersion": "0.0.0",
            "Cloud_Workflow": "ica_workflow_1",
            "BCLConvert_Pipeline": "urn:ilmn:ica:pipeline:bf93b5cf-cb27-4dfa-846e-acd6eb081aca#BclConvert_v4_2_7"
        },
        "Cloud_Data": [
            {
                "Sample_ID": "L2301321",
                "LibraryName": "L2301321_CCGCGGTT_CTAGCGCT",
                "LibraryPrepKitName": "TsqSTR"
            },
            {
                "Sample_ID": "L2301322",
                "LibraryName": "L2301322_TTATAACC_TCGATATC",
                "LibraryPrepKitName": "TsqSTR"
            },
            ...
        ]
    }
    """

    return v2_samplesheet_reader(
        StringIO(
            read_icav2_file_contents_to_string(
                project_id=project_id,
                data_id=data_id
            )
        )
    )
