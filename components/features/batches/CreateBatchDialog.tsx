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

const formSchema = z.object({
  account_type: z.string({ required_error: "Account type is required." }),
  contribution_type: z.string({ required_error: "Contribution type is required." }),
  start_date: z.coerce.date({ required_error: "Start date is required." }),
  end_date: z.coerce.date({ required_error: "End date is required." }),
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
      account_type: undefined,
      contribution_type: undefined,
      start_date: undefined,
      end_date: undefined,
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const payload: AccountContributionBatchCreate = {
      ...values,
      start_date: toISOStringWithMidnight(values.start_date),
      end_date: toISOStringWithMidnight(values.end_date),
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
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
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
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
