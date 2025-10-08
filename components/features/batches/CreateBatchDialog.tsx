import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toISOStringWithMidnight } from 'lib/utils';
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { backendApiClient } from "@/lib/api-client";
import { AccountContributionBatchCreate } from "@/types";

const START_DATE_MESSAGE = "Start date is required.";
const END_DATE_MESSAGE = "End date is required.";

const formSchema = z.object({
  account_type: z.string({ required_error: "Account type is required." }).min(1, "Account type is required."),
  contribution_type: z
    .string({ required_error: "Contribution type is required." })
    .min(1, "Contribution type is required."),
  start_date: z
    .string({ required_error: START_DATE_MESSAGE })
    .min(1, START_DATE_MESSAGE)
    .regex(/^\d{4}-\d{2}-\d{2}$/, START_DATE_MESSAGE),
  end_date: z
    .string({ required_error: END_DATE_MESSAGE })
    .min(1, END_DATE_MESSAGE)
    .regex(/^\d{4}-\d{2}-\d{2}$/, END_DATE_MESSAGE),
});

interface CreateBatchDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  contributionTypes: { value: string; label: string }[];
}

const accountTypes = [
  { value: 'HEALTH', label: 'Health' },
  { value: 'ANNUITY', label: 'Annuity' },
];

export function CreateBatchDialog({ isOpen, onOpenChange, contributionTypes }: CreateBatchDialogProps) {
  const router = useRouter();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      account_type: '',
      contribution_type: '',
      start_date: '',
      end_date: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const startDateIso = toISOStringWithMidnight(values.start_date);
    const endDateIso = toISOStringWithMidnight(values.end_date);

    if (!startDateIso || !endDateIso) {
      toast.error("Please provide valid start and end dates.");
      return;
    }

    const payload: AccountContributionBatchCreate = {
      ...values,
      start_date: startDateIso,
      end_date: endDateIso,
      received_date: new Date().toISOString(),
      posted: false,
      suspended: false,
      amount_received: 0,
      account_contributions: [],
    };

    toast.promise(
      backendApiClient.accountContributions.create(payload),
      {
        loading: "Creating batch...",
        success: (newBatch) => {
          onOpenChange(false);
          form.reset();
          // Assuming the API returns the created batch with an id
          if (newBatch && newBatch.id) {
            router.push(`/dashboard/batches/account-contribution/${newBatch.id}/edit`);
          }
          return `Batch created successfully!`;
        },
        error: (err) => {
          return `Failed to create batch: ${err.message}`;
        },
      }
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Contribution Batch</DialogTitle>
          <DialogDescription>
            Select the account, contribution type, and date range for the new batch.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="account_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {accountTypes.map(at => (
                        <SelectItem key={at.value} value={at.value}>{at.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contribution_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contribution Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contribution type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {contributionTypes.map(ct => (
                        <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      {...field}
                      value={field.value}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
