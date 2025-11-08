import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [maxPrice, setMaxPrice] = useState(50000);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const navigate = useNavigate();

  const categories = ['Bridal', 'Party Wear', 'Casual Wear', 'Formal Wear', 'Festive Collection'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, selectedCategories, selectedSizes, priceRange]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('*');

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
      }

      if (selectedCategories.length > 0) {
        query = query.in('category', selectedCategories);
      }

      query = query.gte('price', priceRange[0]).lte('price', priceRange[1]);

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      const productsData = data || [];
      setProducts(productsData);
      
      // Calculate dynamic max price from products
      if (productsData.length > 0) {
        const prices = productsData.map(p => p.price);
        const calculatedMax = Math.max(...prices);
        setMaxPrice(Math.ceil(calculatedMax / 1000) * 1000); // Round up to nearest 1000
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setPriceRange([0, maxPrice]);
    setSearchQuery('');
  };

  const FilterContent = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-semibold mb-4 block">Categories</Label>
        <div className="space-y-3">
          {categories.map(category => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <label htmlFor={category} className="text-sm cursor-pointer">
                {category}
              </label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-4 block">Price Range</Label>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          max={maxPrice}
          step={500}
          className="mb-2"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>PKR {priceRange[0].toLocaleString()}</span>
          <span>PKR {priceRange[1].toLocaleString()}</span>
        </div>
      </div>

      <div>
        <Label className="text-base font-semibold mb-4 block">Sizes</Label>
        <div className="grid grid-cols-3 gap-2">
          {sizes.map(size => (
            <Button
              key={size}
              variant={selectedSizes.includes(size) ? "default" : "outline"}
              size="sm"
              onClick={() => handleSizeToggle(size)}
            >
              {size}
            </Button>
          ))}
        </div>
      </div>

      <Button variant="outline" className="w-full" onClick={clearFilters}>
        <X className="h-4 w-4 mr-2" />
        Clear Filters
      </Button>
    </div>
  );

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-6">Shop All Products</h1>
          
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <SlidersHorizontal className="h-5 w-5 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {(selectedCategories.length > 0 || selectedSizes.length > 0 || searchQuery) && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {selectedCategories.map(cat => (
                <Button key={cat} variant="secondary" size="sm" onClick={() => handleCategoryToggle(cat)}>
                  {cat} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {selectedSizes.map(size => (
                <Button key={size} variant="secondary" size="sm" onClick={() => handleSizeToggle(size)}>
                  {size} <X className="h-3 w-3 ml-1" />
                </Button>
              ))}
              {searchQuery && (
                <Button variant="secondary" size="sm" onClick={() => setSearchQuery('')}>
                  "{searchQuery}" <X className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="hidden lg:block">
            <Card>
              <CardContent className="p-6">
                <FilterContent />
              </CardContent>
            </Card>
          </aside>

          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-muted rounded-2xl mb-4"></div>
                    <div className="h-4 bg-muted rounded mb-2"></div>
                    <div className="h-3 bg-muted rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <h3 className="text-xl font-semibold text-foreground mb-2">No products found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your filters or search query</p>
                <Button onClick={clearFilters}>Clear Filters</Button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {products.length} {products.length === 1 ? 'product' : 'products'}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map(product => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={product.price}
                      image={product.image_url ? [product.image_url] : ['/placeholder.svg']}
                      category={product.category}
                      isNew={new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default Products;
