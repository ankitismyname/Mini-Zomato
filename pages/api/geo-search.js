import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { lat, lon, radius, page = 1, limit = 10 } = req.body;

  // Basic validation
  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const parsedRad = parseFloat(radius);
  const parsedPage = Math.max(1, parseInt(page, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  if (isNaN(parsedLat) || isNaN(parsedLon)) {
    return res.status(400).json({ error: 'Latitude and Longitude must be valid numbers.' });
  }
  if (isNaN(parsedRad) || parsedRad <= 0) {
    return res.status(400).json({ error: 'Radius must be a positive number.' });
  }

  try {
    // Initialize Supabase client with environment variables
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    // Call paginated RPC to fetch only the current page of data
    const { data: paginatedData, error: pageError } = await supabase.rpc('restaurants_within_radius', {
      _lon: parsedLon,
      _lat: parsedLat,
      _radius_km: parsedRad,
      _page: parsedPage,
      _limit: parsedLimit,
    });

    if (pageError) {
      console.error('Paginated RPC error:', pageError);
      return res.status(500).json({ error: pageError.message });
    }

    // Call count RPC to get total number of matching records
    const { data: countData, error: countError } = await supabase.rpc('restaurants_within_radius_count', {
      _lon: parsedLon,
      _lat: parsedLat,
      _radius_km: parsedRad,
    });

    if (countError) {
      console.error('Count RPC error:', countError);
      return res.status(500).json({ error: countError.message });
    }

    // Extract total count from the count RPC response
    const totalCount = countData?.[0]?.count || 0;

    return res.status(200).json({
      results: paginatedData || [],
      totalCount,
      currentPage: parsedPage,
      totalPages: Math.ceil(totalCount / parsedLimit) || 1,
    });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}