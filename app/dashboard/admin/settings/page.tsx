'use client';

import { useEffect, useState } from 'react';
import { backendApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface TenantConfig {
  allow_discrepancy_mismatch: boolean;
  annuity_payout_fee: number;
  start_of_fiscal_year: string;
  life_insurance_threshold: number;
  life_insurance_threshold_months: number;
}

export default function AdminSettingsPage() {
  const [initialConfig, setInitialConfig] = useState<TenantConfig | null>(null);
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  const tenantId = '1';

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const data = await backendApiClient.tenantConfig.get(tenantId);
        setInitialConfig(data);
        setConfig(data);
      } catch (error) {
        console.error('Failed to fetch tenant config', error);
        toast.error('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [tenantId]);

  useEffect(() => {
    if (config && initialConfig) {
      const dirty = JSON.stringify(config) !== JSON.stringify(initialConfig);
      setIsDirty(dirty);
    }
  }, [config, initialConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (!config) return;
    const updatedValue = type === 'number' ? parseFloat(value) : value;
    setConfig({ ...config, [name]: updatedValue });
  };

  const handleSwitchChange = (checked: boolean, name: string) => {
    if (!config) return;
    setConfig({ ...config, [name]: checked });
  };

  const handleSave = async () => {
    if (!config) return;
    try {
      await backendApiClient.tenantConfig.update(tenantId, config);
      setInitialConfig(config);
      toast.success('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save tenant config', error);
      toast.error('Failed to save settings.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>Could not load settings.</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Tenant Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="allow_discrepancy_mismatch">Allow Discrepancy Mismatch</Label>
            <Switch
              id="allow_discrepancy_mismatch"
              name="allow_discrepancy_mismatch"
              checked={config.allow_discrepancy_mismatch}
              onCheckedChange={(checked) => handleSwitchChange(checked, 'allow_discrepancy_mismatch')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="annuity_payout_fee">Annuity Payout Fee</Label>
            <Input
              id="annuity_payout_fee"
              name="annuity_payout_fee"
              type="number"
              value={config.annuity_payout_fee}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="start_of_fiscal_year">Start of Fiscal Year</Label>
            <Input
              id="start_of_fiscal_year"
              name="start_of_fiscal_year"
              type="date"
              value={new Date(config.start_of_fiscal_year).toISOString().split('T')[0]}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="life_insurance_threshold">Life Insurance Threshold</Label>
            <Input
              id="life_insurance_threshold"
              name="life_insurance_threshold"
              type="number"
              value={config.life_insurance_threshold}
              onChange={handleInputChange}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="life_insurance_threshold_months">Life Insurance Threshold Months</Label>
            <Input
              id="life_insurance_threshold_months"
              name="life_insurance_threshold_months"
              type="number"
              value={config.life_insurance_threshold_months}
              onChange={handleInputChange}
            />
          </div>
          <Button onClick={handleSave} disabled={!isDirty}>
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}