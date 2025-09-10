# Union Benefits SAAS - Component Examples & Implementation Patterns

## Core Component Architecture

### 1. Layout Components

#### Root Layout (App Router)
```typescript
// app/layout.tsx
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata = {
  title: 'Union Benefits Platform',
  description: 'Comprehensive benefits management for union members',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen bg-background font-sans antialiased",
        inter.variable
      )}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

#### Dashboard Layout
```typescript
// app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { DashboardHeader } from '@/components/layout/dashboard-header'
import { DashboardSidebar } from '@/components/layout/dashboard-sidebar'
import { ScrollArea } from '@/components/ui/scroll-area'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader user={session.user} />
        <main className="flex-1 p-6">
          <ScrollArea className="h-full">
            {children}
          </ScrollArea>
        </main>
      </div>
    </div>
  )
}
```

#### Dashboard Sidebar
```typescript
// components/layout/dashboard-sidebar.tsx
"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Users,
  Shield,
  FileText,
  BarChart3,
  Settings,
  Heart,
} from 'lucide-react'

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Benefits',
    href: '/dashboard/benefits',
    icon: Heart,
  },
  {
    title: 'Members',
    href: '/dashboard/members',
    icon: Users,
  },
  {
    title: 'Plans',
    href: '/dashboard/plans',
    icon: Shield,
  },
  {
    title: 'Claims',
    href: '/dashboard/claims',
    icon: FileText,
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <div className="w-64 bg-card border-r">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-union-700">
          Union Benefits
        </h2>
      </div>
      <ScrollArea className="flex-1 px-3">
        <nav className="space-y-2">
          {sidebarItems.map((item) => (
            <Button
              key={item.href}
              variant={pathname === item.href ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                pathname === item.href && 'bg-union-100 text-union-900'
              )}
              asChild
            >
              <Link href={item.href}>
                <item.icon className="mr-2 h-4 w-4" />
                {item.title}
              </Link>
            </Button>
          ))}
        </nav>
      </ScrollArea>
    </div>
  )
}
```

### 2. Feature Components

#### Benefits Management

##### Benefits List with Data Table
```typescript
// components/features/benefits/benefits-table.tsx
"use client"

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { MoreHorizontal, Search, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import type { Benefit } from '@union/types'

interface BenefitsTableProps {
  searchTerm?: string
  onEdit: (benefit: Benefit) => void
  onDelete: (benefitId: string) => void
}

export function BenefitsTable({ searchTerm, onEdit, onDelete }: BenefitsTableProps) {
  const [search, setSearch] = useState(searchTerm || '')

  const { data: benefits, isLoading, error } = useQuery({
    queryKey: ['benefits', search],
    queryFn: () => apiClient.benefits.list({ search }),
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Failed to load benefits. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search benefits..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 w-[300px]"
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Benefit
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Members Enrolled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {benefits?.map((benefit) => (
              <TableRow key={benefit.id}>
                <TableCell className="font-medium">
                  {benefit.name}
                </TableCell>
                <TableCell>{benefit.category}</TableCell>
                <TableCell>${benefit.monthlyPremium}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(benefit.status)}>
                    {benefit.status}
                  </Badge>
                </TableCell>
                <TableCell>{benefit.enrolledMembers || 0}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(benefit)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(benefit.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
```

##### Benefit Form Component
```typescript
// components/features/benefits/benefit-form.tsx
"use client"

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'

const benefitSchema = z.object({
  name: z.string().min(1, 'Benefit name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  monthlyPremium: z.number().positive('Premium must be positive'),
  deductible: z.number().min(0, 'Deductible cannot be negative'),
  coverageLimit: z.number().positive('Coverage limit must be positive'),
  isActive: z.boolean(),
  eligibilityRules: z.string().optional(),
})

type BenefitFormData = z.infer<typeof benefitSchema>

interface BenefitFormProps {
  initialData?: Partial<BenefitFormData>
  onSubmit: (data: BenefitFormData) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

const benefitCategories = [
  { value: 'health', label: 'Health Insurance' },
  { value: 'dental', label: 'Dental Coverage' },
  { value: 'vision', label: 'Vision Coverage' },
  { value: 'life', label: 'Life Insurance' },
  { value: 'disability', label: 'Disability Coverage' },
  { value: 'retirement', label: 'Retirement Plans' },
  { value: 'wellness', label: 'Wellness Programs' },
]

export function BenefitForm({ initialData, onSubmit, onCancel, isLoading }: BenefitFormProps) {
  const form = useForm<BenefitFormData>({
    resolver: zodResolver(benefitSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      category: initialData?.category || '',
      monthlyPremium: initialData?.monthlyPremium || 0,
      deductible: initialData?.deductible || 0,
      coverageLimit: initialData?.coverageLimit || 0,
      isActive: initialData?.isActive ?? true,
      eligibilityRules: initialData?.eligibilityRules || '',
    },
  })

  const handleSubmit = async (data: BenefitFormData) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Benefit' : 'Create New Benefit'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Health Plan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {benefitCategories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the benefit..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a comprehensive description of what this benefit covers.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="monthlyPremium"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Premium ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deductible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductible ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="coverageLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Coverage Limit ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="eligibilityRules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligibility Rules</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define who is eligible for this benefit..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Specify any requirements or restrictions for this benefit.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Enable this benefit for member enrollment.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Benefit'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

### 3. Authentication Components

#### Login Form
```typescript
// components/features/auth/login-form.tsx
"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { signIn } from 'next-auth/react'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-2xl font-bold text-union-700">
          Sign In
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="your.email@union.org"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

### 4. Dashboard Components

#### Stats Cards
```typescript
// components/features/dashboard/stats-cards.tsx
"use client"

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, Shield, FileText, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { cn } from '@/lib/utils'

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.dashboard.getStats(),
  })

  const cards = [
    {
      title: 'Total Members',
      value: stats?.totalMembers || 0,
      icon: Users,
      description: 'Active union members',
      trend: stats?.membersTrend || 0,
    },
    {
      title: 'Active Benefits',
      value: stats?.activeBenefits || 0,
      icon: Shield,
      description: 'Available benefit plans',
      trend: stats?.benefitsTrend || 0,
    },
    {
      title: 'Pending Claims',
      value: stats?.pendingClaims || 0,
      icon: FileText,
      description: 'Claims awaiting review',
      trend: stats?.claimsTrend || 0,
    },
    {
      title: 'Total Premiums',
      value: `$${(stats?.totalPremiums || 0).toLocaleString()}`,
      icon: DollarSign,
      description: 'Monthly premium collection',
      trend: stats?.premiumsTrend || 0,
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-6 w-[80px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon
        const isPositive = card.trend > 0
        const TrendIcon = isPositive ? TrendingUp : TrendingDown

        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {card.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendIcon className={cn(
                  "mr-1 h-3 w-3",
                  isPositive ? "text-green-600" : "text-red-600"
                )} />
                <span className={cn(
                  isPositive ? "text-green-600" : "text-red-600"
                )}>
                  {Math.abs(card.trend)}%
                </span>
                <span className="ml-1">{card.description}</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

### 5. Hooks and Utilities

#### Custom Hook for Data Tables
```typescript
// hooks/use-data-table.ts
import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface UseDataTableOptions {
  endpoint: string
  pageSize?: number
  initialSorting?: { field: string; direction: 'asc' | 'desc' }
  initialFilters?: Record<string, any>
}

export function useDataTable({
  endpoint,
  pageSize = 10,
  initialSorting,
  initialFilters = {},
}: UseDataTableOptions) {
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize,
  })
  
  const [sorting, setSorting] = useState(
    initialSorting || { field: 'createdAt', direction: 'desc' as const }
  )
  
  const [filtering, setFiltering] = useState(initialFilters)

  const queryParams = {
    page: pagination.page,
    limit: pagination.pageSize,
    sortBy: sorting.field,
    sortOrder: sorting.direction,
    ...filtering,
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [endpoint, queryParams],
    queryFn: () => apiClient.get(endpoint, { params: queryParams }),
  })

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
  }

  const handleSortChange = (field: string) => {
    setSorting(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFiltering(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  return {
    data: data?.items || [],
    totalItems: data?.total || 0,
    totalPages: Math.ceil((data?.total || 0) / pagination.pageSize),
    pagination,
    sorting,
    filtering,
    isLoading,
    error,
    refetch,
    handlePageChange,
    handleSortChange,
    handleFilterChange,
  }
}
```

#### API Client Configuration
```typescript
// lib/api-client.ts
class ApiClient {
  private baseURL: string
  private token?: string

  constructor(baseURL: string) {
    this.baseURL = baseURL
  }

  setAuthToken(token: string) {
    this.token = token
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    const headers = {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }

  // Specific API endpoints
  benefits = {
    list: (params?: any) => this.get('/api/v1/benefits', { params }),
    get: (id: string) => this.get(`/api/v1/benefits/${id}`),
    create: (data: any) => this.post('/api/v1/benefits', data),
    update: (id: string, data: any) => this.put(`/api/v1/benefits/${id}`, data),
    delete: (id: string) => this.delete(`/api/v1/benefits/${id}`),
  }

  members = {
    list: (params?: any) => this.get('/api/v1/members', { params }),
    get: (id: string) => this.get(`/api/v1/members/${id}`),
    create: (data: any) => this.post('/api/v1/members', data),
    update: (id: string, data: any) => this.put(`/api/v1/members/${id}`, data),
  }

  dashboard = {
    getStats: () => this.get('/api/v1/dashboard/stats'),
  }
}

export const apiClient = new ApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
)
```

This comprehensive component library provides a solid foundation for building the Union Benefits SAAS application with modern React patterns, proper TypeScript typing, and excellent user experience using shadcn/ui components.
