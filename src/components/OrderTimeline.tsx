import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck, CheckCircle, Clock, XCircle } from "lucide-react";

interface OrderStatus {
  status: string;
  note: string | null;
  created_at: string;
}

interface OrderTimelineProps {
  orderId: string;
  currentStatus: string;
  trackingNumber?: string | null;
  estimatedDelivery?: string | null;
}

const OrderTimeline = ({ orderId, currentStatus, trackingNumber, estimatedDelivery }: OrderTimelineProps) => {
  const [statusHistory, setStatusHistory] = useState<OrderStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatusHistory();
  }, [orderId]);

  const fetchStatusHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStatusHistory(data || []);
    } catch (error) {
      console.error("Error fetching status history:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-5 w-5" />;
      case "processing":
        return <Package className="h-5 w-5" />;
      case "shipped":
        return <Truck className="h-5 w-5" />;
      case "delivered":
        return <CheckCircle className="h-5 w-5" />;
      case "cancelled":
      case "refunded":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "processing":
        return "bg-blue-500";
      case "shipped":
        return "bg-purple-500";
      case "delivered":
        return "bg-green-500";
      case "cancelled":
      case "refunded":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const statusSteps = [
    { key: "pending", label: "Order Placed" },
    { key: "processing", label: "Processing" },
    { key: "shipped", label: "Shipped" },
    { key: "delivered", label: "Delivered" },
  ];

  const currentStepIndex = statusSteps.findIndex(step => step.key === currentStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="relative">
          <div className="flex justify-between mb-2">
            {statusSteps.map((step, index) => (
              <div key={step.key} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex ? getStatusColor(step.key) : "bg-gray-300"
                  } text-white transition-all duration-300`}
                >
                  {getStatusIcon(step.key)}
                </div>
                <p className="text-xs mt-2 text-center font-medium">{step.label}</p>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-300 -z-10">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Tracking Info */}
        {trackingNumber && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Tracking Number</p>
            <p className="text-lg font-mono">{trackingNumber}</p>
          </div>
        )}

        {estimatedDelivery && (
          <div className="bg-muted p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Estimated Delivery</p>
            <p className="text-lg">{new Date(estimatedDelivery).toLocaleDateString()}</p>
          </div>
        )}

        {/* Status History */}
        {statusHistory.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Status Updates</h3>
            <div className="space-y-3">
              {statusHistory.map((status, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(status.status)} mt-2`} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="capitalize">
                        {status.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(status.created_at).toLocaleString()}
                      </span>
                    </div>
                    {status.note && (
                      <p className="text-sm text-muted-foreground mt-1">{status.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderTimeline;