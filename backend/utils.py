import qrcode
import qrcode.image.svg
from io import BytesIO
from urllib.parse import quote


def generate_google_maps_qr(origin, destination, travelmode='driving'):
    """
    Generate QR code for Google Maps directions

    Args:
        origin (str): Starting location
        destination (str): Destination location
        travelmode (str): 'driving', 'walking', 'bicycling', or 'transit'

    Returns:
        dict: {'svg': str, 'url': str} or None if failed
    """
    try:
        # Encode both origin and destination for URL safety
        encoded_origin = quote(origin)
        encoded_destination = quote(destination)

        # Build Google Maps directions URL
        google_maps_url = (
            f"https://www.google.com/maps/dir/?api=1"
            f"&origin={encoded_origin}"
            f"&destination={encoded_destination}"
            f"&travelmode={travelmode}"
        )

        print(f"QR Code URL being generated: {google_maps_url}")

        # Generate QR code using qrcode library
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(google_maps_url)
        qr.make(fit=True)

        # Generate SVG
        factory = qrcode.image.svg.SvgPathImage
        img = qr.make_image(fill_color="black", back_color="white", image_factory=factory)

        buffer = BytesIO()
        img.save(buffer)
        buffer.seek(0)

        svg_string = buffer.getvalue().decode('utf-8')

        print(f"QR Code generated successfully, SVG length: {len(svg_string)}")

        return {
            'svg': svg_string,
            'url': google_maps_url,
        }

    except Exception as e:
        print(f"Error generating QR code: {e}")
        import traceback
        traceback.print_exc()
        return None