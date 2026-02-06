import os

import json

MODELS_DIR = 'models'
MODELS_CONFIG_PATH = os.path.join(MODELS_DIR, 'models_config.json')

# Default configuration
DEFAULT_MODELS_CONFIG = {
    'vgg16': {
        'path': os.path.join(MODELS_DIR, 'vgg16_best_fold_3.h5'),
        'name': 'VGG16 (Transfer Learning)',
        'preprocess': 'vgg16'
    },
    'custom_cnn': {
        'path': os.path.join(MODELS_DIR, 'custom_cnn_fold_3.h5'),
        'name': 'Custom CNN (Lightweight)',
        'preprocess': 'rescale'
    }
}

def load_models_config():
    if os.path.exists(MODELS_CONFIG_PATH):
        try:
            with open(MODELS_CONFIG_PATH, 'r') as f:
                return json.load(f)
        except:
            pass
    return DEFAULT_MODELS_CONFIG


MODELS_CONFIG = load_models_config()
IMG_SIZE = (224, 224)
DATABASE_PATH = 'faceid.db'
DATA_DIR = 'data'
PROCESSED_DIR = os.path.join(DATA_DIR, 'processed')
DATASETS_DIR = os.path.join(DATA_DIR, 'datasets')
RAW_VIDEOS_DIR = os.path.join(DATA_DIR, 'raw_videos')
METRICS_DEFAULT = os.path.join(MODELS_DIR, 'metrics.json')
