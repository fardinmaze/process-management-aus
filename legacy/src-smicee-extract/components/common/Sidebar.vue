<template>
<!-- Mobile overlay -->
<transition name="fade">
    <div v-if="mobileOpen" class="fixed inset-0 bg-black/50 z-[199]" @click="closeMobile" />
</transition>

<aside class="sidebar fixed top-16 left-0 h-[calc(100vh-4rem)] bg-white text-typo-500 flex flex-col z-[200] overflow-hidden border-r border-typo-100 transition-all duration-[250ms]" :class="{
      'sidebar--collapsed': visualCollapsed,
      'translate-x-0':      mobileOpen,
      '-translate-x-full md:translate-x-0': !mobileOpen,
    }" @mouseenter="onSidebarEnter" @mouseleave="onSidebarLeave">
    <!-- Mobile-only header (brand lives in the fixed topbar on desktop; the
         desktop collapse toggle now lives on the Dashboard row below instead
         of its own sticky button here). -->
    <div class="sticky top-0 z-10 flex items-center h-12 px-3 bg-white border-b border-typo-100 shrink-0 md:hidden">
        <div class="flex items-center justify-between w-full">
            <img src="/logo.png" alt="" class="w-[80px]  text-secondary-700 text-xl shrink-0 mx-2">
            <button class=" bg-transparent border-none text-typo-400 text-xl cursor-pointer p-1.5 rounded-md shrink-0 transition-colors line-height-1 hover:bg-typo-50 hover:text-typo-800" title="Close" aria-label="Close menu" @click="closeMobile">
                <i class="ri-close-line" />
            </button>
        </div>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 overflow-y-auto overflow-x-hidden">
        <ul class="m-0 py-0 px-2 list-none divide-y divide-typo-100">
            <li v-for="item in visibleNavItems" :key="item.key ?? item.routeName" class="py-3">
                <!-- Standalone link -->
                <router-link v-if="item.type === 'link'" :to="{ name: item.routeName }" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-typo-500 no-underline text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full border-none bg-transparent cursor-pointer text-left" :class="{ 'nav-link--active': isActive(item) }" :title="visualCollapsed ? item.label : ''" @click="closeMobile">
                    <i :class="[item.icon, 'text-lg shrink-0 w-5 text-center']" />
                    <span class="sidebar-label flex-1 overflow-hidden text-ellipsis">{{ item.label }}</span>
                    <span v-if="item.badge" class="sidebar-fade bg-secondary-700 text-white text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                        {{ item.badge }}
                    </span>
                </router-link>

                <!-- Dashboard — same "card" look as the groups below (icon +
                     subtitle), but it has no children to expand. The square
                     icon slot a real group would use for its own plus/minus
                     instead drives the sidebar's own collapse toggle
                     (`toggle()`) — this row is now the only place that
                     control lives, there's no separate sticky button for
                     it any more. -->
                <div v-else-if="item.type === 'dashboard-link'" class="workspace-card flex items-center gap-3 px-3 py-2.5 rounded-lg bg-typo-50 hover:bg-typo-100/60 w-full transition-colors" :class="isActive(item) ? 'text-secondary-700' : 'text-typo-800'">
                    <router-link :to="{ name: item.routeName }" class="flex items-center gap-3 flex-1 min-w-0 no-underline" :class="isActive(item) ? 'text-secondary-700' : 'text-typo-800'" :title="visualCollapsed ? item.label : ''" @click="closeMobile">
                        <SidebarIcon :name="item.icon" class="w-5 h-5 shrink-0" />
                        <span class="sidebar-label flex-1 min-w-0 flex flex-col items-start leading-snug overflow-hidden">
                            <span class="text-[15px] font-medium whitespace-nowrap">{{ item.label }}</span>
                            <span class="text-[10px] font-normal text-typo-400 whitespace-nowrap">{{ item.subtitle }}</span>
                        </span>
                    </router-link>
                    <button
                        type="button"
                        class="sidebar-fade hidden md:inline-flex items-center justify-center w-[26px] h-[26px] rounded-md bg-white border border-typo-100 shrink-0 text-typo-400 hover:text-typo-800 cursor-pointer"
                        :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
                        @click.stop="toggle"
                    >
                        <i :class="collapsed ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'" />
                    </button>
                </div>

                <!-- Card-style group (e.g. "My Workspace", "Operations") — any group
            with a subtitle renders as an expandable card instead of a plain
            group header, sharing the same markup/behavior across all of them. -->
                <template v-else-if="item.subtitle">
                    <button type="button" class="workspace-card flex items-center gap-3 px-3 py-2.5 rounded-lg bg-typo-50 hover:bg-typo-100/60 w-full border-none cursor-pointer text-left transition-colors" :class="isExpanded(item) ? 'text-secondary-700' : 'text-typo-800'" :title="visualCollapsed ? item.label : ''" @click="onGroupClick(item)">
                        <SidebarIcon :name="item.icon" class="w-5 h-5 shrink-0" />
                        <span class="sidebar-label flex-1 min-w-0 flex flex-col items-start leading-snug overflow-hidden">
                            <span class="text-[15px] font-medium whitespace-nowrap">{{ item.label }}</span>
                            <span class="text-[10px] font-normal text-typo-400 whitespace-nowrap">{{ item.subtitle }}</span>
                        </span>
                        <span class="sidebar-fade flex items-center justify-center w-[26px] h-[26px] rounded-md bg-white border border-typo-100 shrink-0">
                            <SidebarIcon :name="isExpanded(item) ? 'minus' : 'plus'" class="w-[18px] h-[18px]" />
                        </span>
                    </button>

                    <ul v-show="!visualCollapsed && isExpanded(item)" class="workspace-sublist m-0 py-2 pl-3 list-none flex flex-col gap-0.5" :class="{ 'nav-deep': item.deepNest }">
                        <li v-for="child in item.items" :key="child.key ?? child.routeName">
                            <!-- Separator (sections that opt in by emitting a divider item) -->
                            <hr v-if="child.type === 'divider'" class="my-2 mx-3 border-0 border-t border-typo-100">

                            <!-- Nested expandable subgroup (e.g. "EOD Reports") -->
                            <template v-else-if="child.type === 'group'">
                                <button type="button" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-typo-500 text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full border-none bg-transparent cursor-pointer text-left" :class="{ 'nav-link--active': isGroupActive(child) && !isExpanded(child) }" @click="onGroupClick(child, item)">
                                    <i v-if="isRemixIcon(child.icon)" :class="[child.icon, 'text-base shrink-0 w-4 text-center']" />
                                    <SidebarIcon v-else :name="workspaceIcon(child)" class="w-4 h-4 shrink-0" />
                                    <span class="flex-1 overflow-hidden text-ellipsis">{{ child.label }}</span>
                                    <span v-if="badgeFor(child) !== undefined" class="bg-secondary-700 text-white text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                        {{ badgeFor(child) }}
                                    </span>
                                    <i class="ri-arrow-down-s-line text-base shrink-0 transition-transform duration-200" :class="{ 'rotate-180': isExpanded(child) }" />
                                </button>

                                <ul v-show="isExpanded(child)" class="submenu m-0 py-0 list-none mt-0.5">
                                    <li v-for="grandchild in child.items" :key="grandchild.key ?? grandchild.routeName">
                                        <!-- Fourth level. Without this branch a group here
                                     falls through to the leaf link below and renders
                                     :to="{ name: undefined }" — a silent dead link. -->
                                        <template v-if="item.deepNest && grandchild.type === 'group'">
                                            <!-- No leading icon: a header row reads fine with just
                                         the chevron, and the 24px it frees is what keeps
                                         "Financial Statements" from truncating at 260px. -->
                                            <button type="button" class="nav-link nav-link--sub flex items-center gap-3 py-2 rounded-lg text-typo-500 text-[13px] font-semibold transition-colors whitespace-nowrap overflow-hidden w-full border-none bg-transparent cursor-pointer text-left" :class="{ 'nav-link--active': isGroupActive(grandchild) && !isExpanded(grandchild) }" @click="onGroupClick(grandchild, child)">
                                                <span class="flex-1 overflow-hidden text-ellipsis">{{ grandchild.label }}</span>
                                                <i class="ri-arrow-down-s-line text-base shrink-0 transition-transform duration-200" :class="{ 'rotate-180': isExpanded(grandchild) }" />
                                            </button>

                                            <ul v-show="isExpanded(grandchild)" class="submenu m-0 py-0 list-none mt-0.5">
                                                <li v-for="leaf in grandchild.items" :key="leaf.routeName">
                                                    <router-link :to="{ name: leaf.routeName }" class="nav-link nav-link--sub flex items-center gap-3 py-2 rounded-lg text-typo-500 no-underline text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full" :class="{ 'nav-link--active': activeRoute === leaf.routeName }" @click="closeMobile">
                                                        <i :class="[leaf.icon, 'text-base shrink-0 w-5 text-center']" />
                                                        <span class="flex-1 overflow-hidden text-ellipsis">{{ leaf.label }}</span>
                                                    </router-link>
                                                </li>
                                            </ul>
                                        </template>

                                        <router-link v-else :to="{ name: grandchild.routeName }" class="nav-link nav-link--sub flex items-center gap-3 py-2 rounded-lg text-typo-500 no-underline text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full" :class="{ 'nav-link--active': activeRoute === grandchild.routeName }" @click="closeMobile">
                                            <i :class="[grandchild.icon, 'text-base shrink-0 w-5 text-center']" />
                                            <span class="flex-1 overflow-hidden text-ellipsis">{{ grandchild.label }}</span>
                                            <span v-if="badgeFor(grandchild) !== undefined" class="bg-secondary-700 text-white text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                                {{ badgeFor(grandchild) }}
                                            </span>
                                        </router-link>
                                    </li>
                                </ul>
                            </template>

                            <!-- Flat leaf link -->
                            <router-link v-else :to="{ name: child.routeName }" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-typo-500 no-underline text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full" :class="{ 'nav-link--active': activeRoute === child.routeName }" @click="closeMobile">
                                <i v-if="isRemixIcon(child.icon)" :class="[child.icon, 'text-base shrink-0 w-4 text-center']" />
                                <SidebarIcon v-else :name="workspaceIcon(child)" class="w-4 h-4 shrink-0" />
                                <span class="flex-1 overflow-hidden text-ellipsis">{{ child.label }}</span>
                                <span v-if="badgeFor(child) !== undefined" class="bg-secondary-700 text-white text-[0.68rem] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                                    {{ badgeFor(child) }}
                                </span>
                            </router-link>
                        </li>
                    </ul>
                </template>

                <!-- Group header + children (all other groups) -->
                <template v-else>
                    <button type="button" class="nav-link flex items-center gap-3 px-3 py-2.5 rounded-lg text-typo-500 text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full border-none bg-transparent cursor-pointer text-left" :class="{ 'nav-link--active': isGroupActive(item) && !isExpanded(item) }" :title="visualCollapsed ? item.label : ''" @click="onGroupClick(item)">
                        <i :class="[item.icon, 'text-lg shrink-0 w-5 text-center']" />
                        <span class="sidebar-label flex-1 overflow-hidden text-ellipsis">{{ item.label }}</span>
                        <i class="sidebar-fade ri-arrow-down-s-line text-base shrink-0 transition-transform duration-200" :class="{ 'rotate-180': isExpanded(item) }" />
                    </button>

                    <ul v-show="!visualCollapsed && isExpanded(item)" class="submenu m-0 py-0 list-none mt-0.5">
                        <li v-for="child in item.items" :key="child.routeName">
                            <router-link :to="{ name: child.routeName }" class="nav-link nav-link--sub flex items-center gap-3 py-2 rounded-lg text-typo-500 no-underline text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full" :class="{ 'nav-link--active': activeRoute === child.routeName }" @click="closeMobile">
                                <i :class="[child.icon, 'text-base shrink-0 w-5 text-center']" />
                                <span class="flex-1 overflow-hidden text-ellipsis">{{ child.label }}</span>
                            </router-link>
                        </li>
                    </ul>
                </template>
            </li>
        </ul>
    </nav>

    <!-- Footer / Logout -->
    <div class="px-2 py-1 border-t border-typo-100 shrink-0">
        <button class="logout-btn flex items-center gap-3 px-3 py-1.5 rounded-lg text-typo-500 text-[13px] font-medium transition-colors whitespace-nowrap overflow-hidden w-full border-none bg-transparent cursor-pointer text-left" :title="visualCollapsed ? 'Logout' : ''" @click="handleLogout">
            <i class="ri-logout-box-r-line text-lg shrink-0 w-5 text-center" />
            <span class="sidebar-label">Logout</span>
        </button>
    </div>
