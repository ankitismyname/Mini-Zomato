import { supabase } from "../../lib/supabase";

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

export default async function handler(req, res) {
  try {
    const {
      countryName = "",
      maxSpend = "",
      nameFilter = "",
      cuisineFilter = "",
      descriptionFilter = "",
      page = "1",
    } = req.query;

    const limit = 10;
    const currentPage = Math.max(1, parseInt(page, 10));
    const from = (currentPage - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from("restaurants")
      .select("*", { count: "exact" })
      .range(from, to); // Fetch only 10 items based on page

    // Apply filters
    if (countryName) {
      const inputLower = countryName.toLowerCase();
      const matchingCountries = Object.entries(countryMapping).filter(
        ([code, name]) => name.toLowerCase().startsWith(inputLower)
      );

      if (matchingCountries.length > 0) {
        const matchingCodes = matchingCountries.map(([code]) => code);
        query = query.in("country_code", matchingCodes);
      }
    }

    if (maxSpend) query = query.lte("average_cost_for_two", +maxSpend);
    if (nameFilter) query = query.ilike("restaurant_name", `%${nameFilter}%`);
    if (cuisineFilter) query = query.ilike("cuisines", `%${cuisineFilter}%`);
    if (descriptionFilter)
      query = query.ilike("description", `%${descriptionFilter}%`);

    const { data, error, count } = await query;

    if (error) {
      throw new Error(error.message);
    }

    res.status(200).json({
      success: true,
      data,
      count,
      currentPage,
      totalPages: Math.ceil(count / limit) || 1,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}