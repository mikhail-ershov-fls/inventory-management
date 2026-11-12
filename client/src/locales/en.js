export default {
  // Navigation
  nav: {
    overview: 'Overview',
    inventory: 'Inventory',
    orders: 'Orders',
    finance: 'Finance',
    demandForecast: 'Demand Forecast',
    reports: 'Reports',
    backlog: 'Backlog',
    restocking: 'Restocking',
    sectionOperations: 'Operations',
    sectionAnalytics: 'Analytics',
    mainNavigation: 'Main navigation',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    collapseSidebar: 'Collapse sidebar',
    expandSidebar: 'Expand sidebar',
    companyName: 'Catalyst Components',
    subtitle: 'Inventory Management System'
  },

  // Dashboard
  dashboard: {
    title: 'Overview',
    kpi: {
      title: 'Key Performance Indicators',
      inventoryTurnover: 'Inventory Turnover Rate',
      ordersFulfilled: 'Orders Fulfilled',
      orderFillRate: 'Order Fill Rate',
      revenue: 'Revenue (Orders)',
      revenueYTD: 'Revenue (Orders) YTD',
      revenueMTD: 'Revenue (Orders) MTD',
      avgProcessingTime: 'Avg Processing Time (Days)',
      goal: 'Goal'
    },
    summary: {
      title: 'Summary'
    },
    orderHealth: {
      title: 'Order Health',
      totalOrders: 'Total Orders',
      revenue: 'Revenue',
      avgOrderValue: 'Avg Order Value',
      onTimeRate: 'On-Time Rate',
      avgFulfillmentDays: 'Avg Fulfillment (Days)',
      total: 'Total'
    },
    ordersByMonth: {
      title: 'Orders by Month'
    },
    inventoryValue: {
      title: 'Inventory Value by Category'
    },
    inventoryShortages: {
      title: 'Inventory Shortages',
      noShortages: 'No inventory shortages - all orders can be fulfilled!',
      noData: 'No inventory data for selected filters',
      orderId: 'Order ID',
      sku: 'SKU',
      itemName: 'Item Name',
      quantityNeeded: 'Quantity Needed',
      quantityAvailable: 'Quantity Available',
      shortage: 'Shortage',
      daysDelayed: 'Days Delayed',
      priority: 'Priority',
      unitsShort: 'units short',
      days: 'days'
    },
    topProducts: {
      title: 'Top Products by Revenue',
      sku: 'SKU',
      product: 'Product',
      category: 'Category',
      warehouse: 'Warehouse',
      stockStatus: 'Stock Status',
      revenue: 'Revenue',
      unitsOrdered: 'Units Ordered',
      firstOrder: 'First Order',
      inStock: 'In Stock',
      lowStock: 'Low Stock'
    }
  },

  // Inventory
  inventory: {
    title: 'Inventory',
    description: 'Track and manage all inventory items',
    stockLevels: 'Stock Levels',
    skus: 'SKUs',
    searchPlaceholder: 'Search by item name...',
    clearSearch: 'Clear search',
    exportCsv: 'Export CSV',
    exportCsvTitle: 'Download the items currently shown as a CSV file',
    totalItems: 'Total Items',
    totalValue: 'Total Value',
    lowStockItems: 'Low Stock Items',
    warehouses: 'Warehouses',
    table: {
      sku: 'SKU',
      itemName: 'Item Name',
      name: 'Name',
      category: 'Category',
      warehouse: 'Warehouse',
      quantity: 'Quantity',
      quantityOnHand: 'Quantity on Hand',
      reorderPoint: 'Reorder Point',
      unitCost: 'Unit Cost',
      unitPrice: 'Unit Price',
      totalValue: 'Total Value',
      location: 'Location',
      status: 'Status'
    }
  },

  // Orders
  orders: {
    title: 'Orders',
    description: 'View and manage customer orders',
    allOrders: 'All Orders',
    totalOrders: 'Total Orders',
    totalRevenue: 'Total Revenue',
    avgOrderValue: 'Avg Order Value',
    onTimeDelivery: 'On-Time Delivery',
    itemsCount: '{count} items',
    quantity: 'Qty',
    submittedOrders: 'Submitted Orders',
    noSubmittedOrders: 'No restocking orders yet. Place one from the Restocking tab.',
    submittedTable: {
      orderId: 'Order ID',
      submitted: 'Submitted',
      leadTime: 'Lead Time',
      expectedDelivery: 'Expected Delivery',
      total: 'Total',
      status: 'Status'
    },
    submittedStatus: 'Submitted',
    leadTimeDays: '{count} days',
    table: {
      orderNumber: 'Order Number',
      orderId: 'Order ID',
      orderDate: 'Order Date',
      date: 'Date',
      customer: 'Customer',
      category: 'Category',
      warehouse: 'Warehouse',
      items: 'Items',
      value: 'Value',
      totalValue: 'Total Value',
      status: 'Status',
      expectedDelivery: 'Expected Delivery',
      actualDelivery: 'Actual Delivery'
    }
  },

  // Finance/Spending
  finance: {
    title: 'Finance Dashboard',
    description: 'Track revenue, costs, and financial performance',
    totalRevenue: 'Total Revenue',
    totalCosts: 'Total Costs',
    netProfit: 'Net Profit',
    avgOrderValue: 'Avg Order Value',
    fromOrders: 'From {count} orders',
    costBreakdown: 'Procurement + Operational + Labor + Overhead',
    margin: 'margin',
    perOrderRevenue: 'Per order revenue',
    revenueVsCosts: {
      title: 'Monthly Revenue vs Costs',
      revenue: 'Revenue',
      costs: 'Total Costs'
    },
    monthlyCostFlow: {
      title: 'Monthly Cost Flow',
      procurement: 'Procurement',
      operational: 'Operational',
      labor: 'Labor',
      overhead: 'Overhead'
    },
    categorySpending: {
      title: 'Spending by Category',
      ofTotal: 'of total'
    },
    transactions: {
      title: 'Recent Transactions',
      id: 'ID',
      description: 'Description',
      vendor: 'Vendor',
      date: 'Date',
      amount: 'Amount'
    }
  },

  // Demand Forecast
  reports: {
    title: 'Performance Reports',
    description: 'View quarterly performance metrics and monthly trends',
    quarterlyPerformance: 'Quarterly Performance',
    quarter: 'Quarter',
    totalOrders: 'Total Orders',
    totalRevenue: 'Total Revenue',
    avgOrderValue: 'Avg Order Value',
    fulfillmentRate: 'Fulfillment Rate',
    monthlyRevenueTrend: 'Monthly Revenue Trend',
    monthOverMonth: 'Month-over-Month Analysis',
    month: 'Month',
    orders: 'Orders',
    revenue: 'Revenue',
    change: 'Change',
    growthRate: 'Growth Rate',
    totalRevenueSelected: 'Total Revenue (Selected Period)',
    avgMonthlyRevenue: 'Avg Monthly Revenue',
    totalOrdersSelected: 'Total Orders (Selected Period)',
    bestQuarter: 'Best Performing Quarter',
    noData: 'No orders match the current filters'
  },

  demand: {
    title: 'Demand Forecast',
    description: 'Analyze demand trends and forecasts',
    increasingDemand: 'Increasing Demand',
    stableDemand: 'Stable Demand',
    decreasingDemand: 'Decreasing Demand',
    itemsCount: '{count} items',
    more: 'more...',
    demandForecasts: 'Demand Forecasts',
    table: {
      sku: 'SKU',
      itemName: 'Item Name',
      currentDemand: 'Current Demand',
      forecastedDemand: 'Forecasted Demand',
      change: 'Change',
      trend: 'Trend',
      period: 'Period'
    }
  },

  // Filters
  filters: {
    timePeriod: 'Time Period',
    location: 'Location',
    category: 'Category',
    orderStatus: 'Order Status',
    all: 'All',
    allMonths: 'All Months'
  },

  // Statuses
  status: {
    delivered: 'Delivered',
    shipped: 'Shipped',
    processing: 'Processing',
    backordered: 'Backordered',
    inStock: 'In Stock',
    lowStock: 'Low Stock',
    adequate: 'Adequate'
  },

  // Trends
  trends: {
    increasing: 'increasing',
    stable: 'stable',
    decreasing: 'decreasing'
  },

  // Priority
  priority: {
    high: 'High',
    medium: 'Medium',
    low: 'Low'
  },

  // Categories
  categories: {
    circuitBoards: 'Circuit Boards',
    sensors: 'Sensors',
    actuators: 'Actuators',
    controllers: 'Controllers',
    powerSupplies: 'Power Supplies'
  },

  // Spending Categories
  spendingCategories: {
    rawMaterials: 'Raw Materials',
    components: 'Components',
    equipment: 'Equipment',
    consumables: 'Consumables'
  },

  // Warehouses
  warehouses: {
    sanFrancisco: 'San Francisco',
    london: 'London',
    tokyo: 'Tokyo'
  },

  // Months
  months: {
    jan: 'Jan',
    feb: 'Feb',
    mar: 'Mar',
    apr: 'Apr',
    may: 'May',
    jun: 'Jun',
    jul: 'Jul',
    aug: 'Aug',
    sep: 'Sep',
    oct: 'Oct',
    nov: 'Nov',
    dec: 'Dec',
    january: 'January',
    february: 'February',
    march: 'March',
    april: 'April',
    june: 'June',
    july: 'July',
    august: 'August',
    september: 'September',
    october: 'October',
    november: 'November',
    december: 'December'
  },

  // Profile Menu
  profile: {
    profileDetails: 'Profile Details',
    myTasks: 'My Tasks',
    logout: 'Logout'
  },

  // Profile Details Modal
  profileDetails: {
    title: 'Profile Details',
    email: 'Email',
    department: 'Department',
    location: 'Location',
    phone: 'Phone',
    joinDate: 'Join Date',
    employeeId: 'Employee ID',
    close: 'Close'
  },

  // Tasks Modal
  tasks: {
    title: 'My Tasks',
    taskTitle: 'Task Title',
    taskTitlePlaceholder: 'Enter task title...',
    priority: 'Priority',
    dueDate: 'Due Date',
    addTask: 'Add Task',
    noTasks: 'No tasks yet. Add your first task above!'
  },

  // Language
  theme: {
    switchToDark: 'Switch to dark theme',
    switchToLight: 'Switch to light theme'
  },

  language: {
    english: 'English',
    japanese: 'Japanese',
    selectLanguage: 'Select Language'
  },

  // Purchase Orders
  purchaseOrder: {
    createButton: 'Create PO',
    viewButton: 'View PO',
    createTitle: 'Create Purchase Order',
    viewTitle: 'Purchase Order',
    sku: 'SKU',
    shortage: 'Shortage',
    units: 'units',
    supplierName: 'Supplier Name',
    supplierPlaceholder: 'Enter supplier name',
    quantity: 'Quantity',
    unitCost: 'Unit Cost (USD)',
    unitCostLabel: 'Unit Cost',
    expectedDelivery: 'Expected Delivery',
    createdDate: 'Created Date',
    total: 'Total',
    notes: 'Notes',
    optional: 'optional',
    notesPlaceholder: 'Add any notes for this order',
    noNotes: 'No notes',
    submit: 'Create Purchase Order',
    submitting: 'Creating...',
    status: {
      pending: 'Pending',
      ordered: 'Ordered',
      shipped: 'Shipped',
      received: 'Received',
      cancelled: 'Cancelled'
    },
    validation: {
      supplierRequired: 'Supplier name is required',
      quantityInvalid: 'Quantity must be a whole number greater than 0',
      unitCostInvalid: 'Unit cost must be greater than 0',
      dateRequired: 'Expected delivery date is required',
      datePast: 'Expected delivery date cannot be in the past'
    },
    errors: {
      createFailed: 'Failed to create purchase order',
      loadFailed: 'Failed to load purchase order',
      notFound: 'No purchase order found for this item'
    }
  },

  restocking: {
    title: 'Restocking',
    description: 'Plan a restocking order from the demand forecast within your budget',
    budget: 'Available Budget',
    budgetHint: 'Covering every forecast gap costs {amount}',
    planned: 'Order Total',
    remaining: 'Remaining Budget',
    leadTime: 'Delivery Lead Time',
    days: '{count} days',
    recommended: 'Recommended Items',
    selectedCount: '{selected} of {total} selected',
    noRecommendations: 'No items fit this budget. Raise the budget to see recommendations.',
    partial: 'Partial',
    include: 'Include {name}',
    table: {
      sku: 'SKU',
      item: 'Item',
      trend: 'Trend',
      gap: 'Demand Gap',
      quantity: 'Order Qty',
      unitCost: 'Unit Cost',
      lineTotal: 'Line Total',
      leadTime: 'Lead Time'
    },
    placeOrder: 'Place Order',
    placing: 'Placing order...',
    success: 'Order {id} submitted. Expected delivery {date}.',
    viewOrders: 'View in Orders',
    errors: {
      submitFailed: 'Failed to place the restocking order'
    }
  },

  // Common
  common: {
    loading: 'Loading...',
    loadError: 'Could not load data. Check your connection and try again.',
    retry: 'Retry',
    error: 'Error',
    noData: 'No data available',
    viewDetails: 'View Details',
    close: 'Close',
    save: 'Save',
    cancel: 'Cancel',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    items: 'items'
  }
}