</aside>
</template>

<script>
import {
    computed,
    ref,
    watch
} from 'vue'
import {
    useStore
} from 'vuex'
import {
    useRouter
} from 'vue-router'
import {
    NAV_ITEMS
} from '@/utils/constants'
import {
    getInitials
} from '@/utils/helpers'
import {
    can, isOrgBdVatTaxScheme
} from '@/utils/permission'
import SidebarIcon from '@/components/common/icons/SidebarIcon.vue'

// Maps "My Workspace"/"Operations" child routes to the Figma icon set (node
// 107:1838). A couple of routes reuse the closest available icon where
// Figma didn't provide a 1:1 match (Submit EOD, Raise a Ticket, My Payroll
// Slips, and most of the Operations subgroups below).
// Nested subgroups (e.g. "eod-reports", "project") are keyed by their `key`.
const WORKSPACE_ICONS = {
    MyUpdates: 'bell',
    'eod-reports': 'pencil-line',
    tickets: 'sticker-square',
    MyTickets: 'sticker-square',
    RaiseTicket: 'sticker-square',
    ApplyLeave: 'clipboard-x',
    MyRequisition: 'tag',
    MyTrainings: 'lightning',
    Grievance: 'annotation-alert',
    MyAssets: 'box',
    MyPayrollSlip: 'cube',
    // Operations
    project: 'box',
    inventory: 'cube',
    territories: 'box',
    sales: 'lightning',
    'admin-eod-reports': 'pencil-line',
    MyContact: 'phone-plus',
}

