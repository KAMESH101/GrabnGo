/**
 * Role Switcher Component
 * Allows dual-role users to seamlessly switch between Customer and Owner modes
 * Only visible when user has multiple roles
 */

import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { User, Briefcase, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export const RoleSwitcher: React.FC = () => {
    const { user, switchRole } = useAuth();
    const [switching, setSwitching] = useState(false);

    // Don't render if user doesn't exist or only has one role
    if (!user || !user.roles || user.roles.length <= 1) {
        return null;
    }

    const handleRoleSwitch = async (newRole: UserRole) => {
        if (newRole === user.activeRole) return;

        try {
            setSwitching(true);
            await switchRole(newRole);
        } catch (error) {
            console.error('❌ [ROLE SWITCHER] Failed to switch role:', error);
            alert('Failed to switch role. Please try again.');
        } finally {
            setSwitching(false);
        }
    };

    const roleConfig = {
        customer: {
            label: 'Customer Mode',
            icon: User,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
        },
        owner: {
            label: 'Owner Mode',
            icon: Briefcase,
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        admin: {
            label: 'Admin Mode',
            icon: User,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    };

    const currentConfig = roleConfig[user.activeRole];
    const CurrentIcon = currentConfig.icon;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={`flex items-center gap-2 ${currentConfig.bg} border-2 hover:opacity-80 transition-opacity`}
                    disabled={switching}
                >
                    <CurrentIcon className={`w-4 h-4 ${currentConfig.color}`} />
                    <span className={`font-medium ${currentConfig.color}`}>
                        {currentConfig.label}
                    </span>
                    <ChevronDown className={`w-4 h-4 ${currentConfig.color}`} />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
                {user.roles.map((role) => {
                    const config = roleConfig[role];
                    const Icon = config.icon;
                    const isActive = role === user.activeRole;

                    return (
                        <DropdownMenuItem
                            key={role}
                            onClick={() => handleRoleSwitch(role)}
                            className={`flex items-center gap-2 cursor-pointer ${isActive ? config.bg : ''
                                }`}
                            disabled={isActive || switching}
                        >
                            <Icon className={`w-4 h-4 ${config.color}`} />
                            <span className={isActive ? 'font-semibold' : ''}>
                                {config.label}
                            </span>
                            {isActive && (
                                <span className="ml-auto text-xs text-gray-500">Active</span>
                            )}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
