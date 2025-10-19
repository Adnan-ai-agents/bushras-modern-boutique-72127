import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Menu, X, User, Search, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth";
import { useCartStore } from "@/store/cart";
import { authService } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import CartDrawer from "./CartDrawer";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    const { error } = await authService.signOut();
    if (!error) {
      toast({ title: "Signed out successfully" });
      navigate("/");
    }
  };

  const isAdmin = user?.roles?.includes('admin') || false;
  const isSuperAdmin = (user?.roles as any)?.includes('super_admin') || false;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    ...(user ? [{ name: "Wishlist", href: "/wishlist" }, { name: "Orders", href: "/orders" }] : []),
    ...(isAdmin ? [
      { name: "Dashboard", href: "/admin" },
      { name: "Manage Products", href: "/admin/products" },
      { name: "Manage Orders", href: "/admin/orders" },
    ] : []),
    ...(isSuperAdmin ? [{ name: "Permissions", href: "/admin/permissions" }] : [])
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/" className="block">
              <h1 className="text-2xl font-serif font-bold text-foreground">
                Bushra's Collection
              </h1>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="text-foreground hover:text-primary transition-colors duration-200 font-medium"
                >
                  {link.name}
                </Link>
              )
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="icon" className="hover:bg-accent">
              <Search className="h-5 w-5" />
            </Button>
            
            {user && <NotificationBell />}
            
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">
                  Welcome, {user.profile?.name || user.email}
                </span>
                <Button variant="ghost" size="icon" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => navigate("/auth")}>
                <User className="h-4 w-4 mr-2" />
                Sign In
              </Button>
            )}
            
            <CartDrawer>
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <ShoppingBag className="h-5 w-5" />
              </Button>
            </CartDrawer>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="hover:bg-accent"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-300 ease-in-out overflow-hidden",
            isMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          )}
        >
          <div className="py-4 space-y-4">
            {navLinks.map((link) => (
              link.href.startsWith('/#') ? (
                <a
                  key={link.name}
                  href={link.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </a>
              ) : (
                <Link
                  key={link.name}
                  to={link.href}
                  className="block text-foreground hover:text-primary transition-colors duration-200 font-medium py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.name}
                </Link>
              )
            ))}
            <div className="flex items-center space-x-4 pt-4 border-t border-border">
              <Button variant="ghost" size="icon" className="hover:bg-accent">
                <Search className="h-5 w-5" />
              </Button>
              
              {user ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    {user.profile?.name || user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => navigate("/auth")}>
                  <User className="h-4 w-4 mr-2" />
                  Sign In
                </Button>
              )}
              
              <CartDrawer>
                <Button variant="ghost" size="icon" className="hover:bg-accent">
                  <ShoppingBag className="h-5 w-5" />
                </Button>
              </CartDrawer>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;