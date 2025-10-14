import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProductRow {
  name: string;
  price: number;
  listPrice: number;
  category: string;
  countInStock: number;
  avgRating?: number;
  isPublished?: boolean;
  description?: string;
  brand?: string;
  images: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify admin access
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const csvText = await file.text();
    const lines = csvText.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return new Response(JSON.stringify({ error: 'CSV file is empty or invalid' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Parse CSV
    const headers = lines[0].split(',').map(h => h.trim());
    const products: ProductRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i].split(',').map(v => v.trim());
        const row: any = {};
        
        headers.forEach((header, index) => {
          row[header] = values[index];
        });

        // Validate required fields
        if (!row.name || !row.price || !row.listPrice || !row.category || !row.countInStock) {
          errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Parse images (semicolon separated)
        const images = row.images ? row.images.split(';').map((img: string) => img.trim()).filter(Boolean) : [];
        
        if (images.length === 0) {
          errors.push(`Row ${i + 1}: At least one image URL is required`);
          continue;
        }

        products.push({
          name: row.name,
          price: parseFloat(row.price),
          list_price: parseFloat(row.listPrice),
          category: row.category,
          stock_quantity: parseInt(row.countInStock),
          rating: row.avgRating ? parseFloat(row.avgRating) : 5.0,
          is_active: row.isPublished ? row.isPublished.toLowerCase() === 'true' : true,
          description: row.description || '',
          brand: row.brand || "Bushra's Collection",
          images: images
        });
      } catch (error) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ 
        error: 'No valid products found in CSV',
        errors 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Insert products
    const { data, error } = await supabaseClient
      .from('products')
      .insert(products)
      .select();

    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ 
      success: true,
      imported: products.length,
      errors: errors.length > 0 ? errors : undefined,
      products: data
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});