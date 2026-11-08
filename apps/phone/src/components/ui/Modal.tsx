import { type ModalProps, Modal as NativeModal } from 'react-native';
import { SnackbarHost } from './SnackbarProvider';

/** React Native Modal that also hosts the app snackbar, so errors show above the sheet. */
export function Modal({ children, ...props }: ModalProps) {
  return (
    <NativeModal {...props}>
      {children}
      <SnackbarHost />
    </NativeModal>
  );
}
