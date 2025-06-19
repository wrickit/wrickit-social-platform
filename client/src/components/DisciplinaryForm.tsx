import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface DisciplinaryFormProps {
  reportedUserId: number;
  reportedUserName: string;
  onClose: () => void;
}

export default function DisciplinaryForm({ reportedUserId, reportedUserName, onClose }: DisciplinaryFormProps) {
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const submitReportMutation = useMutation({
    mutationFn: async (data: { reportedUserId: number; reason: string; description: string; isAnonymous: boolean }) => {
      await apiRequest("POST", "/api/disciplinary-actions", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disciplinary-actions"] });
      toast({
        title: "Report Submitted",
        description: "Your disciplinary report has been submitted for peer review.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit report",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason || !description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select a reason and provide a description",
        variant: "destructive",
      });
      return;
    }

    submitReportMutation.mutate({
      reportedUserId,
      reason,
      description: description.trim(),
      isAnonymous,
    });
  };

  return (
    <Card className="content-box">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 youtube-red" />
          <CardTitle className="app-text">Report {reportedUserName}</CardTitle>
        </div>
        <p className="text-sm app-text-light">
          Submit a disciplinary action report for peer review. This will be reviewed by other students anonymously.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason" className="app-text-light">
              Reason for Report:
            </Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cheating">Academic Dishonesty/Cheating</SelectItem>
                <SelectItem value="bullying">Bullying or Harassment</SelectItem>
                <SelectItem value="inappropriate_behavior">Inappropriate Behavior</SelectItem>
                <SelectItem value="spam">Spam or Fake Content</SelectItem>
                <SelectItem value="discrimination">Discrimination</SelectItem>
                <SelectItem value="threats">Threats or Violence</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="description" className="app-text-light">
              Description:
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide detailed information about the incident..."
              className="min-h-24"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="anonymous"
              checked={isAnonymous}
              onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            />
            <Label htmlFor="anonymous" className="text-sm app-text-light">
              Submit anonymously (recommended)
            </Label>
          </div>
          
          <div className="flex space-x-2 pt-4">
            <Button
              type="submit"
              disabled={submitReportMutation.isPending}
              className="youtube-red-bg hover:bg-red-700 text-white"
            >
              {submitReportMutation.isPending ? "Submitting..." : "Submit Report"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}