import { NavItem } from '../../mat-menu-list-item/src/nav-item';

/**
 *
 * @param menuItems NavItems[] to update the route with.
 * @param routePrefix The prefix to be added to the route of each NavItem in menuItems.
 * @returns NavItems[], the same array that was passed as argument 1.
 */
export function prefixNavItemsRoute(
  menuItems: NavItem[],
  routePrefix: string
): NavItem[] {
  const _updateRoute = (navItem: NavItem) => {
    if (navItem.route && !navItem.route.startsWith(routePrefix)) {
      navItem.route = routePrefix + navItem.route;
    }
    if (navItem.children) {
      navItem.children.forEach((item) => _updateRoute(item));
    }
  };
  menuItems.forEach((item) => _updateRoute(item));
  return menuItems;
}
