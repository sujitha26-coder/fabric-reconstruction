from pathlib import Path


IMAGE_EXTENSIONS = {'.bmp', '.jpeg', '.jpg', '.png', '.tif', '.tiff', '.webp'}


def get_dataset_summary(dataset_root: Path) -> dict[str, object]:
    if not dataset_root.is_dir():
        raise FileNotFoundError(f'Dataset directory does not exist: {dataset_root}')

    categories = []
    for category_dir in sorted(dataset_root.iterdir()):
        if not category_dir.is_dir():
            continue

        image_count = sum(
            1
            for path in category_dir.rglob('*')
            if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
        )
        categories.append({'name': category_dir.name, 'image_count': image_count})

    return {
        'categories': categories,
        'total_images': sum(category['image_count'] for category in categories),
    }