// Recursively drop permission-denied leaves and empty subgroups.
function filterNavChildren(items) {
    const kept = items
        .map((child) => {
            if (child.type === 'group') {
                const nested = filterNavChildren(child.items)
                return nested.length ? {
                    ...child,
                    items: nested
                } : null
            }
            if (child.permission && !can(child.permission)) return null
            if (child.requiresBdVatTax && !isOrgBdVatTaxScheme()) return null
            return child
        })
        .filter(Boolean)

    // A divider only means something between two surviving items, and
    // permissions can remove whatever it was separating.
    return kept.filter((child, i) =>
        child.type !== 'divider' ||
        (i > 0 && i < kept.length - 1 && kept[i - 1].type !== 'divider')
    )
}

// Does this subtree (at any depth) contain the given route?
function containsRoute(items, route) {
    return items.some((child) =>
        child.type === 'group' ? containsRoute(child.items, route) : child.routeName === route
    )
}

// Path of ancestor group keys leading to `route`, or null if not found.
function findGroupPath(items, route) {
    for (const item of items) {
        if (item.type === 'group') {
            const nested = findGroupPath(item.items, route)
            if (nested !== null) return [item.key, ...nested]
        } else if (item.routeName === route) {
            return []
        }
    }
    return null
}

export default {
    name: 'AppSidebar',
    components: {
        SidebarIcon
    },

    props: {
        // Nav counts keyed by an item's `badgeKey`. A missing key renders no
        // badge at all, so a section can declare its badges before anything
        // fetches the numbers.
        navCounts: {
            type: Object,
            default: () => ({})
        }
    },

    setup(props) {
        const store = useStore()
        const router = useRouter()

        const collapsed = computed(() => store.getters['sidebar/collapsed'])
        const mobileOpen = computed(() => store.getters['sidebar/mobileOpen'])
        const activeRoute = computed(() => store.getters['sidebar/activeRoute'])
        const user = computed(() => store.getters['auth/user'])

        // Hover-peek: while truly collapsed on desktop, hovering temporarily reveals
        // the full sidebar (logo, toggle button, labels) without changing the stored
        // collapsed state. Clicking the toggle button while peeking pins it open.
        const peek = ref(false)
        const visualCollapsed = computed(() => !mobileOpen.value && collapsed.value && !peek.value)

        function onSidebarEnter() {
            if (!mobileOpen.value) peek.value = true
        }

        function onSidebarLeave() {
            peek.value = false
        }

        const initials = computed(() => getInitials(user.value ?.name ?? ''))
        const primaryRole = computed(() => {
            const roles = store.getters['auth/userRoles']
            if (!roles.length) return ''
            const first = roles[0]
            return typeof first === 'string' ? first : first.name
        })

        // A vendor login sees a fixed, unrelated menu — never the
        // permission-driven employee NAV_ITEMS tree.
        const navSource = computed(() => NAV_ITEMS)

        // Filter permission-denied links, and drop groups left with no visible children
        const visibleNavItems = computed(() =>
            navSource.value
            .map((item) => {
                if (item.type === 'link' || item.type === 'dashboard-link') return item
                const items = filterNavChildren(item.items)
                return items.length ? {
                    ...item,
                    items
                } : null
            })
            .filter(Boolean)
        )

        function isActive(item) {
            return activeRoute.value === item.routeName
        }

        function isGroupActive(group) {
            return containsRoute(group.items, activeRoute.value)
        }

        function workspaceIcon(child) {
            return WORKSPACE_ICONS[child.routeName] ?? WORKSPACE_ICONS[child.key] ?? 'box'
        }

        // ── Collapsible groups ────────────────────────────────────────────────
        // Kept for the browser session so returning to a module reopens where
        // you left it; a new tab starts collapsed.
        const STORAGE_KEY = 'sidebar.expandedKeys'

        function restoreExpanded() {
            try {
                return new Set(JSON.parse(sessionStorage.getItem(STORAGE_KEY)) ?? [])
            } catch {
                return new Set()
            }
        }

        const expandedKeys = ref(restoreExpanded())

        watch(expandedKeys, (keys) => {
            try {
                sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...keys]))
            } catch {
                // Private browsing or quota. Persistence is a convenience here,
                // so losing it must not take the nav down with it.
            }
        })

        function isExpanded(group) {
            return expandedKeys.value.has(group.key)
        }

        function setExpanded(key, value) {
            const next = new Set(expandedKeys.value)
            value ? next.add(key) : next.delete(key)
            expandedKeys.value = next
        }

        // Accordion: inside a parent that asks for it, opening one group closes
        // its siblings. Opt-in, so everywhere else stays multi-open.
        function collapseSiblings(group, parent) {
            if (!parent || !parent.accordion) return
            const next = new Set(expandedKeys.value)
            for (const sibling of parent.items) {
                if (sibling.type === 'group' && sibling.key !== group.key) next.delete(sibling.key)
            }
            expandedKeys.value = next
        }

        function onGroupClick(group, parent) {
            if (visualCollapsed.value) {
                store.dispatch('sidebar/expand')
                collapseSiblings(group, parent)
                setExpanded(group.key, true)
                return
            }
            if (isExpanded(group)) {
                setExpanded(group.key, false)
                return
            }
            collapseSiblings(group, parent)
            setExpanded(group.key, true)
        }

        function isRemixIcon(icon) {
            return typeof icon === 'string' && icon.startsWith('ri-')
        }

        // A leaf's own count, or the sum of its descendants' — so a collapsed
        // group still shows what is waiting inside it. Undefined rather than
        // zero when nothing supplies a count, which renders no badge.
        function badgeFor(node) {
            if (node.type === 'group') {
                const counts = node.items.map(badgeFor).filter((n) => n !== undefined)
                return counts.length ? counts.reduce((a, b) => a + b, 0) : undefined
            }
            return node.badgeKey ? props.navCounts[node.badgeKey] : undefined
        }

        // Auto-expand whichever group (at any depth) contains the current route
        watch(
            [activeRoute, visibleNavItems],
            ([route, groups]) => {
                for (const g of groups) {
                    if (g.type !== 'group') continue
                    const nested = findGroupPath(g.items, route)
                    if (nested !== null) {
                        // Under accordion the active chain is the only thing left
                        // open — otherwise a restored session could reopen several
                        // siblings and defeat the one-at-a-time rule.
                        if (g.accordion) {
                            const keep = new Set(nested)
                            for (const sibling of g.items) {
                                if (sibling.type === 'group' && !keep.has(sibling.key)) {
                                    setExpanded(sibling.key, false)
                                }
                            }
                        }
                        setExpanded(g.key, true)
                        nested.forEach((key) => setExpanded(key, true))
                    }
                }
            }, {
                immediate: true
            }
        )

        function toggle() {
            // Clear hover-peek so the click takes effect immediately — otherwise,
            // if the cursor is still over the sidebar (it must be, to click this
            // button), peek keeps `visualCollapsed` unchanged until mouseleave,
            // making the collapse look delayed/flickery instead of instant.
            peek.value = false
            store.dispatch('sidebar/toggle')
        }

        function closeMobile() {
            store.dispatch('sidebar/closeMobile')
        }

        async function handleLogout() {
            await store.dispatch('auth/logout')
            router.push({
                name: 'Login'
            })
        }

        return {
            collapsed,
            visualCollapsed,
            mobileOpen,
            activeRoute,
            user,
            initials,
            primaryRole,
            visibleNavItems,
            isActive,
            isGroupActive,
            isExpanded,
            onGroupClick,
            workspaceIcon,
            isRemixIcon,
            badgeFor,
            toggle,
            closeMobile,
            handleLogout,
            onSidebarEnter,
            onSidebarLeave,
        }
    },
}
</script>

