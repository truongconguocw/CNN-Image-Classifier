import numpy as np
import tensorflow as tf
import cv2
import os
from PIL import Image
from ..config import MODELS_CONFIG, IMG_SIZE

loaded_models = {}

def load_model_instance(model_id):
    if model_id in loaded_models:
        return loaded_models[model_id]
    config = MODELS_CONFIG.get(model_id)
    if not config or not os.path.exists(config['path']):
        return None
    model = tf.keras.models.load_model(config['path'])
    loaded_models[model_id] = model
    return model

def preprocess_face(face_img, model_id):
    img_rgb = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
    img = Image.fromarray(img_rgb).resize(IMG_SIZE)
    img_array = np.array(img)
    img_array = np.expand_dims(img_array, axis=0)
    config = MODELS_CONFIG.get(model_id)
    if config['preprocess'] == 'vgg16':
        img_array = tf.keras.applications.vgg16.preprocess_input(img_array)
    else:
        img_array = img_array.astype('float32') / 255.0
    return img_array

def get_face_embedding(img_cv, model_id):
    model = load_model_instance(model_id)
    if not model:
        return None
    intermediate_model = tf.keras.Model(inputs=model.input, outputs=model.layers[-2].output)
    processed = preprocess_face(img_cv, model_id)
    embedding = intermediate_model.predict(processed)
    return embedding[0]
