import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as mobilenet from '@tensorflow-models/mobilenet';
import Link from 'next/link'; // Added missing import for Link
import { createClient } from '@supabase/supabase-js';
import { CUISINES } from '../lib/cuisines'; // Import the CUISINES array (optional validation)

export default function VisionFood() {
  const [imageBase64, setImageBase64] = useState('');
  const [labels, setLabels] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 10; // Results per page

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'your_supabase_project_url';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your_supabase_anon_key';
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load the MobileNet model on component mount
  useEffect(() => {
    const loadModel = async () => {
      try {
        setLoading(true);
        await tf.ready(); // Ensure TensorFlow.js is ready
        const loadedModel = await mobilenet.load(); // Load MobileNet model
        setModel(loadedModel);
        setLoading(false);
        console.log('MobileNet model loaded');
      } catch (err) {
        setError('Failed to load model: ' + (err.message || 'Unknown error'));
        setLoading(false);
      }
    };
    loadModel();
  }, []);

  // Load file into base64 and display image preview
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fr = new FileReader();
    fr.onload = () => {
      const result = fr.result;
      const b64 = result.split(',')[1]; // Extract base64 data after the comma
      setImageBase64(b64);
    };
    fr.readAsDataURL(file);
  };

  // Classify the image using MobileNet and fetch restaurants
  const onClassify = async () => {
    if (!imageBase64 || !model) return;

    setLoading(true);
    setError(null);
    setRestaurants([]); // Clear previous restaurant results
    setCurrentPage(1); // Reset to first page on new classification

    try {
      // Create an image element to pass to MobileNet
      const img = new Image();
      img.src = `data:image/jpeg;base64,${imageBase64}`;
      await new Promise((resolve) => (img.onload = resolve)); // Wait for image to load

      // Classify the image
      const predictions = await model.classify(img);
      const detectedLabels = predictions.map((pred) => pred.className.split(', ')[0]); // Extract primary label

      // Use detected labels directly as potential cuisines
      // Filter to include only labels that match entries in CUISINES (case-insensitive)
      const potentialCuisines = detectedLabels.filter(label =>
        CUISINES.some(cuisine => cuisine.toLowerCase() === label.toLowerCase())
      );

      // Set labels for display (use potential cuisines if available, otherwise raw detected labels)
      const finalLabels = potentialCuisines.length > 0 ? potentialCuisines : detectedLabels.slice(0, 5);
      setLabels(finalLabels);

      // If potential cuisines are detected, fetch restaurants from Supabase
      if (potentialCuisines.length > 0) {
        const cuisinesArray = potentialCuisines; // Array of potential cuisines like ["Ice Cream", "Pizza"]
        try {
          // Query Supabase for restaurants matching any of the detected cuisines
          const { data, error } = await supabase
            .from('restaurants') // Adjust table name if different
            .select('restaurant_id, restaurant_name, address, cuisines, city, aggregate_rating');

          if (error) {
            throw new Error('Supabase query failed: ' + error.message);
          }

          if (data) {
            // Filter restaurants where any detected cuisine is in the restaurant's cuisines list (case-insensitive)
            const matchedRestaurants = data.filter((restaurant) => {
              const restaurantCuisines = restaurant.cuisines
                .split(',')
                .map((c) => c.trim().toLowerCase());
              return cuisinesArray.some((cuisine) =>
                restaurantCuisines.includes(cuisine.toLowerCase())
              );
            });

            setTotalCount(matchedRestaurants.length);
            setTotalPages(Math.ceil(matchedRestaurants.length / limit) || 1);
            // Display only the first page initially
            const startIndex = 0;
            const endIndex = startIndex + limit;
            setRestaurants(matchedRestaurants.slice(startIndex, endIndex));
          }
        } catch (err) {
          setError('Failed to fetch restaurants: ' + (err.message || 'Unknown error'));
        }
      }
    } catch (err) {
      setError('Classification failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    // Fetch restaurants for the new page (manual pagination since we have all data)
    try {
      const startIndex = (newPage - 1) * limit;
      const endIndex = startIndex + limit;
      
      // Since we already fetched all matching restaurants, slice them for pagination
      // Re-fetching from Supabase isn't needed unless data changes
      const cuisinesArray = labels.length > 0 ? labels : [];
      if (cuisinesArray.length > 0) {
        supabase
          .from('restaurants')
          .select('restaurant_id, restaurant_name, address, cuisines, city, aggregate_rating')
          .then(({ data, error }) => {
            if (error) {
              setError('Failed to fetch restaurants for pagination: ' + error.message);
              return;
            }

            if (data) {
              const matchedRestaurants = data.filter((restaurant) => {
                const restaurantCuisines = restaurant.cuisines
                  .split(',')
                  .map((c) => c.trim().toLowerCase());
                return cuisinesArray.some((cuisine) =>
                  restaurantCuisines.includes(cuisine.toLowerCase())
                );
              });

              setTotalCount(matchedRestaurants.length);
              setTotalPages(Math.ceil(matchedRestaurants.length / limit) || 1);
              setRestaurants(matchedRestaurants.slice(startIndex, endIndex));
            }
          });
      }
    } catch (err) {
      setError('Pagination error: ' + (err.message || 'Unknown error'));
    }
  };

  // Function to normalize text for display (fix encoding issues)
  const normalizeText = (text) => {
    if (!text) return 'N/A';
    try {
      // Attempt to fix encoding by normalizing and replacing known problematic sequences
      let normalized = text.normalize('NFC');
      // Replace "�" and other artifacts with likely intended characters or remove them
      normalized = normalized.replace(/�/g, 'í'); // Common replacement for "Brasília"
      // Additional fallback: Remove non-ASCII characters if still problematic (last resort)
      if (normalized.includes('�')) {
        normalized = normalized.replace(/[^\x00-\x7F]/g, '?');
      }
      return normalized;
    } catch {
      // Fallback to ASCII-only text if normalization fails
      return text.replace(/[^\x00-\x7F]/g, '?') || 'N/A';
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Vision-Based Food Search</h1>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Pick a Food Image:</h2>
        <input
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
      </div>

      {imageBase64 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Preview:</h2>
          <img
            src={`data:image/jpeg;base64,${imageBase64}`}
            alt="Preview"
            className="max-w-full max-h-48 rounded-md shadow-sm"
          />
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={onClassify}
          disabled={!imageBase64 || !model || loading}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {loading ? 'Classifying...' : 'Classify'}
        </button>
      </div>

      {error && (
        <p className="mb-4 text-red-500 text-sm">Error: {error}</p>
      )}

      {labels.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Detected Labels/Cuisines:</h2>
          <ul className="list-disc pl-5 space-y-1 text-gray-600">
            {labels.map((lbl, index) => (
              <li key={index}>{lbl}</li>
            ))}
          </ul>
        </div>
      )}

      {restaurants.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 text-gray-700">Matching Restaurants:</h2>
          <p className="text-gray-600 mb-2">
            Showing {restaurants.length} of {totalCount} results
          </p>
          <div className="space-y-4">
            {restaurants.map((r) => (
              <div
                key={r.restaurant_id}
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow bg-white"
              >
                <Link href={`/restaurants/${r.restaurant_id}`} className="block text-blue-600 hover:underline">
                  <div className="font-semibold text-lg">{normalizeText(r.restaurant_name)}</div>
                  <div className="text-sm text-gray-700 mt-1">Address: {normalizeText(r.address) || 'N/A'}</div>
                  <div className="text-sm text-gray-700">Cuisines: {normalizeText(r.cuisines) || 'N/A'}</div>
                  <div className="text-sm text-gray-700">City: {normalizeText(r.city) || 'N/A'}</div>
                  <div className="text-sm text-gray-700 flex items-center mt-1">
                    Rating:{" "}
                    {r.aggregate_rating &&
                    r.aggregate_rating !== "0" &&
                    r.aggregate_rating !== 0 ? (
                      <>
                        {r.aggregate_rating}
                        <span className="ml-1 text-yellow-400">★</span>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </div>
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {labels.length > 0 && restaurants.length === 0 && (
        <p className="mb-4 text-gray-600">No restaurants found matching the detected cuisines.</p>
      )}
    </div>
  );
}