<style scoped>
/* Width controlled here so transition works on both collapsed and mobile states */
.sidebar {
    width: 260px;
}

.sidebar--collapsed {
    width: 70px;
}

@media (max-width: 767px) {

    .sidebar,
    .sidebar--collapsed {
        width: 260px !important;
    }
}

/* Nav link states */
.nav-link:hover {
    background: #F9F9F9;
    color: #272727;
}

.nav-link--active {
    background: #EBFFED;
    color: #006500;
}

.logout-btn:hover {
    background: #FFDEDC;
    color: #9B0000;
}

/* Submenu (grouped nav items) */
.submenu {
    padding-left: 12px;
    margin-left: 12px;
    /* border-left: 1px solid #DCDCDC; */
    display: flex;
    flex-direction: column;
    gap: 2px;
}

/* Deep-nesting sections (opt-in via `deepNest`) go four levels, and the default
   24px-per-level indent plus 12px row padding leaves too little width for a
   label like "Management Dashboard" at the sidebar's fixed 260px. Tightening
   the indent buys back ~32px, which is the difference between fitting and
   truncating. Scoped to .nav-deep so the other sections are untouched. */
.nav-deep .submenu {
    padding-left: 6px;
    margin-left: 6px;
}

.nav-deep .nav-link--sub {
    padding-left: 6px;
    padding-right: 6px;
}

.nav-deep .nav-link {
    gap: 0.5rem;
}

.nav-link--sub {
    padding-left: 10px;
    padding-right: 10px;
}

/* "My Workspace" sublist */
.workspace-sublist {
    margin-left: 10px;
    /* border-left: 1px solid #DCDCDC; */
}

/* Collapse/expand labels off the same `.sidebar--collapsed` class that drives
   the sidebar's own width transition, so both animate together as one
   coordinated motion instead of two separately-timed transitions racing
   each other (which is what caused the old v-show flicker). */
.sidebar-label,
.sidebar-fade {
    opacity: 1;
    transition: opacity 180ms ease, max-width 250ms ease, margin 250ms ease;
}

.sidebar-label {
    max-width: 220px;
}

.sidebar-fade {
    max-width: 40px;
}

.sidebar--collapsed .sidebar-label,
.sidebar--collapsed .sidebar-fade {
    opacity: 0;
    max-width: 0;
    margin-left: 0 !important;
    margin-right: 0 !important;
    pointer-events: none;
}

/* Overlay fade */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.25s;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

/* Thin scrollbar for the nav list */
::-webkit-scrollbar {
    width: 2px;
    height: 6px;
}
</style>
