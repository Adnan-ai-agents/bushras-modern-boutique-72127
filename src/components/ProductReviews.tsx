import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useAuthStore } from "@/store/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  };
}

interface ProductReviewsProps {
  productId: string;
}

const ProductReviews = ({ productId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const reviewsWithProfiles = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', review.user_id)
            .single();

          return {
            ...review,
            profiles: profile || { name: '', email: '' }
          };
        })
      );

      setReviews(reviewsWithProfiles);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to submit a review.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert([
          {
            product_id: productId,
            user_id: user.id,
            rating,
            comment: comment.trim()
          }
        ]);

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Thank you for your feedback!",
      });

      setComment("");
      setRating(5);
      fetchReviews();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (count: number, interactive: boolean = false, onSelect?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onSelect?.(star)}
            disabled={!interactive}
            className={interactive ? "cursor-pointer" : ""}
          >
            <Star
              className={`h-5 w-5 ${
                star <= count
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-8">
      {/* Review Summary */}
      <div className="flex items-center gap-8">
        <div className="text-center">
          <div className="text-5xl font-bold text-foreground mb-2">{avgRating}</div>
          {renderStars(Math.round(parseFloat(avgRating)))}
          <div className="text-sm text-muted-foreground mt-2">
            {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
          </div>
        </div>
      </div>

      {/* Write Review */}
      {user && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Rating
                </label>
                {renderStars(rating, true, setRating)}
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Your Review
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows={4}
                  required
                  maxLength={500}
                />
              </div>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Review"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-foreground">Customer Reviews</h3>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading reviews...</div>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.profiles.name?.charAt(0) || review.profiles.email.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="font-semibold text-foreground">
                          {review.profiles.name || review.profiles.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(review.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      {renderStars(review.rating)}
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
