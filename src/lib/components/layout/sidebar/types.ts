import type { Component } from 'svelte';

export interface SidebarItemType {
    label: string;
    icon?: Component<any>;
    href?: string;
    onClick?: () => void;
    isActive?: boolean;
    class?: string;
    items?: SidebarItemType[];
    defaultExpanded?: boolean;
    component?: Component<any>;
    componentProps?: Record<string, any>;
    [key: string]: any;
}
