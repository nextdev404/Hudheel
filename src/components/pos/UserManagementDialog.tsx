import { useState, useEffect } from 'react';
import { usePOS } from '@/store/posStore';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Staff } from '@/types/pos';
import { toast } from 'sonner';

interface UserManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    staffToEdit?: Staff | null;
}

export function UserManagementDialog({
    open,
    onOpenChange,
    staffToEdit,
}: UserManagementDialogProps) {
    const { addStaff, updateStaff } = usePOS();

    // Form State
    const [name, setName] = useState('');
    const [role, setRole] = useState<'manager' | 'waiter' | 'admin' | 'cashier' | 'chef'>('waiter');
    const [pin, setPin] = useState('');

    // Reset or populate form when dialog opens/changes
    useEffect(() => {
        if (staffToEdit) {
            setName(staffToEdit.name);
            setRole(staffToEdit.role);
            setPin(staffToEdit.pin);
        } else {
            setName('');
            setRole('waiter');
            setPin('');
        }
    }, [staffToEdit, open]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (pin.length !== 4) {
            toast.error('PIN must be exactly 4 digits');
            return;
        }

        try {
            if (staffToEdit) {
                updateStaff({
                    ...staffToEdit,
                    name,
                    role,
                    pin,
                });
                toast.success('Staff updated successfully');
            } else {
                addStaff({
                    id: `s-${Date.now()}`,
                    name,
                    role,
                    pin,
                });
                toast.success('Staff added successfully');
            }
            onOpenChange(false);
        } catch (error) {
            toast.error('Failed to save staff member');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{staffToEdit ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="role">Role</Label>
                        <Select
                            value={role}
                            onValueChange={(v: any) => setRole(v)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="waiter">Waiter</SelectItem>
                                <SelectItem value="manager">Manager</SelectItem>
                                <SelectItem value="chef">Chef</SelectItem>
                                <SelectItem value="cashier">Cashier</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="pin">PIN (4 digits)</Label>
                        <Input
                            id="pin"
                            type="text"
                            pattern="\d{4}"
                            maxLength={4}
                            value={pin}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 4) setPin(value);
                            }}
                            placeholder="1234"
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white">
                            {staffToEdit ? 'Save Changes' : 'Add Staff'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
