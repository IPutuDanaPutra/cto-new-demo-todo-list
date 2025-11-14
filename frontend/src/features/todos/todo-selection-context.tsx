import { createContext, useContext, useMemo, useState } from 'react';

interface TodoSelectionContextValue {
  selectedIds: string[];
  toggleSelection: (todoId: string) => void;
  selectAll: (todoIds: string[]) => void;
  clear: () => void;
  isSelected: (todoId: string) => boolean;
}

const TodoSelectionContext = createContext<TodoSelectionContextValue | null>(
  null
);

export const TodoSelectionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const value = useMemo<TodoSelectionContextValue>(() => {
    const toggleSelection = (todoId: string) => {
      setSelectedIds((prev) =>
        prev.includes(todoId)
          ? prev.filter((id) => id !== todoId)
          : [...prev, todoId]
      );
    };

    const selectAll = (todoIds: string[]) => {
      setSelectedIds(todoIds);
    };

    const clear = () => {
      setSelectedIds([]);
    };

    const isSelected = (todoId: string) => selectedIds.includes(todoId);

    return {
      selectedIds,
      toggleSelection,
      selectAll,
      clear,
      isSelected,
    };
  }, [selectedIds]);

  return (
    <TodoSelectionContext.Provider value={value}>
      {children}
    </TodoSelectionContext.Provider>
  );
};

export const useTodoSelection = () => {
  const context = useContext(TodoSelectionContext);
  if (!context) {
    throw new Error('useTodoSelection must be used within TodoSelectionProvider');
  }
  return context;
};
