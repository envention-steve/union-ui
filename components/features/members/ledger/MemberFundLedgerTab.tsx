"use client";

import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';

import { LedgerEntryExpandedDetails } from './LedgerEntryExpandedDetails';
import type { FundBalance } from '@/lib/members/types';
import type { MemberLedgerState } from '@/hooks/useMemberLedger';
import type { LedgerEntry as PolymorphicLedgerEntry } from '@/types/ledger-entries';
import { getLedgerEntryTypeDisplayName } from '@/types/ledger-entries';
import { cn } from '@/lib/utils';

interface MemberFundLedgerTabProps {
  fundBalances?: FundBalance;
  ledgerState: MemberLedgerState;
}

export function MemberFundLedgerTab({ fundBalances, ledgerState }: MemberFundLedgerTabProps) {
  const {
    ledgerEntries,
    ledgerLoading,
    ledgerError,
    ledgerTotalEntries,
    ledgerCurrentPage,
    ledgerItemsPerPage,
    expandedEntries,
    ledgerEntryTypes,
    accountTypeFilter,
    entryTypeFilter,
    startDateFilter,
    endDateFilter,
    dateRangeFilter,
    setLedgerCurrentPage,
    setLedgerItemsPerPage,
    setAccountTypeFilter,
    setEntryTypeFilter,
    setStartDateFilter,
    setEndDateFilter,
    toggleEntryExpansion,
    handleDateRangeChange,
    handleFilterChange,
    refresh,
  } = ledgerState;

  const totalPages = ledgerTotalEntries > 0
    ? Math.ceil(ledgerTotalEntries / ledgerItemsPerPage)
    : 1;

  const visiblePageNumbers = React.useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const start = Math.max(1, ledgerCurrentPage - 2);
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [ledgerCurrentPage, totalPages]);

  return (
    <div className="space-y-6">
      {fundBalances && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-green-700">Health Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${fundBalances.health_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Last updated: {new Date(fundBalances.last_updated).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-700">Annuity Account</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${fundBalances.annuity_balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Last updated: {new Date(fundBalances.last_updated).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Filter className="h-4 w-4" />
            Ledger Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Account Type
              </Label>
              <Select
                value={accountTypeFilter}
                onValueChange={(value) => {
                  setAccountTypeFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="annuity">Annuity</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Entry Type
              </Label>
              <Select
                value={entryTypeFilter}
                onValueChange={(value) => {
                  setEntryTypeFilter(value);
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {ledgerEntryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Date Range
              </Label>
              <Select
                value={dateRangeFilter}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Custom" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Items per page
              </Label>
              <Select
                value={ledgerItemsPerPage.toString()}
                onValueChange={(value) => {
                  setLedgerItemsPerPage(parseInt(value, 10));
                  handleFilterChange();
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </Label>
              <Input
                type="date"
                value={startDateFilter}
                onChange={(event) => {
                  setStartDateFilter(event.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </Label>
              <Input
                type="date"
                value={endDateFilter}
                onChange={(event) => {
                  setEndDateFilter(event.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={() => refresh()}
                disabled={ledgerLoading}
                className="bg-union-600 text-white hover:bg-union-700"
              >
                Refresh
              </Button>
            </div>
          </div>

          {ledgerError && (
            <Badge variant="destructive" className="px-3 py-1 text-sm">
              {ledgerError}
            </Badge>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Ledger Entries</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12" />
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Health</TableHead>
                  <TableHead className="text-right">Annuity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledgerLoading ? (
                  Array.from({ length: 5 }, (_, index) => (
                    <TableRow key={`loading-${index}`}>
                      <TableCell>
                        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </TableCell>
                      <TableCell>
                        <div className="ml-auto h-4 w-16 animate-pulse rounded bg-gray-200" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : ledgerEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      No ledger entries found.
                    </TableCell>
                  </TableRow>
                ) : (
                  ledgerEntries.map((entry) => {
                    const isExpanded = expandedEntries.has(entry.id);
                    const accountType = entry.account?.type;

                    return (
                      <React.Fragment key={entry.id}>
                        <TableRow
                          className="cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleEntryExpansion(entry.id)}
                        >
                          <TableCell>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            {entry.posted_date ? new Date(entry.posted_date).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell>{getLedgerEntryTypeDisplayName(entry.type)}</TableCell>
                          <TableCell className="text-right">
                            {accountType === 'HEALTH' && (
                              <span
                                className={cn(
                                  'font-medium',
                                  entry.amount < 0 ? 'text-red-600' : 'text-green-600'
                                )}
                              >
                                ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {accountType === 'ANNUITY' && (
                              <span
                                className={cn(
                                  'font-medium',
                                  entry.amount < 0 ? 'text-red-600' : 'text-green-600'
                                )}
                              >
                                ${entry.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            )}
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={5} className="bg-gray-50 p-6">
                              <LedgerEntryExpandedDetails entry={entry as unknown as PolymorphicLedgerEntry} />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {!ledgerLoading && ledgerTotalEntries > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {((ledgerCurrentPage - 1) * ledgerItemsPerPage) + 1} to {Math.min(ledgerCurrentPage * ledgerItemsPerPage, ledgerTotalEntries)} of {ledgerTotalEntries} entries
              </p>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCurrentPage(ledgerCurrentPage - 1)}
                  disabled={ledgerCurrentPage === 1 || ledgerLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>

                <div className="flex items-center space-x-1">
                  {visiblePageNumbers.map((page) => (
                    <Button
                      key={page}
                      variant={ledgerCurrentPage === page ? 'default' : 'outline'}
                      size="sm"
                      className={ledgerCurrentPage === page ? 'bg-union-600 hover:bg-union-700' : ''}
                      onClick={() => setLedgerCurrentPage(page)}
                      disabled={ledgerLoading}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setLedgerCurrentPage(ledgerCurrentPage + 1)}
                  disabled={ledgerCurrentPage >= totalPages || ledgerLoading}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
