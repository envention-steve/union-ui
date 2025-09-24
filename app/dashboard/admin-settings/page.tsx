'use client';

import { redirect } from 'next/navigation';

export default function AdminSettingsRedirectPage() {
  // Maintain backwards compatibility with tests expecting this route
  redirect('/dashboard/admin/settings');
}
