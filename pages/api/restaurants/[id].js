import { supabase } from '../../../lib/supabase';

export default async function handler(req, res) {
  // Check if the request method is GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id } = req.query;

    // Validate ID parameter
    if (!id) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }

    // Fetch restaurant data from Supabase
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('restaurant_id', id)
      .single();

    // Handle errors from Supabase
    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Failed to fetch restaurant data', details: error.message });
    }

    // Check if data exists
    if (!data) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Return the restaurant data
    return res.status(200).json({ data });
  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}