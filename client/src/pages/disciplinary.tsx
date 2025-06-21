import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { ThumbsUp, ThumbsDown, AlertTriangle, Clock, ArrowLeft } from "lucide-react";

export default function Disciplinary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ["/api/disciplinary-actions"],
  });

  const voteMutation = useMutation({
    mutationFn: async ({ actionId, vote }: { actionId: number; vote: string }) => {
      await apiRequest("POST", `/api/disciplinary-actions/${actionId}/vote`, { vote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplinary-actions"] });
      toast({
        title: "Vote Recorded",
        description: "Your vote has been recorded successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to record vote",
        variant: "destructive",
      });
    },
  });

  const handleVote = (actionId: number, vote: string) => {
    voteMutation.mutate({ actionId, vote });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-500";
      case "resolved": return "bg-green-500";
      case "dismissed": return "bg-gray-500";
      default: return "bg-blue-500";
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      "cheating": "Academic Dishonesty",
      "bullying": "Bullying/Harassment",
      "inappropriate_behavior": "Inappropriate Behavior",
      "spam": "Spam/Fake Content",
      "discrimination": "Discrimination",
      "threats": "Threats/Violence",
      "other": "Other"
    };
    return labels[reason] || reason;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="h-48 content-box">
              <div className="h-full bg-gray-200 dark:bg-gray-700 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => setLocation("/")}
          className="app-text hover:bg-gray-100 dark:hover:bg-gray-700 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <h1 className="text-2xl font-bold app-text mb-2">Disciplinary Review</h1>
        <p className="app-text-light">
          Review and vote on disciplinary actions submitted by the community. 
          Your votes help maintain a safe learning environment.
        </p>
      </div>

      {actions.length === 0 ? (
        <Card className="content-box">
          <CardContent className="text-center py-8">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="app-text-light">No disciplinary actions to review at this time.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {actions.map((action: any) => (
            <Card key={action.id} className="content-box">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-5 h-5 youtube-red" />
                      <CardTitle className="app-text">
                        {getReasonLabel(action.reason)}
                      </CardTitle>
                      <Badge className={`text-white ${getStatusColor(action.status)}`}>
                        {action.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-sm app-text-light">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{new Date(action.createdAt).toLocaleDateString()}</span>
                      </div>
                      {action.reportedUser && (
                        <span>
                          Reported: {action.reportedUser.name} 
                          ({action.reportedUser.admissionNumber})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-sm app-text-light">
                      Votes: {action.votes || 0}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium app-text mb-2">Description:</h4>
                    <p className="app-text-light">{action.description}</p>
                  </div>
                  
                  {action.status === "pending" && (
                    <div className="flex space-x-2 pt-4 border-t">
                      <Button
                        onClick={() => handleVote(action.id, "support")}
                        disabled={voteMutation.isPending}
                        className="discord-purple-bg hover:bg-purple-700 text-white"
                      >
                        <ThumbsUp className="w-4 h-4 mr-2" />
                        Support Action
                      </Button>
                      <Button
                        onClick={() => handleVote(action.id, "oppose")}
                        disabled={voteMutation.isPending}
                        variant="outline"
                      >
                        <ThumbsDown className="w-4 h-4 mr-2" />
                        Oppose Action
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}