'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useState, createElement, useEffect, useMemo, useCallback, memo } from 'react';
import { Search, Activity, HelpCircle, Download, ChevronDown, User, Shield, Database, CreditCard, LogOut, LucideIcon } from 'lucide-react';
import { checkApiKeyStatus } from '@/utils/api';
import { useAuth } from '@/utils/auth';

const ANIMATION_DURATION = {
    SIDEBAR: 500,
    TEXT: 300,
    SUBMENU: 500,
    ICON_HOVER: 200,
    COLOR_TRANSITION: 200,
    HOVER_SCALE: 200,
} as const;

const DIMENSIONS = {
    SIDEBAR_EXPANDED: 220,
    SIDEBAR_COLLAPSED: 64,
    ICON_SIZE: 18,
    USER_AVATAR_SIZE: 32,
    HEADER_HEIGHT: 64,
} as const;

const ANIMATION_DELAYS = {
    BASE: 0,
    INCREMENT: 50,
    TEXT_BASE: 250,
    SUBMENU_INCREMENT: 30,
} as const;

interface NavigationItem {
    name: string;
    href?: string;
    action?: () => void;
    icon: LucideIcon | string;
    isLucide: boolean;
    hasSubmenu?: boolean;
    ariaLabel?: string;
}

interface SubmenuItem {
    name: string;
    href: string;
    icon: LucideIcon | string;
    isLucide: boolean;
    ariaLabel?: string;
}

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: (collapsed: boolean) => void;
    onSearchClick?: () => void;
}

interface AnimationStyles {
    text: React.CSSProperties;
    submenu: React.CSSProperties;
    sidebarContainer: React.CSSProperties;
    textContainer: React.CSSProperties;
}

