#!/usr/bin/env python3

"""
Very simple script, given the instrument run id, generate a tags construct
"""

from typing import Dict

def handler(event, context) -> Dict[str, Dict[str, str]]:
    """
    Generate the tags construct for the given instrument run id
    :param event:
    :param context:
    :return:
    """
    return {
        "tags": {
            "instrumentRunId": event.get('instrumentRunId')
        }
    }
