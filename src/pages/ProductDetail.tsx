import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/ProductReviews";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star, Heart, ShoppingCart, ArrowLeft, Truck, Shield, RefreshCw, MessageCircle } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  brand: string;
  stock_quantity: number;
  images: any;
  is_active: boolean;
  created_at: string;
}

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', slug)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching product:', error);
          return;
        }

        setProduct(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;

    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[0] || '/placeholder.svg',
        category: product.category || 'Fashion'
      });
    }

    toast({
      title: "Added to Cart",
      description: `${quantity} ${product.name}${quantity > 1 ? 's' : ''} added to your cart.`
    });
  };

  const handleBookOrder = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book an order.",
        variant: "destructive"
      });
      navigate("/auth");
      return;
    }

    // Add to cart and navigate to checkout (will implement checkout later)
    handleAddToCart();
    toast({
      title: "Order Booking",
      description: "Product added to cart. Proceed to checkout to complete your order.",
    });
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="aspect-square bg-muted rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-12 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
            <Button onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const productImages = product.images && Array.isArray(product.images) && product.images.length > 0 
    ? product.images
    : ['/placeholder.svg'];

  const isNew = new Date(product.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gradient-subtle">
              <img 
                src={productImages[selectedImage]} 
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            
            {productImages.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              {isNew && (
                <Badge variant="secondary" className="mb-2">New Arrival</Badge>
              )}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-2">
                {product.name}
              </h1>
              <p className="text-lg text-muted-foreground mb-4">{product.brand}</p>
              
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[1,2,3,4,5].map((star) => (
                    <Star key={star} className="h-5 w-5 fill-current" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">(4.8) • 23 reviews</span>
              </div>
            </div>

            <Separator />

            <div>
              <div className="text-3xl font-bold text-primary mb-4">
                PKR {product.price.toLocaleString()}
              </div>
              
              {product.description && (
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {product.description}
                </p>
              )}
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </Button>
                  <span className="w-12 text-center text-foreground font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    disabled={quantity >= product.stock_quantity}
                  >
                    +
                  </Button>
                  <span className="text-sm text-muted-foreground ml-4">
                    {product.stock_quantity} available
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button 
                  className="flex-1" 
                  size="lg"
                  onClick={handleBookOrder}
                  disabled={product.stock_quantity === 0}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Book Order
                </Button>
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock_quantity === 0}
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Add to Cart
                </Button>
                <Button variant="outline" size="lg">
                  <Heart className="h-5 w-5" />
                </Button>
              </div>

              {product.stock_quantity === 0 && (
                <p className="text-destructive text-sm">Out of stock</p>
              )}
            </div>

            <Separator />

            {/* Product Features */}
            <div className="space-y-4">
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <Truck className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Free Delivery</div>
                      <div className="text-xs text-muted-foreground">Orders over PKR 5,000</div>
                    </div>
                    <div>
                      <RefreshCw className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Easy Returns</div>
                      <div className="text-xs text-muted-foreground">7-day return policy</div>
                    </div>
                    <div>
                      <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
                      <div className="text-sm font-medium">Quality Guarantee</div>
                      <div className="text-xs text-muted-foreground">Authentic products</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Product Details */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Product Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category:</span>
                  <span className="text-foreground">{product.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Brand:</span>
                  <span className="text-foreground">{product.brand}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span className="text-foreground">Premium Quality Fabric</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Care:</span>
                  <span className="text-foreground">Dry Clean Only</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details & Reviews Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="reviews" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger value="details">Product Details</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="mt-8">
              <Card>
                <CardContent className="p-8 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {product.description || "This exquisite piece features premium quality fabric and exceptional craftsmanship. Perfect for special occasions and everyday elegance."}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Specifications</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">Category</span>
                        <p className="font-medium text-foreground">{product.category}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Brand</span>
                        <p className="font-medium text-foreground">{product.brand}</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Material</span>
                        <p className="font-medium text-foreground">Premium Fabric</p>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Care Instructions</span>
                        <p className="font-medium text-foreground">Dry Clean Only</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reviews" className="mt-8">
              <ProductReviews productId={product.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Footer />
    </main>
  );
};

export default ProductDetail;