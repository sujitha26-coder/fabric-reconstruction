from pathlib import Path

from PIL import Image


PROJECT_ROOT = Path(__file__).resolve().parent
DATASET_DIR = PROJECT_ROOT / 'dataset' / 'cleaned'
IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.bmp', '.webp', '.tif', '.tiff'}


def main() -> int:
    print(f'Dataset location: {DATASET_DIR}')
    if not DATASET_DIR.is_dir():
        print('ERROR: Dataset folder not found. Check its location.')
        return 1

    images = [
        path
        for path in DATASET_DIR.rglob('*')
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    ]
    print(f'Image files found: {len(images)}')
    if not images:
        print('ERROR: No supported images found in this folder.')
        return 1

    readable = 0
    unreadable_paths = []
    for path in images:
        try:
            with Image.open(path) as image:
                image.verify()
            readable += 1
        except (Image.DecompressionBombError, OSError, SyntaxError, ValueError):
            unreadable_paths.append(path)

    print(f'Readable images: {readable}')
    print(f'Unreadable images: {len(unreadable_paths)}')
    for path in unreadable_paths:
        print(f'Unreadable: {path}')

    return 0 if readable else 1


if __name__ == '__main__':
    raise SystemExit(main())
