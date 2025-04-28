import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Detail() {
  const { query } = useRouter();
  const { id } = query;
  const [r, setR] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const fetchRestaurantData = async () => {
      try {
        const response = await fetch(`/api/restaurants/${id}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        const { data } = await response.json();
        setR(data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load restaurant data');
      }
    };

    fetchRestaurantData();
  }, [id]);

  // Function to normalize text for display (fix encoding issues)
  const normalizeText = (text) => {
    if (!text) return 'N/A';
    const textStr = typeof text === 'string' ? text : String(text || '');
    try {
      let normalized = textStr.normalize('NFC');
      normalized = normalized.replace(/�/g, 'í');
      if (normalized.includes('�')) {
        normalized = normalized.replace(/[^\x00-\x7F]/g, '?');
      }
      return normalized;
    } catch {
      return textStr.replace(/[^\x00-\x7F]/g, '?') || 'N/A';
    }
  };

  if (error) return <p className="text-red-600 p-5">{error}</p>;
  if (!r) return <p className="text-gray-600 p-5">Loading…</p>;

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">{normalizeText(r.restaurant_name)}</h1>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <strong className="text-gray-700 font-semibold">Address:</strong>{" "}
              <span className="text-gray-600">
                {[
                  normalizeText(r.address),
                  normalizeText(r.locality_verbose),
                  normalizeText(r.city),
                  normalizeText(r.country_code)
                ]
                  .filter(Boolean)
                  .join(", ") || "N/A"}
              </span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Cuisines:</strong>{" "}
              <span className="text-gray-600">
                {typeof r.cuisines === 'string'
                  ? normalizeText(r.cuisines)
                  : Array.isArray(r.cuisines)
                  ? r.cuisines.map(cuisine => normalizeText(cuisine)).join(", ")
                  : "N/A"}
              </span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Avg cost for two:</strong>{" "}
              <span className="text-gray-600">
                {normalizeText(r.currency) || '$'} {r.average_cost_for_two || "N/A"}
              </span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Rating:</strong>{" "}
              <span className="text-gray-600">
                {r.aggregate_rating && r.aggregate_rating !== "0" && r.aggregate_rating !== 0
                  ? <>
                      {r.aggregate_rating} ({normalizeText(r.rating_text) || "N/A"})
                      <span className="ml-1 text-yellow-400">★</span>
                    </>
                  : "N/A"}
              </span>
            </div>
          </div>
          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <strong className="text-gray-700 font-semibold">Votes:</strong>{" "}
              <span className="text-gray-600">{r.votes || "N/A"}</span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Table booking:</strong>{" "}
              <span className="text-gray-600">{r.has_table_booking ? "Yes" : "No"}</span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Online delivery:</strong>{" "}
              <span className="text-gray-600">{r.has_online_delivery ? "Yes" : "No"}</span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Price range:</strong>{" "}
              <span className="text-gray-600">{r.price_range || "N/A"}</span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Longitude:</strong>{" "}
              <span className="text-gray-600">{r.longitude || "N/A"}</span>
            </div>
            <div>
              <strong className="text-gray-700 font-semibold">Latitude:</strong>{" "}
              <span className="text-gray-600">{r.latitude || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}