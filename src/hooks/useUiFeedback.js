export function useUiFeedback({
  setNotice,
  setConfirmDialog,
  confirmDialog,
}) {
    const showNotice = (message, type = "success") => {
      const id = Date.now();
      setNotice({ id, text: message, type });
      setTimeout(() => {
        setNotice((current) => (current?.id === id ? null : current));
      }, 3200);
    };

    const askConfirm = ({ title, message, confirmLabel = "Confirmă", cancelLabel = "Renunță", danger = false, onConfirm }) => {
      setConfirmDialog({ title, message, confirmLabel, cancelLabel, danger, onConfirm });
    };

    const executeConfirm = async () => {
      const action = confirmDialog?.onConfirm;
      setConfirmDialog(null);
      if (action) await action();
    };

  return {
    showNotice,
    askConfirm,
    executeConfirm,
  };
}
