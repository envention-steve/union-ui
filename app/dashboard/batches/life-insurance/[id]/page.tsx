"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { backendApiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface LifeInsuranceBatch {
  id: number;
  start_date: string;
  end_date: string;
  status: string;
  posted: boolean;
  error_message?: string;
}

interface Member {
    id: number;
    first_name: string;
    last_name: string;
    life_insurance_status: string;
}

export default function LifeInsuranceBatchPage() {
  const params = useParams();
  const { id } = params;

  const [batch, setBatch] = useState<LifeInsuranceBatch | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const fetchBatch = async () => {
        try {
          setLoading(true);
          const data = await backendApiClient.lifeInsuranceBatches.get(id as string);
          setBatch(data);
        } catch (err) {
          setError("Failed to load life insurance batch.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchBatch();
    }
  }, [id]);

  useEffect(() => {
    if (batch && batch.status !== 'COMPLETED' && batch.status !== 'FAILED') {
      const interval = setInterval(async () => {
        try {
          const data = await backendApiClient.lifeInsuranceBatches.get(id as string);
          setBatch(data);
        } catch (err) {
          console.error(err);
        }
      }, 5000);
      return () => clearInterval(interval);
    } else if (batch?.status === 'COMPLETED') {
      const fetchMembers = async () => {
        try {
          // TODO: The backend needs to be updated to return the life insurance status for all members in a single call.
          // The current implementation is a placeholder and will not display the correct life insurance status.
          const memberData = await backendApiClient.members.list();
          setMembers(memberData.items);
        } catch (err) {
          setError("Failed to load members for the batch.");
          console.error(err);
        }
      };
      fetchMembers();
    }
  }, [batch, id]);

  const handlePostBatch = async () => {
    if (!batch) return;

    try {
      await backendApiClient.lifeInsuranceBatches.post(batch.id.toString());
      toast.success("Batch posted successfully!");
      setBatch({ ...batch, posted: true });
    } catch (err) {
      toast.error("Failed to post batch.");
      console.error(err);
    }
  };

  const handleUnpostBatch = async () => {
    if (!batch) return;

    try {
      await backendApiClient.lifeInsuranceBatches.unpost(batch.id.toString());
      toast.success("Batch unposted successfully!");
      setBatch({ ...batch, posted: false });
    } catch (err) {
      toast.error("Failed to unpost batch.");
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!batch) {
    return <div>Batch not found.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-union-900">Life Insurance Batch Details</h1>
          <p className="text-muted-foreground">
            Batch from {new Date(batch.start_date).toLocaleDateString()} to {new Date(batch.end_date).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {batch.posted ? (
            <Button onClick={handleUnpostBatch} variant="secondary">Unpost Batch</Button>
          ) : (
            <Button onClick={handlePostBatch}>Post Batch</Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Status: {batch.status}</CardTitle>
          {batch.status === 'FAILED' && batch.error_message && (
            <CardDescription className="text-red-500">{batch.error_message}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {batch.status === 'COMPLETED' && (
        <Card>
          <CardHeader>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              This batch updated the life insurance status for {members.length} members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member ID</TableHead>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Life Insurance Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.id}</TableCell>
                    <TableCell>{member.first_name}</TableCell>
                    <TableCell>{member.last_name}</TableCell>
                    <TableCell>{member.life_insurance_status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
