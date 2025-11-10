import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, MessageCircle, Truck, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useAuthStore } from "@/store/auth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

// Validation schema for shipping information
const shippingSchema = z.object({
  name: z.string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  phone: z.string()
    .trim()
    .regex(/^(\+92|0)?[0-9]{10,11}$/, "Invalid phone number. Use format: 03001234567 or +923001234567")
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be less than 15 digits"),
  address: z.string()
    .trim()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters"),
  city: z.string()
    .trim()
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name must be less than 100 characters")
    .regex(/^[a-zA-Z\s]+$/, "City can only contain letters and spaces"),
  postalCode: z.string()
    .trim()
    .max(10, "Postal code must be less than 10 characters")
    .regex(/^[0-9]{0,10}$/, "Postal code can only contain numbers")
    .optional()
    .or(z.literal('')),
  notes: z.string()
    .trim()
    .max(1000, "Notes must be less than 1000 characters")
    .optional()
    .or(z.literal(''))
});

const Checkout = () => {
  const navigate = useNavigate();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [shippingInfo, setShippingInfo] = useState({
    name: user?.profile?.name || '',
    phone: user?.profile?.phone || '',
    address: '',
    city: '',
    postalCode: '',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingInfo({ ...shippingInfo, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleContactWhatsApp = () => {
    // Validate all fields
    const validation = shippingSchema.safeParse(shippingInfo);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          fieldErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(fieldErrors);
      
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form",
        variant: "destructive"
      });
      return;
    }
    
    setErrors({});

    // Create WhatsApp message with order details
    const orderDetails = items.map(item => 
      `${item.name} x${item.quantity} - PKR ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const message = `🛍️ *New Order Request*\n\n` +
      `*Customer Details:*\n` +
      `Name: ${shippingInfo.name}\n` +
      `Phone: ${shippingInfo.phone}\n` +
      `Address: ${shippingInfo.address}\n` +
      `City: ${shippingInfo.city}\n` +
      `Postal Code: ${shippingInfo.postalCode || 'N/A'}\n\n` +
      `*Order Items:*\n${orderDetails}\n\n` +
      `*Total Amount: PKR ${getTotalPrice().toLocaleString()}*\n\n` +
      `${shippingInfo.notes ? `*Notes:* ${shippingInfo.notes}\n\n` : ''}` +
      `Please confirm my order and provide payment details.`;

    // Replace with your actual WhatsApp number (without + symbol)
    const whatsappNumber = '923001234567'; // Update this number
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    
    toast({
      title: "Opening WhatsApp",
      description: "Your order details have been prepared. Complete your order on WhatsApp!"
    });
  };

  if (items.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">Add some products to get started</p>
            <Button onClick={() => navigate('/products')}>Browse Products</Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 pt-24 pb-20">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-4xl font-serif font-bold text-foreground mb-8">Checkout</h1>


        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      value={shippingInfo.name} 
                      onChange={handleInputChange} 
                      className={errors.name ? "border-destructive" : ""}
                      required 
                    />
                    {errors.name && <p className="text-sm text-destructive mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      value={shippingInfo.phone} 
                      onChange={handleInputChange}
                      placeholder="03001234567"
                      className={errors.phone ? "border-destructive" : ""}
                      required 
                    />
                    {errors.phone && <p className="text-sm text-destructive mt-1">{errors.phone}</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea 
                    id="address" 
                    name="address" 
                    value={shippingInfo.address} 
                    onChange={handleInputChange}
                    className={errors.address ? "border-destructive" : ""}
                    required 
                  />
                  {errors.address && <p className="text-sm text-destructive mt-1">{errors.address}</p>}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">City *</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      value={shippingInfo.city} 
                      onChange={handleInputChange}
                      className={errors.city ? "border-destructive" : ""}
                      required 
                    />
                    {errors.city && <p className="text-sm text-destructive mt-1">{errors.city}</p>}
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode" 
                      value={shippingInfo.postalCode} 
                      onChange={handleInputChange}
                      placeholder="54000"
                      className={errors.postalCode ? "border-destructive" : ""}
                    />
                    {errors.postalCode && <p className="text-sm text-destructive mt-1">{errors.postalCode}</p>}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="notes">Order Notes (Optional)</Label>
                  <Textarea 
                    id="notes" 
                    name="notes" 
                    value={shippingInfo.notes} 
                    onChange={handleInputChange} 
                    placeholder="Any special instructions?"
                    className={errors.notes ? "border-destructive" : ""}
                  />
                  {errors.notes && <p className="text-sm text-destructive mt-1">{errors.notes}</p>}
                </div>

                <div className="pt-4 border-t">
                  <div className="bg-accent/20 p-4 rounded-lg mb-4">
                    <div className="flex items-start gap-3">
                      <MessageCircle className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-foreground mb-1">Order via WhatsApp</h3>
                        <p className="text-sm text-muted-foreground">
                          Click the button below to send your order details directly to our WhatsApp. 
                          We'll confirm your order and provide payment instructions.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    className="w-full" 
                    size="lg" 
                    onClick={handleContactWhatsApp}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" />
                    Contact on WhatsApp for Order & Payment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map(item => (
                  <div key={item.id} className="flex gap-3">
                    <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-sm text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-semibold">PKR {(item.price * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>PKR {getTotalPrice().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span className="text-green-600">Free</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>PKR {getTotalPrice().toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
