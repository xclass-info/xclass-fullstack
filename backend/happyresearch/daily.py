"""Daily.co video rooms for approved 1-on-1 sessions. The API key lives only
on the server (DAILY_API_KEY), never in the website's code."""
import time

import requests
from flask import current_app

from .errors import ApiError

ROOM_DAYS = 30


def create_room():
    """Create a two-person room and return its URL. Daily picks a random,
    unguessable room name. Raises ApiError if the room can't be made."""
    key = current_app.config.get("DAILY_API_KEY")
    if not key:
        raise ApiError(503, "VIDEO_NOT_CONFIGURED", "Video meetings aren't set up yet.")
    try:
        res = requests.post(
            "https://api.daily.co/v1/rooms",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "properties": {
                    "enable_chat": True,
                    "enable_screenshare": True,
                    "max_participants": 2,
                    "exp": int(time.time()) + ROOM_DAYS * 24 * 60 * 60,
                }
            },
            timeout=15,
        )
        if not res.ok:
            current_app.logger.error(
                "daily.co room creation failed: %s %s", res.status_code, res.text[:500]
            )
            url = None
        else:
            url = res.json().get("url")
    except (requests.RequestException, ValueError):
        current_app.logger.exception("daily.co room request failed")
        url = None
    if not url:
        raise ApiError(502, "MEETING_ROOM_FAILED", "Couldn't create the video meeting room. Please try again.")
    return url
