import { useState } from "react";
import Link from "next/link";

export default function GeoSearch() {
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [radius, setRadius] = useState("3");
  const [results, setResults] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false); // Added loading state
  const limit = 10; // Results per page

  const doSearch = async (page = 1) => {
    setIsLoading(true); // Set loading to true during API call
    setErrorMsg("");
    setResults([]);

    try {
      const response = await fetch("/api/geo-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lat, lon, radius, page, limit }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMsg(data.error || "An error occurred");
        return;
      }

      setResults(data.results);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Fetch error:", error);
      setErrorMsg("Failed to perform search");
    } finally {
      setIsLoading(false); // Reset loading state after API call
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    doSearch(newPage);
  };

  // Function to normalize text for display (fix encoding issues)
  const normalizeText = (text) => {
    if (!text) return 'N/A';
    try {
      let normalized = text.normalize('NFC');
      normalized = normalized.replace(/�/g, 'í');
      if (normalized.includes('�')) {
        normalized = normalized.replace(/[^\x00-\x7F]/g, '?');
      }
      return normalized;
    } catch {
      return text.replace(/[^\x00-\x7F]/g, '?') || 'N/A';
    }
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Geo-Radius Search
      </h1>

      {/* Inputs */}
      <div className="mb-6 flex flex-wrap gap-2">
        <input
          className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Latitude"
          value={lat}
          onChange={(e) => setLat(e.target.value)}
        />
        <input
          className="w-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Longitude"
          value={lon}
          onChange={(e) => setLon(e.target.value)}
        />
        <input
          className="w-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Radius km"
          value={radius}
          onChange={(e) => setRadius(e.target.value)}
        />
        <button
          onClick={() => doSearch(1)}
          disabled={isLoading} // Disable search button during loading
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Searching..." : "Search"}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && <div className="mb-4 text-red-500 text-sm">{errorMsg}</div>}

      {/* Results */}
      {isLoading ? (
        <p className="text-gray-600 mb-6">Loading results...</p> // Show loading message
      ) : results.length === 0 && !errorMsg ? (
        <p className="text-gray-600 mb-6">
          No restaurants found in that radius.
        </p>
      ) : (
        <div>
          <p className="text-gray-600 mb-2">
            Showing {results.length} of {totalCount} results
          </p>
          <div className="space-y-4 mb-6">
            {results.map((r) => (
              <div
                key={r.restaurant_id}
                className="border border-gray-200 rounded-md p-4 hover:shadow-md transition-shadow bg-white"
              >
                <Link
                  href={`/restaurants/${r.restaurant_id}`}
                  className="block text-blue-600 hover:underline"
                >
                  <div className="font-semibold text-lg">
                    {normalizeText(r.restaurant_name)}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Address: {normalizeText(r.address) || "N/A"}
                  </div>
                  <div className="text-sm text-gray-700">
                    Cuisines: {normalizeText(r.cuisines) || "N/A"}
                  </div>
                  <div className="text-sm text-gray-700">
                    City: {normalizeText(r.city) || "N/A"}
                  </div>
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
                disabled={currentPage <= 1 || isLoading} // Disable during loading
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prev
              </button>
              <span className="text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading} // Disable during loading
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}