const useAnimationStyles = (isCollapsed: boolean) => {
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        setIsAnimating(true);
        const timer = setTimeout(() => setIsAnimating(false), ANIMATION_DURATION.SIDEBAR);
        return () => clearTimeout(timer);
    }, [isCollapsed]);

    const getTextAnimationStyle = useCallback(
        (delay = 0): React.CSSProperties => ({
            willChange: 'opacity',
            transition: `opacity ${ANIMATION_DURATION.TEXT}ms ease-out`,
            transitionDelay: `${delay}ms`,
            opacity: isCollapsed ? 0 : 1,
            pointerEvents: isCollapsed ? 'none' : 'auto',
        }),
        [isCollapsed]
    );

    const getSubmenuAnimationStyle = useCallback(
        (isExpanded: boolean): React.CSSProperties => ({
            willChange: 'opacity, max-height',
            transition: `all ${ANIMATION_DURATION.SUBMENU}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`,
            maxHeight: isCollapsed || !isExpanded ? '0px' : '400px',
            opacity: isCollapsed || !isExpanded ? 0 : 1,
        }),
        [isCollapsed]
    );

    const sidebarContainerStyle: React.CSSProperties = useMemo(
        () => ({
            willChange: 'width',
            transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }),
        []
    );

    const getTextContainerStyle = useCallback(
        (): React.CSSProperties => ({
            width: isCollapsed ? '0px' : '150px',
            overflow: 'hidden',
            transition: `width ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }),
        [isCollapsed]
    );

    const getUniformTextStyle = useCallback(
        (): React.CSSProperties => ({
            willChange: 'opacity',
            opacity: isCollapsed ? 0 : 1,
            transition: `opacity 300ms ease ${isCollapsed ? '0ms' : '200ms'}`,
            whiteSpace: 'nowrap' as const,
        }),
        [isCollapsed]
    );

    return {
        isAnimating,
        getTextAnimationStyle,
        getSubmenuAnimationStyle,
        sidebarContainerStyle,
        getTextContainerStyle,
        getUniformTextStyle,
    };
};

const IconComponent = memo<{
    icon: LucideIcon | string;
    isLucide: boolean;
    alt: string;
    className?: string;
}>(({ icon, isLucide, alt, className = 'h-[18px] w-[18px] transition-transform duration-200' }) => {
    if (isLucide) {
        return createElement(icon as LucideIcon, { className, 'aria-hidden': true });
    }

    return <Image src={icon as string} alt={alt} width={18} height={18} className={className} loading="lazy" />;
});

IconComponent.displayName = 'IconComponent';

const SidebarComponent = ({ isCollapsed, onToggle, onSearchClick }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();
    const { user: userInfo, isLoading } = useAuth();
    const [isSettingsExpanded, setIsSettingsExpanded] = useState(pathname.startsWith('/settings'));
    const [hasApiKey, setHasApiKey] = useState<boolean | null>(null);

    const { isAnimating, getTextAnimationStyle, getSubmenuAnimationStyle, sidebarContainerStyle, getTextContainerStyle, getUniformTextStyle } =
        useAnimationStyles(isCollapsed);

    useEffect(() => {
        checkApiKeyStatus()
            .then(status => setHasApiKey(status.hasApiKey))
            .catch(err => {
                console.error('Failed to check API key status:', err);
                setHasApiKey(null); // Set to null on error
            });
    }, []);

    useEffect(() => {
        if (pathname.startsWith('/settings')) {
            setIsSettingsExpanded(true);
        }
    }, [pathname]);

    const navigation = useMemo<NavigationItem[]>(
        () => [
            {
                name: 'Search',
                action: onSearchClick,
                icon: '/search.svg',
                isLucide: false,
                ariaLabel: 'Open search',
            },
            {
                name: 'My Activity',
                href: '/activity',
                icon: '/activity.svg',
                isLucide: false,
                ariaLabel: 'View my activity',
            },
        ],
        [onSearchClick]
    );

    const settingsSubmenu = useMemo<SubmenuItem[]>(
        () => [
            { name: 'Personal Profile', href: '/settings', icon: '/user.svg', isLucide: false, ariaLabel: 'Personal profile settings' },
            { name: 'Data & privacy', href: '/settings/privacy', icon: '/privacy.svg', isLucide: false, ariaLabel: 'Data and privacy settings' },
            { name: 'Billing', href: '/settings/billing', icon: '/credit-card.svg', isLucide: false, ariaLabel: 'Billing settings' },
        ],
        []
    );

    

    const toggleSidebar = useCallback(() => {
        onToggle(!isCollapsed);
    }, [isCollapsed, onToggle]);

    const toggleSettings = useCallback(() => {
        if (!pathname.startsWith('/settings')) {
            setIsSettingsExpanded(prev => !prev);
        }
    }, [pathname]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('jarvis_user');
        localStorage.removeItem('openai_api_key');
        localStorage.removeItem('user_info');
        router.push('/login');
    }, [router]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, action?: () => void) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            action?.();
        }
    }, []);

    const renderNavigationItem = useCallback(
        (item: NavigationItem, index: number) => {
            const isActive = item.href ? pathname.startsWith(item.href) : false;
            const animationDelay = 0;

            const baseButtonClasses = `
      group flex items-center rounded-[8px] px-[12px] py-[10px] text-[14px] text-[#282828] w-full relative
      transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
      focus:outline-none
    `;

            const getStateClasses = (isActive: boolean) =>
                isActive ? 'bg-[#f2f2f2] text-[#282828]' : 'text-[#282828] hover:text-[#282828] hover:bg-[#f7f7f7]';

            if (item.action) {
                return (
                    <li key={item.name}>
                        <button
                            onClick={item.action}
                            onKeyDown={e => handleKeyDown(e, item.action)}
                            className={`${baseButtonClasses} ${getStateClasses(false)}`}
                            title={isCollapsed ? item.name : undefined}
                            aria-label={item.ariaLabel || item.name}
                            style={{ willChange: 'background-color, color' }}
                        >
                            <div className="shrink-0 flex items-center justify-center w-5 h-5">
                                <IconComponent icon={item.icon} isLucide={item.isLucide} alt={`${item.name} icon`} />
                            </div>

                            <div className="ml-[12px] overflow-hidden" style={getTextContainerStyle()}>
                                <span className="block text-left" style={getUniformTextStyle()}>
                                    {item.name}
                                </span>
                            </div>
                        </button>
                    </li>
                );
            }

            if (item.hasSubmenu) {
                return (
                    <li key={item.name}>
                        <button
                            onClick={toggleSettings}
                            onKeyDown={e => handleKeyDown(e, toggleSettings)}
                            className={`${baseButtonClasses} ${getStateClasses(isActive)}`}
                            title={isCollapsed ? item.name : undefined}
                            aria-label={item.ariaLabel || item.name}
                            aria-expanded={isSettingsExpanded}
                            aria-controls="settings-submenu"
                            style={{ willChange: 'background-color, color' }}
                        >
                            <div className="shrink-0 flex items-center justify-center w-5 h-5">
                                <IconComponent icon={item.icon} isLucide={item.isLucide} alt={`${item.name} icon`} />
                            </div>

                            <div className="ml-[12px] overflow-hidden flex items-center" style={getTextContainerStyle()}>
                                <span className="flex-1 text-left" style={getUniformTextStyle()}>
                                    {item.name}
                                </span>
                                <ChevronDown
                                    className="h-3 w-3 ml-1.5 shrink-0"
                                    aria-hidden="true"
                                    style={{
                                        willChange: 'transform, opacity',
                                        transition: `all ${ANIMATION_DURATION.HOVER_SCALE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                                        transform: `rotate(${isSettingsExpanded ? 180 : 0}deg) ${isCollapsed ? 'scale(0)' : 'scale(1)'}`,
                                        opacity: isCollapsed ? 0 : 1,
                                    }}
                                />
                            </div>
                        </button>

                        <div
                            id="settings-submenu"
                            className="overflow-hidden"
                            style={getSubmenuAnimationStyle(isSettingsExpanded)}
                            role="region"
                            aria-labelledby="settings-button"
                        >
                            <ul className="mt-[4px] space-y-0 pl-[22px]" role="menu">
                                {settingsSubmenu.map((subItem, subIndex) => (
                                    <li key={subItem.name} role="none">
                                        <Link
                                            href={subItem.href}
                                            className={`
                                  group flex items-center rounded-lg px-[12px] py-[8px] text-[13px] gap-x-[9px]
                      focus:outline-none
                                  ${
                                      pathname === subItem.href
                                          ? 'bg-subtle-active-bg text-[#282828]'
                                          : 'text-[#282828] hover:text-[#282828] hover:bg-[#f7f7f7]'
                                  }
                      transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                                `}
                                            style={{
                                                willChange: 'background-color, color',
                                            }}
                                            role="menuitem"
                                            aria-label={subItem.ariaLabel || subItem.name}
                                        >
                                            <IconComponent
                                                icon={subItem.icon}
                                                isLucide={subItem.isLucide}
                                                alt={`${subItem.name} icon`}
                                                className="h-4 w-4 shrink-0"
                                            />
                                            <span className="whitespace-nowrap">{subItem.name}</span>
                                        </Link>
                                    </li>
                                ))}
                                <li role="none">
                                    <Link
                                        href="/login"
                                        className={`
                                    group flex items-center rounded-lg px-[12px] py-[8px] text-[13px] gap-x-[9px] 
                                    text-[#282828] hover:text-[#282828] hover:bg-[#f7f7f7] w-full 
                                    transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                                    focus:outline-none
                                  `}
                                        style={{ willChange: 'background-color, color' }}
                                        role="menuitem"
                                        aria-label="Login"
                                    >
                                        <LogOut className="h-3.5 w-3.5 shrink-0 transform -scale-x-100" aria-hidden="true" />
                                        <span className="whitespace-nowrap">Login</span>
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </li>
                );
            }

            return (
                <li key={item.name}>
                    <Link
                        href={item.href || '#'}
                        className={`
                        group flex items-center rounded-[8px] text-[14px] px-[12px] py-[10px] relative
            focus:outline-none
            ${getStateClasses(isActive)}
            transition-colors duration-${ANIMATION_DURATION.COLOR_TRANSITION} ease-out
                        ${isCollapsed ? '' : ''}
                      `}
                        title={isCollapsed ? item.name : undefined}
                        aria-label={item.ariaLabel || item.name}
                        style={{ willChange: 'background-color, color' }}
                    >
                        <div className="shrink-0 flex items-center justify-center w-5 h-5">
                            <IconComponent icon={item.icon} isLucide={item.isLucide} alt={`${item.name} icon`} />
                        </div>

                        <div className="ml-[12px] overflow-hidden" style={getTextContainerStyle()}>
                            <span className="block text-left" style={getUniformTextStyle()}>
                                {item.name}
                            </span>
                        </div>
                    </Link>
                </li>
            );
        },
        [
            pathname,
            isCollapsed,
            isSettingsExpanded,
            toggleSettings,
            handleLogout,
            handleKeyDown,
            getUniformTextStyle,
            getTextContainerStyle,
            getSubmenuAnimationStyle,
            settingsSubmenu,
        ]
    );

    const getUserDisplayName = useCallback(() => {
        return userInfo?.display_name || 'Guest';
    }, [userInfo]);

    const getUserInitial = useCallback(() => {
        return userInfo?.display_name ? userInfo.display_name.charAt(0).toUpperCase() : 'G';
    }, [userInfo]);

    

    return (
        <aside
            className={`flex h-full flex-col bg-white border-r py-3 px-2 border-[#e5e5e5] relative ${isCollapsed ? 'w-[60px]' : 'w-[220px]'}`}
            style={sidebarContainerStyle}
            role="navigation"
            aria-label="main navigation"
            aria-expanded={!isCollapsed}
        >
            <header className={`group relative h-6 flex shrink-0 items-center justify-between`}>
                {isCollapsed ? (
                    <Link href="https://jarvis.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                        <Image src="/symbol.svg" alt="Logo" width={20} height={20} className="mx-3 shrink-0" />
                        <button
                            onClick={toggleSidebar}
                            onKeyDown={e => handleKeyDown(e, toggleSidebar)}
                            className={`${
                                isCollapsed ? '' : ''
                            } "absolute inset-0 flex items-center justify-center text-gray-500 hover:text-gray-800 rounded-md opacity-0 scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out focus:outline-none`}
                            aria-label="Open sidebar"
                        >
                            <Image src="/unfold.svg" alt="Open" width={18} height={18} className="h-4.5 w-4.5" />
                        </button>
                    </Link>
                ) : (
                    <>
                        <Link href="https://jarvis.com" target="_blank" rel="noopener noreferrer" className="flex items-center">
                            <Image
                                src={isCollapsed ? '/symbol.svg' : '/word.svg'}
                                alt="Jarvis Logo"
                                width={50}
                                height={14}
                                className="mx-3 shrink-0"
                            />
                        </Link>
                        <button
                            onClick={toggleSidebar}
                            onKeyDown={e => handleKeyDown(e, toggleSidebar)}
                            className={`${
                                isCollapsed ? '' : ''
                            } text-gray-500 hover:text-gray-800 p-1 rounded-[4px] hover:bg-[#f7f7f7] h-6 w-6 transition-colors focus:outline-none`}
                            aria-label="Close sidebar"
                        >
                            <Image src="/unfold.svg" alt="Close" width={16} height={16} className="transform rotate-180" />
                        </button>
                    </>
                )}
            </header>

            <nav className="flex flex-1 flex-col pt-8" role="navigation" aria-label="Main menu">
                <ul role="list" className="flex flex-1 flex-col">
                    <li>
                        <ul role="list" className="">
                            {navigation.map(renderNavigationItem)}
                        </ul>
                    </li>
                </ul>

                <button
                    onClick={toggleSidebar}
                    onKeyDown={e => handleKeyDown(e, toggleSidebar)}
                    className={`${
                        isCollapsed ? '' : 'opacity-0'
                    } "absolute inset-0 flex items-center justify-center w-full h-[36px] mb-[8px] rounded-[20px] flex justify-center items-center text-gray-500 hover:text-gray-800 rounded-md scale-90 group-hover:opacity-100 group-hover:scale-100 transition-all duration-300 ease-out focus:outline-none`}
                    aria-label="Open sidebar"
                >
                    <div className="w-[36px] h-[36px] flex items-center justify-center bg-[#f7f7f7] rounded-[20px]">
                        <Image src="/unfold.svg" alt="Open" width={18} height={18} className="h-4.5 w-4.5" />
                    </div>
                </button>

                {!isCollapsed && hasApiKey !== null && (
                    <div className="px-2.5 py-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${hasApiKey ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {hasApiKey ? 'Local running' : 'Jarvis Free System'}
                        </span>
                    </div>
                )}

                

                <div className="mt-[0px] flex items-center w-full h-[1px] px-[4px] mt-[8px] mb-[8px]">
                    <div className="w-full h-[1px] bg-[#d9d9d9]"></div>
                </div>

                <div
                    className={`mt-[0px] flex items-center ${isCollapsed ? '' : 'gap-x-[10px]'}`}
                    style={{
                        padding: isCollapsed ? '6px 8px' : '6px 8px',
                        justifyContent: isCollapsed ? 'flex-start' : 'flex-start',
                        transition: `all ${ANIMATION_DURATION.SIDEBAR}ms cubic-bezier(0.4, 0, 0.2, 1)`,
                    }}
                    role="region"
                    aria-label="User profile"
                >
                    <div
                        className={`
              h-[30px] w-[30px] rounded-full border border-[#8d8d8d] flex items-center justify-center text-[#282828] text-[13px] 
              shrink-0 cursor-pointer transition-all duration-${ANIMATION_DURATION.ICON_HOVER} 
              hover:bg-[#f7f7f7] focus:outline-none
            `}
                        title={getUserDisplayName()}
                        style={{ willChange: 'background-color, transform' }}
                        tabIndex={0}
                        role="button"
                        aria-label={`User: ${getUserDisplayName()}`}
                        onKeyDown={e =>
                            handleKeyDown(e, () => {
                                router.push('/login');
                            })
                        }
                    >
                        {getUserInitial()}
                    </div>

                    <div className="ml-[0px] overflow-hidden" style={getTextContainerStyle()}>
                        <span className="block text-[13px] leading-6 text-[#282828]" style={getUniformTextStyle()}>
                            {getUserDisplayName()}
                        </span>
                    </div>
                </div>
            </nav>
        </aside>
    );
};

const Sidebar = memo(SidebarComponent);
Sidebar.displayName = 'Sidebar';

export default Sidebar;
