'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PersonForm } from './person-form';
import { CompanyForm } from './company-form';
import { PayoutCalculator } from './payout-calculator';
import { cn } from '@/lib/utils';

const annuityPayoutSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  annuityFee: z.boolean().default(false),
  federalTaxType: z.enum(['rate', 'amount']).default('rate'),
  federalTaxRate: z.string().optional(),
  federalTaxAmount: z.string().optional(),
  code1099: z.string().optional(),
  checkNumber: z.string().optional(),
  checkDate: z.string().min(1, 'Check date is required'),
  annuityPayout: z.string().min(1, 'Annuity payout is required'),
  postedDate: z.string().min(1, 'Posted date is required'),
  allowOverdraft: z.boolean().default(false),
  useMemberInfo: z.boolean().default(false),
  recipientType: z.enum(['person', 'company']).default('person'),
  // Person fields
  person: z.object({
    firstName: z.string().default(''),
    lastName: z.string().default(''),
    address: z.string().default(''),
    city: z.string().default(''),
    state: z.string().default(''),
    zipCode: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
  }).default({
    firstName: '',
    lastName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
  }),
  // Company fields
  company: z.object({
    companyName: z.string().default(''),
    contactName: z.string().default(''),
    address: z.string().default(''),
    city: z.string().default(''),
    state: z.string().default(''),
    zipCode: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
  }).default({
    companyName: '',
    contactName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
    email: '',
  }),
}).refine((data) => {
  if (data.federalTaxType === 'rate') {
    return data.federalTaxRate && data.federalTaxRate.length > 0;
  } else {
    return data.federalTaxAmount && data.federalTaxAmount.length > 0;
  }
}, {
  message: 'Either federal tax rate or amount is required',
  path: ['federalTaxRate'],
});

type AnnuityPayoutFormData = z.infer<typeof annuityPayoutSchema>;

interface AnnuityPayoutFormProps {
  onSubmit?: (data: AnnuityPayoutFormData) => void;
  className?: string;
}

export function AnnuityPayoutForm({ onSubmit, className }: AnnuityPayoutFormProps) {
  const [federalTaxType, setFederalTaxType] = useState<'rate' | 'amount'>('rate');

  const form = useForm<AnnuityPayoutFormData>({
    resolver: zodResolver(annuityPayoutSchema),
    defaultValues: {
      accountNumber: '',
      annuityFee: false,
      federalTaxType: 'rate',
      federalTaxRate: '',
      federalTaxAmount: '',
      code1099: '',
      checkNumber: '',
      checkDate: '2025-09-18',
      annuityPayout: '',
      postedDate: '2025-09-18',
      allowOverdraft: false,
      useMemberInfo: false,
      recipientType: 'person',
      person: {
        firstName: '',
        lastName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
      },
      company: {
        companyName: '',
        contactName: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        phone: '',
        email: '',
      },
    },
  });

  const watchedValues = form.watch();
  const recipientType = form.watch('recipientType');
  const useMemberInfo = form.watch('useMemberInfo');

  const handleSubmit = (data: AnnuityPayoutFormData) => {
    console.log('Annuity Payout Form Data:', data);
    onSubmit?.(data);
  };

  const handleFederalTaxTypeChange = (type: 'rate' | 'amount') => {
    setFederalTaxType(type);
    form.setValue('federalTaxType', type);
    // Clear the other field when switching types
    if (type === 'rate') {
      form.setValue('federalTaxAmount', '');
    } else {
      form.setValue('federalTaxRate', '');
    }
  };

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
      {/* Main Form */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Annuity Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Account Number */}
                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter account number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Annuity Fee */}
                <FormField
                  control={form.control}
                  name="annuityFee"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Annuity Fee ($25.00)
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {/* Federal Tax Section */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="federalTaxRate"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={federalTaxType === 'rate'}
                              onChange={() => handleFederalTaxTypeChange('rate')}
                              className="h-4 w-4"
                            />
                            <span>Federal Tax Rate</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                max="100"
                                placeholder="0.00"
                                disabled={federalTaxType !== 'rate'}
                                {...field}
                              />
                              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                %
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex items-center justify-center h-16">
                      <span className="text-muted-foreground font-medium">OR</span>
                    </div>

                    <FormField
                      control={form.control}
                      name="federalTaxAmount"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="flex items-center space-x-2">
                            <input
                              type="radio"
                              checked={federalTaxType === 'amount'}
                              onChange={() => handleFederalTaxTypeChange('amount')}
                              className="h-4 w-4"
                            />
                            <span>Federal Tax Amount</span>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                className="pl-8"
                                disabled={federalTaxType !== 'amount'}
                                {...field}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Row 1: 1099 Code and Check Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code1099"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1099 Code</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter 1099 code" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="checkNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter check number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Row 2: Check Date and Annuity Payout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="checkDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Check Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="annuityPayout"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Annuity Payout</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              placeholder="0.00"
                              className="pl-8"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Posted Date */}
                <FormField
                  control={form.control}
                  name="postedDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posted Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Checkboxes */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="allowOverdraft"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Allow Overdraft?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="useMemberInfo"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Use Member Info?</FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {/* Recipient Type Selection - Hidden when using member info */}
                {!useMemberInfo && (
                  <FormField
                    control={form.control}
                    name="recipientType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recipient Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select recipient type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="person">Person</SelectItem>
                            <SelectItem value="company">Company</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Conditional Recipient Forms - Hidden when using member info */}
                {!useMemberInfo && recipientType === 'person' && (
                  <PersonForm form={form} />
                )}

                {!useMemberInfo && recipientType === 'company' && (
                  <CompanyForm form={form} />
                )}

                <Button type="submit" className="w-full">
                  Calculate payout amount
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Payout Calculator */}
      <div className="lg:col-span-1">
        <PayoutCalculator 
          formData={watchedValues}
          federalTaxType={federalTaxType}
        />
      </div>
    </div>
  );
}