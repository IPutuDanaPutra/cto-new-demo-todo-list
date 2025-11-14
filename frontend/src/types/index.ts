export type TodoStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export type TodoPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: TodoStatus;
  priority: TodoPriority;
  dueDate: string | null;
  completedAt: string | null;
  userId: string;
  categoryId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  tags?: Tag[];
}

export interface ApiError {
  message: string;
  status: number;
  correlationId?: string;
}
