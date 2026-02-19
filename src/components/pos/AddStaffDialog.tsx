import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Staff } from '@/types/pos';

interface AddStaffDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAddStaff: (staff: Staff) => void;
}

export function AddStaffDialog({ open, onOpenChange, onAddStaff }: AddStaffDialogProps) {
    const [name, setName] = useState('');
    const [role, setRole] = useState<Staff['role']>('waiter');
    const [pin, setPin] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!name.trim() || !pin.trim()) {
            setError('All fields are required');
            return;
        }

        if (pin.length !== 4 || isNaN(Number(pin))) {
            setError('PIN must be a 4-digit number');
            return;
        }

        const newStaff: Staff = {
            id: `staff-${Date.now()}`,
            name,
            role,
            pin,
            isOnline: false,
            dailyOnlineMinutes: 0
        };

        onAddStaff(newStaff);
        onOpenChange(false);

        // Reset form
        setName('');
        setRole('waiter');
        setPin('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Staff Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select value={role} onValueChange={(value: Staff['role']) => setRole(value)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="waiter">Waiter</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                                <SelectItem value="chef">Chef</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pin">PIN Code (4 digits)</Label>
                        <Input
                            id="pin"
                            value={pin}
                            onChange={(e) => {
                                // Only allow numbers and max 4 chars
                                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
                                setPin(value);
                            }}
                            placeholder="1234"
                            type="password"
                            inputMode="numeric"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Add Staff</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
