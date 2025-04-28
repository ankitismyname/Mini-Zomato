import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const { page = "1" } = router.query;

  const [rests, setRests] = useState([]);
  const [count, setCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [countryName, setCountryName] = useState("");
  const [maxSpend, setMaxSpend] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("");
  const [countryError, setCountryError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState("asc"); // For name sorting

  const limit = 10;

  const countryMapping = {
    1: "India",
    14: "Australia",
    30: "Brazil",
    37: "Canada",
    94: "Indonesia",
    148: "New Zealand",
    162: "Philippines",
    166: "Qatar",
    184: "Singapore",
    189: "South Africa",
    191: "Sri Lanka",
    208: "Turkey",
    214: "UAE",
    215: "United Kingdom",
    216: "United States",
  };

  useEffect(() => {
    setCurrentPage(Math.max(1, parseInt(page, 10)));
  }, [page]);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams({
          countryName,
          maxSpend,
          nameFilter,
          cuisineFilter,
          page: currentPage.toString(),
        });

        const response = await fetch(`/api/restaurants_list?${queryParams}`);
        const { success, data, count, totalPages } = await response.json();

        if (success) {
          // Sort by name alphabetically
          const sortedData = data.sort((a, b) =>
            sortOrder === "asc"
              ? a.restaurant_name.localeCompare(b.restaurant_name)
              : b.restaurant_name.localeCompare(a.restaurant_name)
          );
          setRests(sortedData);
          setCount(count);
          setTotalPages(totalPages);
        }
      } catch (error) {
        console.error("Error fetching restaurants:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [currentPage, countryName, maxSpend, nameFilter, cuisineFilter, sortOrder]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    router.push(`/?page=${newPage}`);
  };

  const handleSearch = () => {
    router.push(`/?page=1`);
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    router.push(`/?page=1`);
  };

  const normalizeText = (text) => {
    if (!text) return "N/A";
    const textStr = typeof text === "string" ? text : String(text || "");
    try {
      let normalized = textStr.normalize("NFC").replace(/�/g, "í");
      if (normalized.includes("�")) {
        normalized = normalized.replace(/[^\x00-\x7F]/g, "?");
      }
      return normalized;
    } catch {
      return textStr.replace(/[^\x00-\x7F]/g, "?") || "N/A";
    }
  };

  const getCountryName = (code) => {
    return countryMapping[code] || "N/A";
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Restaurants</h1>

      <div className="mb-6 flex flex-wrap gap-4 justify-center">
        <button
          onClick={() => router.push("/image-search")}
          className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 shadow-md"
        >
          Search by Image
        </button>
        <button
          onClick={() => router.push("/geo-search")}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 shadow-md"
        >
          Search by Geo Radius
        </button>

        <div className="mb-6 flex flex-wrap gap-2">
          <div className="relative">
            <input
              className={`p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 ${
                countryError ? "border-red-500" : ""
              }`}
              placeholder="Country Name"
              value={countryName}
              onChange={(e) => {
                setCountryName(e.target.value);
                if (!e.target.value) setCountryError("");
              }}
            />
            {countryError && (
              <div className="absolute text-red-500 text-xs mt-1 w-40">
                {countryError}
              </div>
            )}
          </div>
          <input
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-32"
            placeholder="Avg Spend for 2"
            type="number"
            value={maxSpend}
            onChange={(e) => setMaxSpend(e.target.value)}
          />
          <input
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
            placeholder="Name contains"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
          <input
            className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
            placeholder="Cuisine contains"
            value={cuisineFilter}
            onChange={(e) => setCuisineFilter(e.target.value)}
          />
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Search
          </button>
          <button
            onClick={toggleSortOrder}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Sort by Name ({sortOrder === "asc" ? "A-Z" : "Z-A"})
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600 mb-6">Loading restaurants...</p>
      ) : rests.length > 0 ? (
        <div className="space-y-4 mb-6">
          {rests.map((r) => (
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
                <div className="text-sm text-gray-700">
                  Country: {getCountryName(r.country_code) || "N/A"}
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
      ) : (
        <p className="text-gray-600 mb-6">No restaurants found.</p>
      )}

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
  );
}