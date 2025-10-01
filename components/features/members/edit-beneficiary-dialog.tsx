'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// TODO: Move these interfaces to a shared types file
interface Coverage {
  id: number;
  created_at: string;
  updated_at: string;
  start_date: string;
  end_date?: string;
  member_id: number;
}

interface LifeInsurancePerson {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  suffix?: string;
  ssn?: string;
  birth_date?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}

export interface LifeInsuranceCoverage extends Coverage {
  beneficiary_info_received?: boolean;
  beneficiary?: string;
  life_insurance_person_id?: number;
  life_insurance_person?: LifeInsurancePerson;
}

interface EditBeneficiaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coverage: LifeInsuranceCoverage | null;
  onSave: (updatedCoverage: LifeInsuranceCoverage) => void;
}

export function EditBeneficiaryDialog({
  isOpen,
  onClose,
  coverage,
  onSave,
}: EditBeneficiaryDialogProps) {
  const [person, setPerson] = useState<Partial<LifeInsurancePerson>>({});
  const [infoReceived, setInfoReceived] = useState(false);

  useEffect(() => {
    if (coverage) {
      setPerson(coverage.life_insurance_person || {});
      setInfoReceived(coverage.beneficiary_info_received || false);
    } else {
      setPerson({});
      setInfoReceived(false);
    }
  }, [coverage]);

  const handlePersonChange = (field: keyof LifeInsurancePerson, value: any) => {
    setPerson(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (coverage) {
      const personToSave = { ...person };
      if (personToSave.birth_date && !personToSave.birth_date.includes('T')) {
        personToSave.birth_date = new Date(personToSave.birth_date + 'T00:00:00.000Z').toISOString();
      }

      onSave({
        ...coverage,
        life_insurance_person: personToSave as LifeInsurancePerson,
        beneficiary_info_received: infoReceived,
        beneficiary: `${person.first_name || ''} ${person.last_name || ''}`.trim(),
      });
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Edit Beneficiary</DialogTitle>
          <DialogDescription>
            Update the beneficiary information for this life insurance coverage.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first-name">First Name</Label>
              <Input
                id="first-name"
                value={person.first_name || ''}
                onChange={(e) => handlePersonChange('first_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="last-name">Last Name</Label>
              <Input
                id="last-name"
                value={person.last_name || ''}
                onChange={(e) => handlePersonChange('last_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="middle-name">Middle Name</Label>
              <Input
                id="middle-name"
                value={person.middle_name || ''}
                onChange={(e) => handlePersonChange('middle_name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="suffix">Suffix</Label>
              <Input
                id="suffix"
                value={person.suffix || ''}
                onChange={(e) => handlePersonChange('suffix', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ssn">SSN</Label>
              <Input
                id="ssn"
                value={person.ssn || ''}
                onChange={(e) => handlePersonChange('ssn', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="birth-date">Birth Date</Label>
              <Input
                id="birth-date"
                type="date"
                value={person.birth_date ? person.birth_date.split('T')[0] : ''}
                onChange={(e) => handlePersonChange('birth_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={person.gender || 'OTHER'}
                onValueChange={(value) => handlePersonChange('gender', value)}
              >
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Male</SelectItem>
                  <SelectItem value="FEMALE">Female</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2 pt-4">
            <Checkbox
              id="info-received"
              checked={infoReceived}
              onCheckedChange={(checked) => setInfoReceived(Boolean(checked))}
            />
            <Label htmlFor="info-received">Beneficiary Information Received</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}