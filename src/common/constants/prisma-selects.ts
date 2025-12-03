// Reusable Prisma select/include patterns to avoid duplication

export const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
} as const;

export const CATEGORY_INCLUDE = {
  category: true,
} as const;

export const PRODUCT_WITH_CATEGORY_INCLUDE = {
  product: {
    include: {
      category: true,
    },
  },
} as const;

export const ORDER_ITEM_INCLUDE = {
  orderItems: {
    include: {
      product: {
        include: {
          category: true,
        },
      },
    },
  },
} as const;

export const TICKET_USER_SELECT = {
  createdBy: {
    select: USER_SELECT,
  },
  assignedTo: {
    select: USER_SELECT,
  },
} as const;

export const TICKET_COMMENT_INCLUDE = {
  comments: {
    include: {
      user: {
        select: USER_SELECT,
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
} as const;

export const TICKET_COMMENT_INCLUDE_NO_INTERNAL = {
  comments: {
    where: {
      isInternal: false,
    },
    include: {
      user: {
        select: USER_SELECT,
      },
    },
    orderBy: {
      createdAt: 'asc' as const,
    },
  },
} as const;

export const FULL_TICKET_INCLUDE = {
  ...TICKET_USER_SELECT,
  order: true,
  product: true,
  ...TICKET_COMMENT_INCLUDE,
} as const;

export const FULL_TICKET_INCLUDE_NO_INTERNAL = {
  ...TICKET_USER_SELECT,
  order: true,
  product: true,
  ...TICKET_COMMENT_INCLUDE_NO_INTERNAL,
} as const;
