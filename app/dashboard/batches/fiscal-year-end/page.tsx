"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backendApiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface FiscalYear {
  id: number;
  start_date: string;
  end_date: string;
  closed: boolean;
}

export default function FiscalYearsBatchPage() {
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedFiscalYear, setSelectedFiscalYear] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOpenFiscalYears = async () => {
      try {
        const openFiscalYears = await backendApiClient.fiscalYears.getOpen();
        setFiscalYears(openFiscalYears);
      } catch (error) {
        toast.error("Failed to fetch open fiscal years.");
      }
    };

    fetchOpenFiscalYears();
  }, []);

  const handleCloseFiscalYear = async () => {
    if (selectedFiscalYear === null) {
      toast.warning("Please select a fiscal year to close.");
      return;
    }

    setIsLoading(true);
    try {
      await backendApiClient.fiscalYears.close(selectedFiscalYear);
      toast.success("Fiscal year closing process initiated.");
      // Refresh the list of open fiscal years
      const openFiscalYears = await backendApiClient.fiscalYears.getOpen();
      setFiscalYears(openFiscalYears);
      setSelectedFiscalYear(null);
    } catch (error) {
      toast.error("Failed to close fiscal year.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Fiscal Year Management</h1>
      <div className="flex items-center space-x-4">
        <Select
          onValueChange={(value) => setSelectedFiscalYear(Number(value))}
          value={selectedFiscalYear?.toString()}
        >
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a fiscal year" />
          </SelectTrigger>
          <SelectContent>
            {fiscalYears.map((year) => (
              <SelectItem key={year.id} value={year.id.toString()}>
                {new Date(year.start_date).toLocaleDateString('en-US')} through {new Date(year.end_date).toLocaleDateString('en-US')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleCloseFiscalYear} disabled={isLoading}>
          {isLoading ? "Closing..." : "Close Fiscal Year"}
        </Button>
      </div>
    </div>
  );
}