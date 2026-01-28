import os

MODELS_DIR = 'models'
MODELS_CONFIG = {
    'vgg16': {
        'path': os.path.join(MODELS_DIR, 'vgg16_best_fold_3.h5'),
        'name': 'VGG16 (Transfer Learning)',
        'preprocess': 'vgg16'
    },
    'custom_cnn': {
        'path': os.path.join(MODELS_DIR, 'custom_cnn_fold_4.h5'),
        'name': 'Custom CNN (Lightweight)',
        'preprocess': 'rescale'
    }
}
IMG_SIZE = (224, 224)
DATABASE_PATH = 'faceid.db'
DATA_DIR = 'data'
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
DATASETS_DIR = os.path.join(DATA_DIR, 'datasets')
RAW_VIDEOS_DIR = os.path.join(DATA_DIR, 'raw_videos')
METRICS_DEFAULT = os.path.join(MODELS_DIR, 'metrics.json')
