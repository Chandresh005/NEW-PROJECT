import cv2


# Physical size of the printed ArUco marker.
# IMPORTANT:
# Measure your actual printed marker with a ruler.
# Example: 40 mm x 40 mm.
MARKER_SIZE_MM = 40.0


def detect_aruco_scale(image_path: str):
    """
    Detect an ArUco marker and calculate pixels-per-mm.

    Returns:
        float: pixels per millimeter
        None: if no suitable marker is detected
    """

    image = cv2.imread(image_path)

    if image is None:
        return None

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY,
    )

    # Use a standard ArUco dictionary.
    dictionary = cv2.aruco.getPredefinedDictionary(
        cv2.aruco.DICT_4X4_50
    )

    parameters = cv2.aruco.DetectorParameters()

    detector = cv2.aruco.ArucoDetector(
        dictionary,
        parameters,
    )

    corners, ids, _ = detector.detectMarkers(
        gray
    )

    if ids is None or len(corners) == 0:
        return None

    # Use the first detected marker.
    marker_corners = corners[0][0]

    # Four corners:
    # top-left, top-right, bottom-right, bottom-left
    top_left = marker_corners[0]
    top_right = marker_corners[1]
    bottom_right = marker_corners[2]
    bottom_left = marker_corners[3]

    # Calculate the four side lengths.
    top = cv2.norm(
        top_left,
        top_right,
    )

    right = cv2.norm(
        top_right,
        bottom_right,
    )

    bottom = cv2.norm(
        bottom_right,
        bottom_left,
    )

    left = cv2.norm(
        bottom_left,
        top_left,
    )

    average_pixel_size = (
        top
        + right
        + bottom
        + left
    ) / 4.0

    if average_pixel_size <= 0:
        return None

    pixels_per_mm = (
        average_pixel_size
        / MARKER_SIZE_MM
    )

    return float(pixels_per_mm)