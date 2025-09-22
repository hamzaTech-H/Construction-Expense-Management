import {
    Archive,
    BarChartSquare02,
    CheckDone01,
    CurrencyDollarCircle,
    Grid03,
    HomeLine,
    LayoutAlt01,
    LineChartUp03,
    MessageChatCircle,
    NotificationBox,
    Package,
    PieChart03,
    Rows01,
    Settings01,
    Star01,
    User01,
    Users01,
    UsersPlus,
} from "@untitledui/icons";
import type { NavItemType } from "@/components/application/app-navigation/config";
import { SidebarNavigationSimple } from "@/components/application/app-navigation/sidebar-navigation/sidebar-simple";
import { BadgeWithDot } from "@/components/base/badges/badges";

const navItemsSimple: NavItemType[] = [
    {
        label: "Home",
        href: "/",
        icon: HomeLine,
        items: [
            { label: "Overview", href: "/overview", icon: Grid03 },
            { label: "Products", href: "/products", icon: Package },
            { label: "Orders", href: "/orders", icon: CurrencyDollarCircle },
            { label: "Customers", href: "/customers", icon: Users01 },
        ],
    },
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: BarChartSquare02,
        items: [
            { label: "Overview", href: "/dashboard/overview", icon: Grid03 },
            { label: "Notifications", href: "/dashboard/notifications", icon: NotificationBox, badge: 10 },
            { label: "Analytics", href: "/dashboard/analytics", icon: LineChartUp03 },
            { label: "Saved reports", href: "/dashboard/saved-reports", icon: Star01 },
        ],
    },
    {
        label: "Projects",
        href: "/projects",
        icon: Rows01,
        items: [
            { label: "View all", href: "/projects/all", icon: Rows01 },
            { label: "Personal", href: "/projects/personal", icon: User01 },
            { label: "Team", href: "/projects/team", icon: Users01 },
            { label: "Shared with me", href: "/projects/shared-with-me", icon: UsersPlus },
            { label: "Archive", href: "/projects/archive", icon: Archive },
        ],
    },
    {
        label: "Tasks",
        href: "/tasks",
        icon: CheckDone01,
        badge: 10,
    },
    {
        label: "Reporting",
        href: "/reporting",
        icon: PieChart03,
    },
    {
        label: "Users",
        href: "/users",
        icon: Users01,
    },
];

export const SidebarNavigationSimpleDemo = () => (
    <SidebarNavigationSimple
        items={navItemsSimple}
        footerItems={[
            {
                label: "Settings",
                href: "/settings",
                icon: Settings01,
            },
            {
                label: "Support",
                href: "/support",
                icon: MessageChatCircle,
                badge: (
                    <BadgeWithDot color="success" type="modern" size="sm">
                        Online
                    </BadgeWithDot>
                ),
            },
            {
                label: "Open in browser",
                href: "https://www.untitledui.com/",
                icon: LayoutAlt01,
            },
        ]}
        // featureCard={
        //     <FeaturedCardProgressBar
        //         title="Used space"
        //         description="Your team has used 80% of your available space. Need more?"
        //         confirmLabel="Upgrade plan"
        //         progress={80}
        //         className="hidden md:flex"
        //         onDismiss={() => {}}
        //         onConfirm={() => {}}
        //     />
        // }
    />
);
