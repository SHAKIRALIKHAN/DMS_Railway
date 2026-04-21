
export interface TCodeInfo {
  module: string;
  parentModule: string;
  tCode: string;
  transactionName: string;
  actionType: 'Create' | 'Change' | 'Display' | 'Manage' | 'Delete' | 'Report';
  roleAssociation: string;
  description: string;
}

export const TCODES: TCodeInfo[] = [
  // Master Data - Salesman
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM01',
    transactionName: 'Salesman Overview',
    actionType: 'Display',
    roleAssociation: 'Z_SALESMAN_VIEWER',
    description: 'Overview of all active and inactive salesmen.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM05',
    transactionName: 'Manage Salesmen',
    actionType: 'Manage',
    roleAssociation: 'Z_SALESMAN_MANAGER',
    description: 'Update salesman contact information and status.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM07',
    transactionName: 'Create Salesman',
    actionType: 'Create',
    roleAssociation: 'Z_SALESMAN_ADMIN',
    description: 'Onboard new salesman into the distribution system.'
  },
  {
    module: 'Salesman Management',
    parentModule: 'Master Data',
    tCode: 'SM08',
    transactionName: 'Delete Salesman Record',
    actionType: 'Delete',
    roleAssociation: 'Z_SALESMAN_ADMIN',
    description: 'Archive or remove a salesman record.'
  },

  // Master Data - Product
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR01',
    transactionName: 'Product Overview',
    actionType: 'Display',
    roleAssociation: 'Z_PRODUCT_VIEWER',
    description: 'List all products with basic trade and retail prices.'
  },
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR02',
    transactionName: 'Manage Product Data',
    actionType: 'Manage',
    roleAssociation: 'Z_PRODUCT_MASTER',
    description: 'Update product descriptions, brands, and prices.'
  },
  {
    module: 'Product Management',
    parentModule: 'Master Data',
    tCode: 'PR03',
    transactionName: 'Create Product',
    actionType: 'Create',
    roleAssociation: 'Z_PRODUCT_MASTER',
    description: 'Define new SKUs in the inventory system.'
  },

  // Master Data - Shop
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH01',
    transactionName: 'Shop Overview',
    actionType: 'Display',
    roleAssociation: 'Z_SHOP_VIEWER',
    description: 'View list of all registered shops and routes.'
  },
  {
    module: 'Shop Management',
    parentModule: 'Master Data',
    tCode: 'SH05',
    transactionName: 'Register New Shop',
    actionType: 'Create',
    roleAssociation: 'Z_SHOP_ADMIN',
    description: 'Register a new retailer or mart for delivery.'
  },

  // Inventory
  {
    module: 'Inventory Control',
    parentModule: 'Inventory',
    tCode: 'IN01',
    transactionName: 'Stock Status Report',
    actionType: 'Report',
    roleAssociation: 'Z_STOCK_CLERK',
    description: 'Current real-time stock levels of all products.'
  },
  {
    module: 'Inventory Control',
    parentModule: 'Inventory',
    tCode: 'IN05',
    transactionName: 'Material Group Maintenance',
    actionType: 'Manage',
    roleAssociation: 'Z_STOCK_MANAGER',
    description: 'Define and link product categories (groups).'
  },

  // Sales/Transactions
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'OR01',
    transactionName: 'Booking Overview',
    actionType: 'Display',
    roleAssociation: 'Z_ORDER_VIEWER',
    description: 'Track daily booking progress and history.'
  },
  {
    module: 'Order Management',
    parentModule: 'Sales',
    tCode: 'OR05',
    transactionName: 'New Sale Order',
    actionType: 'Create',
    roleAssociation: 'Z_ORDER_BOOKER',
    description: 'Create individual booking for a shop client.'
  },

  // Logistics
  {
    module: 'Logistics',
    parentModule: 'Logistics',
    tCode: 'DL01',
    transactionName: 'Delivery Fleet Status',
    actionType: 'Display',
    roleAssociation: 'Z_LOGISTICS_COORD',
    description: 'Status of all drivers and delivery vehicles.'
  },
  {
    module: 'Logistics',
    parentModule: 'Logistics',
    tCode: 'DL05',
    transactionName: 'Generate Daily Load Plan',
    actionType: 'Manage',
    roleAssociation: 'Z_LOGISTICS_ADMIN',
    description: 'Assign orders to vehicles for delivery.'
  }
];
