import { useState } from 'react';
import { usePOS } from '@/store/posStore';
import { staff } from '@/data/sampleData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    User,
    ChevronRight,
    UtensilsCrossed,
    Delete
} from 'lucide-react';
import { toast } from 'sonner';

export function LoginView() {
    const { dispatch } = usePOS();
    const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
    const [pin, setPin] = useState('');

    const selectedStaff = staff.find(s => s.id === selectedStaffId);

    const handlePinInput = (digit: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + digit);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    const handleLogin = () => {
        if (!selectedStaff) return;

        if (pin === selectedStaff.pin) {
            dispatch({
                type: 'SET_CURRENT_STAFF',
                payload: {
                    id: selectedStaff.id,
                    name: selectedStaff.name,
                    role: selectedStaff.role
                }
            });
            toast.success(`Welcome back, ${selectedStaff.name}!`);
        } else {
            toast.error('Invalid PIN');
            setPin('');
        }
    };

    return (
        <div className="flex h-screen w-full items-center justify-center bg-slate-900 p-4">
            <div className="w-full max-w-md space-y-8">
                {/* Header */}
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500">
                        <UtensilsCrossed className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">C-BOY RESTAURANT</h1>
                    <p className="mt-2 text-slate-400">POS Management System</p>
                </div>

                {!selectedStaff ? (
                    /* User Selection */
                    <Card className="border-slate-800 bg-slate-950/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle className="text-center text-white">Select User</CardTitle>
                            <CardDescription className="text-center text-slate-400">
                                Choose your account to login
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {staff.map((member) => (
                                <Button
                                    key={member.id}
                                    variant="outline"
                                    className="flex h-16 w-full items-center justify-between border-slate-800 bg-slate-900/50 p-4 text-white hover:bg-slate-800 hover:text-white"
                                    onClick={() => setSelectedStaffId(member.id)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${member.role === 'admin' || member.role === 'manager'
                                            ? 'bg-purple-500/20 text-purple-400'
                                            : 'bg-blue-500/20 text-blue-400'
                                            }`}>
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div className="text-left">
                                            <div className="font-semibold">{member.name}</div>
                                            <div className="text-xs capitalize text-slate-400">{member.role}</div>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-500" />
                                </Button>
                            ))}
                        </CardContent>
                    </Card>
                ) : (
                    /* PIN Entry */
                    <Card className="border-slate-800 bg-slate-950/50 backdrop-blur">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-white"
                                    onClick={() => {
                                        setSelectedStaffId(null);
                                        setPin('');
                                    }}
                                >
                                    Back
                                </Button>
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-400" />
                                    <span className="text-white font-medium">{selectedStaff.name}</span>
                                </div>
                            </div>
                            <CardTitle className="text-center text-white pt-4">Enter PIN</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* PIN Display */}
                            <div className="flex justify-center gap-4">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`h-4 w-4 rounded-full transition-all ${i < pin.length ? 'bg-orange-500' : 'bg-slate-700'
                                            }`}
                                    />
                                ))}
                            </div>

                            {/* Number Pad */}
                            <div className="grid grid-cols-3 gap-4 px-4">
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                    <Button
                                        key={num}
                                        variant="outline"
                                        className="h-16 border-slate-700 bg-slate-800/50 text-2xl font-bold text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95 transition-all"
                                        onClick={() => handlePinInput(num.toString())}
                                    >
                                        {num}
                                    </Button>
                                ))}
                                <div />
                                <Button
                                    variant="outline"
                                    className="h-16 border-slate-700 bg-slate-800/50 text-2xl font-bold text-white hover:bg-slate-700 hover:border-slate-600 active:scale-95 transition-all"
                                    onClick={() => handlePinInput('0')}
                                >
                                    0
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="h-16 text-slate-400 hover:text-white hover:bg-slate-800/50 active:scale-95 transition-all"
                                    onClick={handleBackspace}
                                >
                                    <Delete className="h-6 w-6" />
                                </Button>
                            </div>

                            <Button
                                className="w-full h-12 text-lg font-semibold bg-orange-500 hover:bg-orange-600 text-white"
                                onClick={handleLogin}
                                disabled={pin.length !== 4}
                            >
                                Login
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
