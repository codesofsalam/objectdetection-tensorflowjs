import { useState, useEffect, useRef } from "react";
import * as mobilenet from "@tensorflow-models/mobilenet";

const App = () => {
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [imageURL, setImageURL] = useState(null);
  const [results, setResults] = useState([]);
  const [history, setHistory] = useState([]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [error, setError] = useState(null);

  const imageRef = useRef();
  const textInputRef = useRef();
  const fileInputRef = useRef();

  const loadModel = async () => {
    setIsModelLoading(true);
    try {
      const loadedModel = await mobilenet.load();
      setModel(loadedModel);
      setError(null);
    } catch (error) {
      setError("Failed to load TensorFlow model: " + error.message);
    } finally {
      setIsModelLoading(false);
    }
  };

  const uploadImage = (e) => {
    const { files } = e.target;
    if (files.length > 0) {
      const url = URL.createObjectURL(files[0]);
      setImageURL(url);
      setResults([]);
      setIsImageLoaded(false);
      setError(null);
    } else {
      setImageURL(null);
    }
  };

  const identify = async () => {
    if (!model) {
      setError("Model not loaded yet");
      return;
    }

    if (!imageRef.current) {
      setError("No image selected");
      return;
    }

    if (!isImageLoaded) {
      setError("Please wait for image to load completely");
      return;
    }

    try {
      setError(null);
      const predictions = await model.classify(imageRef.current);
      if (predictions && predictions.length > 0) {
        setResults(predictions);
      } else {
        setError("No predictions returned from model");
      }
    } catch (error) {
      setError("Error identifying image: " + error.message);
      console.error("Classification error:", error);
    }
  };

  const handleOnChange = (e) => {
    const url = e.target.value.trim();
    if (url) {
      setImageURL(url);
      setResults([]);
      setIsImageLoaded(false);
      setError(null);
    } else {
      setImageURL(null);
    }
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
    setError(null);
  };

  const handleImageError = () => {
    setError("Failed to load image. Please check the URL or try another image.");
    setIsImageLoaded(false);
  };

  useEffect(() => {
    loadModel();
  }, []);

  useEffect(() => {
    if (imageURL) {
      setHistory((prev) => [imageURL, ...prev]);
    }
  }, [imageURL]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Image Identification</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={uploadImage}
            ref={fileInputRef}
          />
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload Image
          </button>
          <span>OR</span>
          <input
            type="text"
            placeholder="Paste Image URL"
            className="flex-1 p-2 border rounded"
            ref={textInputRef}
            onChange={handleOnChange}
          />
        </div>

        <div className="space-y-4">
          <div className="border rounded p-4">
            {imageURL && (
              <img
                src={imageURL}
                alt="Preview"
                crossOrigin="anonymous"
                ref={imageRef}
                className="max-w-full h-auto"
                onLoad={handleImageLoad}
                onError={handleImageError}
              />
            )}
          </div>

          {results.length > 0 && (
            <div className="space-y-2">
              {results.map((result, index) => (
                <div
                  key={result.className}
                  className="p-3 border rounded bg-gray-50"
                >
                  <div className="font-medium">
                    {result.className}
                    {index === 0 && (
                      <span className="ml-2 text-green-600">(Best Guess)</span>
                    )}
                  </div>
                  <div className="text-gray-600">
                    Confidence: {(result.probability * 100).toFixed(2)}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {imageURL && (
          <button
            className="w-full py-2 bg-green-500 text-white rounded disabled:opacity-50"
            onClick={identify}
            disabled={!isImageLoaded || isModelLoading}
          >
            {isModelLoading ? "Loading Model..." : "Identify Image"}
          </button>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Recent Images</h2>
          <div className="grid grid-cols-4 gap-4">
            {history.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt="Recent"
                className="w-full h-24 object-cover cursor-pointer rounded"
                onClick={() => setImageURL(image)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
