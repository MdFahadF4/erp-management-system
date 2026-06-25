import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const TxnEditContext = createContext(null);

export function TxnEditProvider({ children, user, onGlobalMutate }) {
  const [sheetName, setSheetName] = useState(null);
  const [record, setRecord] = useState(null);

  const openTxnEdit = useCallback((sheet, rec) => {
    setSheetName(sheet);
    setRecord(rec);
  }, []);

  const closeTxnEdit = useCallback(() => {
    setSheetName(null);
    setRecord(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      open: Boolean(sheetName && record),
      sheetName,
      record,
      openTxnEdit,
      closeTxnEdit,
      onGlobalMutate
    }),
    [user, sheetName, record, openTxnEdit, closeTxnEdit, onGlobalMutate]
  );

  return <TxnEditContext.Provider value={value}>{children}</TxnEditContext.Provider>;
}

export function useTxnEdit() {
  const ctx = useContext(TxnEditContext);
  if (!ctx) {
    throw new Error('useTxnEdit must be used within TxnEditProvider');
  }
  return ctx;
}
