export interface NavItem {
  displayName: string;
  disabled?: boolean;
  iconName: string;
  iconType?: 'mat' | 'bi' | 'fa'; // mat - material, bi - bootstrap icon, fa - font awesome, defaults to 'mat', if not specified
  route?: string;
  children?: NavItem[];
  backButton?: boolean;
}
