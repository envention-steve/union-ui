'use client';

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const jobDetails: { [key: string]: { title: string; description: string } } = {
  'member-manual-adjustment': {
    title: "Member Manual Adjustment",
    description: "Apply manual financial adjustments to member accounts.",
  },
  'member-claim': {
    title: "Member Claim",
    description: "Process all outstanding member claims for payment.",
  },
  'annuity-payout': {
    title: "Annuity Payout",
    description: "Processes all scheduled annuity payouts.",
  },
  'account-contribution': {
    title: "Account Contribution",
    description: "Allocate system-wide contributions to member accounts.",
  },
  'employer-contribution': {
    title: "Employer Contribution",
    description: "Process scheduled contributions from all active employers.",
  },
  'insurance-premium': {
    title: "Insurance Premium",
    description: "Calculate and process premium payments to insurance carriers.",
  },
  'life-insurance': {
    title: "Life Insurance",
    description: "Process life insurance claims and beneficiary payouts.",
  },
  'fiscal-year-end': {
    title: "Fiscal Year End",
    description: "Perform end-of-year financial closing and generate reports.",
  },
  'annuity-interest': {
    title: "Annuity Interest",
    description: "Calculate and apply interest to all qualifying annuity accounts.",
  },
};

// Mock data for the history table - we can replace this with real data later
const mockHistory = [
  {
    status: "Success",
    startedAt: "2025-09-15, 10:00 PM",
    duration: "5m 12s",
    triggeredBy: "L. Smith",
  },
  {
    status: "Failed",
    startedAt: "2025-08-15, 10:02 PM",
    duration: "1m 5s",
    triggeredBy: "D. Ahl",
  },
  {
    status: "Success",
    startedAt: "2025-07-15, 10:00 PM",
    duration: "5m 3s",
    triggeredBy: "System",
  },
];

export default function BatchJobPage({ params }: { params: Promise<{ jobId: string }> }) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then(({ jobId }) => {
      setJobId(jobId);
      setIsLoading(false);
    });
  }, [params]);

  if (isLoading || !jobId) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Loading...</h1>
      </div>
    );
  }

  const details = jobDetails[jobId];
  // A simple way to decide if we show history or not, for demonstration
  const showHistory = jobId !== 'annuity-payout' && jobId !== 'member-claim';

  if (!details) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Batch Job Not Found</h1>
        <p className="text-muted-foreground">Please select a valid job from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{details.title}</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            {details.description}
          </p>
        </div>
        <Button size="lg">Run Job</Button>
      </div>
      <hr />
      <div>
        <h3 className="text-xl font-semibold">Run History</h3>
        <div className="mt-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Status</TableHead>
                <TableHead>Started At</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Triggered By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showHistory && mockHistory.length > 0 ? (
                mockHistory.map((run, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Badge
                        variant={run.status === "Success" ? "default" : "destructive"}
                      >
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{run.startedAt}</TableCell>
                    <TableCell>{run.duration}</TableCell>
                    <TableCell>{run.triggeredBy}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    No run history available for this job.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
